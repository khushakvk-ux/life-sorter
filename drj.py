# app.py
# ---------------------------------------------------------
# Streamlit + PyTesseract OCR + OpenAI Question Engine MVP
# - Upload PDF
# - OCR each page using pytesseract (with progress + timer)
# - Page-wise question extraction to avoid truncation
# - Image support for questions that reference figures/diagrams
# ---------------------------------------------------------

import os
import time
import json
from typing import List, Dict, Tuple

import streamlit as st
import pandas as pd
from PIL import Image
import fitz  # PyMuPDF
import pytesseract
from openai import OpenAI

HIGH_CONFIDENCE_THRESHOLD = 0.95

# -----------------------------
# 0. CONFIG: TESSERACT PATH
# -----------------------------
# 👇 Point pytesseract to your Tesseract-OCR install (Windows path)
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Users\vishal tiwari\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"
)

# -----------------------------
# 0.1 OPENAI CLIENT (CONFIGURABLE KEY)
# -----------------------------
def build_openai_client(user_api_key: str | None) -> OpenAI | None:
    """
    Build an OpenAI client using a provided key or the OPENAI_API_KEY env var.

    Returns None and shows a Streamlit error if no key is available.
    """

    api_key = user_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key:
        st.error("Please provide an OpenAI API key to run extraction.")
        return None

    return OpenAI(api_key=api_key)

# -----------------------------
# 1. SYSTEM PROMPT TEMPLATES (DUAL ENGINES)
# -----------------------------
ENGINE_A_PROMPT = """
You are an expert exam question parser for competitive exams like NEET and JEE.

You will receive raw OCR text from a SINGLE PAGE of a PDF that contains questions,
options, answers, and sometimes solutions/explanations. The OCR text may have line
breaks, spacing issues, and minor typos. Some PDFs include an ANSWER KEY or SOLUTION
KEY at the end of the document—treat those pages carefully.

Your task:

1. Identify individual questions present ONLY on this page.
2. For each question or answer-key entry, extract and structure the information as a
   JSON object with the following keys:
   - "id": an integer index starting from 1 for THIS PAGE
   - "question": the full question stem as a single string
   - "options": a list of strings for the options in order (["A. ...", "B. ...", ...]).
               If no options are present, return an empty list.
   - "answer": the correct answer or correct option label if clearly present.
               If not clearly available, set it to null.
   - "explanation": a solution or explanation if clearly present; otherwise null.
   - "page": the integer page number as provided in the user message (e.g. 3).
   - "has_figure": a boolean:
        true  -> if the question clearly refers to a diagram/figure/image/table
                 (e.g. "see the figure below", "in the given diagram", etc.)
        false -> otherwise.
   - "confidence": a float between 0 and 1 representing how certain you are that the
        OCR text for this question is complete and correct. Use 1.0 only when the
        question/answer/options are unambiguous and clean. Use values below 0.7 when
        the OCR is noisy, truncated, or unclear.

Rules and Constraints:
- The text you receive corresponds to ONE page only. Do not invent questions
  from other pages.
- Pages that look like an ANSWER KEY (e.g., numbered answers with little text) should
  still emit structured entries. When only answers are given, set "question" to a short
  description like "Answer key entry for Question 12" and capture the detected answer
  in "answer"; leave "options" empty unless they are explicitly shown.
- Return STRICTLY valid JSON.
- The final output must be a JSON array of objects: [ { ... }, { ... }, ... ].
- Do NOT include any extra commentary before or after the JSON.
- Merge multi-line stems into a single "question" string.
- Normalize options, e.g. "(a)", "(b)", "A)", "1)" all become clean strings in "options".
- Ignore page headers, footers, and noise that are clearly not part of questions.
- If OCR artifacts cause partial duplication, try to clean them reasonably.
""".strip()

ENGINE_B_PROMPT = ENGINE_A_PROMPT


# -----------------------------
# 2. OCR: PDF -> images
# -----------------------------
def pdf_to_images(pdf_bytes: bytes, dpi: int = 300) -> List[Image.Image]:
    """
    Convert a PDF (bytes) to a list of PIL Image objects using PyMuPDF.
    This avoids the need for Poppler.
    """
    pages: List[Image.Image] = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    zoom = dpi / 72  # 72 is default PDF DPI
    mat = fitz.Matrix(zoom, zoom)

    for page in doc:
        pix = page.get_pixmap(matrix=mat)
        mode = "RGBA" if pix.alpha else "RGB"
        img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
        pages.append(img)

    return pages


def ocr_pages_with_texts(
    pages: List[Image.Image],
    progress_bar,
    page_text_placeholder,
    timer_placeholder,
) -> Tuple[str, List[str]]:
    """
    Run pytesseract on each page and return:
      - combined_text: a single string with page headers (for display)
      - page_texts: a list of raw OCR text per page (without headers)

    Also updates:
      - progress_bar: st.progress
      - page_text_placeholder: "Page X of N"
      - timer_placeholder: elapsed seconds from OCR start
    """
    full_text_chunks: List[str] = []
    page_texts: List[str] = []
    total_pages = len(pages)

    start_time_ocr = time.time()

    for idx, page in enumerate(pages, start=1):
        text = pytesseract.image_to_string(page, lang="eng")
        page_texts.append(text)

        page_header = f"\n\n--- PAGE {idx} ---\n"
        full_text_chunks.append(page_header + text)

        # Progress bar (0–1)
        if total_pages > 0:
            progress_bar.progress(idx / total_pages)

        # Page counter
        page_text_placeholder.markdown(f"**OCR Page:** {idx} / {total_pages}")

        # Timer
        elapsed = time.time() - start_time_ocr
        timer_placeholder.markdown(f"⏱️ **OCR elapsed:** {elapsed:.1f} seconds")

    combined_text = "".join(full_text_chunks)
    return combined_text, page_texts


# -----------------------------
# 3. CLEAN MODEL OUTPUT + CALL
# -----------------------------
def _clean_model_output(content: str) -> str:
    """
    If the model accidentally wraps JSON in ``` ``` or ```json fences,
    strip them out so json.loads works.
    """
    content = content.strip()
    if content.startswith("```"):
        lines = content.splitlines()
        if lines:
            lines = lines[1:]  # drop first line (``` or ```json)
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        content = "\n".join(lines).strip()
    return content


def call_question_engine_openai_for_page(
    page_text: str,
    page_number: int,
    client: OpenAI,
    system_prompt: str,
) -> List[Dict]:
    """
    Call OpenAI with SYSTEM_PROMPT + OCR text for a SINGLE PAGE.
    The model must return a JSON array of question objects for that page.
    """
    # Skip empty/near-empty pages
    if not page_text or not page_text.strip():
        return []

    user_content = (
        f"The following OCR text is from page {page_number} of a PDF.\n\n"
        f"{page_text}"
    )

    try:
        resp = client.chat.completions.create(
            model="gpt-4.1-mini",  # change if you want another model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.1,
        )
        content = resp.choices[0].message.content.strip()
        content = _clean_model_output(content)

        questions = json.loads(content)
        if not isinstance(questions, list):
            st.error(
                f"Model did not return a JSON array for page {page_number}. Skipping this page."
            )
            return []

        # Ensure page field is correct for all questions
        for q in questions:
            q["page"] = page_number
            # Default confidence if the model omitted it
            if "confidence" not in q:
                q["confidence"] = 0.0

        return questions
    except json.JSONDecodeError:
        st.error(
            f"Failed to parse JSON from model response on page {page_number}. Skipping this page."
        )
        return []
    except Exception as e:
        st.error(f"Error calling OpenAI API on page {page_number}: {e}")
        return []


def extract_questions_pagewise(
    page_texts: List[str], clients: List[OpenAI], system_prompts: List[str]
) -> List[Dict]:
    """
    Loop over all pages, call the model per page, and merge results.
    Uses multiple clients/prompts in parallel (alternating per page) to reduce latency.
    """
    if not clients:
        return []

    all_questions: List[Dict] = []
    global_id = 1

    total_pages = len(page_texts)
    progress = st.progress(0.0)
    status = st.empty()

    futures = []
    future_to_page: Dict = {}
    results_by_page: Dict[int, List[Dict]] = {}

    from concurrent.futures import ThreadPoolExecutor, as_completed

    with ThreadPoolExecutor(max_workers=len(clients)) as executor:
        for page_number, page_text in enumerate(page_texts, start=1):
            client_idx = (page_number - 1) % len(clients)
            prompt_idx = (page_number - 1) % len(system_prompts)
            future = executor.submit(
                call_question_engine_openai_for_page,
                page_text,
                page_number,
                clients[client_idx],
                system_prompts[prompt_idx],
            )
            futures.append(future)
            future_to_page[future] = page_number

        completed = 0
        for future in as_completed(futures):
            page_number = future_to_page[future]
            status.markdown(
                f"🔍 **Extracting questions from page {page_number} / {total_pages}...**"
            )
            page_questions = future.result()
            results_by_page[page_number] = page_questions
            completed += 1
            if total_pages > 0:
                progress.progress(completed / total_pages)

    for page_number in range(1, total_pages + 1):
        page_questions = results_by_page.get(page_number, [])
        for q in page_questions:
            q["id"] = global_id
            global_id += 1
            all_questions.append(q)

    status.markdown("✅ **Question extraction completed for all pages.**")
    return all_questions


def build_training_dataset(
    questions: List[Dict], confidence_threshold: float = HIGH_CONFIDENCE_THRESHOLD
) -> Tuple[str, int]:
    """
    Build a JSONL training dataset using only high-confidence questions.

    Each JSONL line is a chat-style example suitable for OpenAI fine-tuning.
    Only questions with confidence >= threshold and a non-empty answer are included.
    """

    lines: List[str] = []
    for q in questions:
        if q.get("confidence", 0.0) < confidence_threshold:
            continue

        question_text = (q.get("question") or "").strip()
        answer = q.get("answer")
        explanation = (q.get("explanation") or "").strip()
        options = q.get("options") or []

        if not question_text or answer is None or str(answer).strip() == "":
            continue

        options_block = ""
        if options:
            options_block = "Options:\n" + "\n".join(options)

        user_prompt = question_text
        if options_block:
            user_prompt = f"{user_prompt}\n\n{options_block}"

        assistant_reply = f"Answer: {answer}"
        if explanation:
            assistant_reply = f"{assistant_reply}\nExplanation: {explanation}"

        example = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful tutor who answers exam questions concisely.",
                },
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": assistant_reply},
            ],
            "metadata": {
                "source_page": q.get("page"),
                "question_id": q.get("id"),
                "has_figure": bool(q.get("has_figure", False)),
                "confidence": q.get("confidence", 0.0),
            },
        }

        lines.append(json.dumps(example, ensure_ascii=False))

    return "\n".join(lines), len(lines)


# -----------------------------
# 4. STREAMLIT UI
# -----------------------------
def main():
    st.set_page_config(
        page_title="OCR Question Extractor",
        page_icon="📝",
        layout="wide",
    )

    st.title("📝 OCR Question Extractor (PyTesseract + OpenAI MVP)")

    st.markdown(
        """
**Flow of this tool:**

1. Upload a **PDF** (even scanned).
2. We convert PDF → images and then run **PyTesseract OCR** on each page  
   with a **progress bar**, **page counter**, and **timer**.
3. We show:
   - The **raw OCR text** (optional, with page separators).
   - The **system prompt**.
4. We call **OpenAI per page** to extract structured questions as JSON:
   - No artificial ~100-question cap (page-wise).
   - Each question has `"page"` and `"has_figure"`.
5. For any question with `"has_figure": true`, we show the corresponding **page image**.
"""
    )

    uploaded_file = st.file_uploader(
        "Upload a PDF file", type=["pdf"], accept_multiple_files=False
    )

    api_key_input = st.text_input(
        "OpenAI API key",  # not persisted
        type="password",
        help=(
            "Required to call the OpenAI API. The OPENAI_API_KEY environment variable "
            "is used if left blank."
        ),
    )

    api_key_input_secondary = st.text_input(
        "Second OpenAI API key (optional)",
        type="password",
        help=(
            "Use a second key to run two AI engines in parallel. If left blank, the "
            "primary key will be reused so both engines still run."
        ),
    )

    show_ocr_text = st.checkbox(
        "Show raw OCR text", value=True, help="Useful for debugging."
    )

    if uploaded_file is not None:
        if st.button("Run OCR & Extract Questions", type="primary"):
            primary_client = build_openai_client(api_key_input)
            if primary_client is None:
                return

            secondary_client = (
                build_openai_client(api_key_input_secondary)
                if api_key_input_secondary
                else primary_client
            )
            clients = [primary_client, secondary_client]
            system_prompts = [ENGINE_A_PROMPT, ENGINE_B_PROMPT]
            # Read PDF bytes
            pdf_bytes = uploaded_file.read()

            # Step 1: PDF -> Images
            with st.spinner("Converting PDF to images..."):
                pages = pdf_to_images(pdf_bytes)

            total_pages = len(pages)
            st.info(f"📄 **Total pages detected:** {total_pages}")

            # Step 2: OCR Progress UI
            st.subheader("🔄 OCR Progress")

            progress_bar = st.progress(0)
            col1, col2 = st.columns(2)
            with col1:
                page_text_placeholder = st.empty()
            with col2:
                timer_placeholder = st.empty()

            # Run OCR with live page counter + timer
            with st.spinner("Running OCR on PDF pages..."):
                combined_ocr_text, page_texts = ocr_pages_with_texts(
                    pages=pages,
                    progress_bar=progress_bar,
                    page_text_placeholder=page_text_placeholder,
                    timer_placeholder=timer_placeholder,
                )

            st.success("✅ OCR completed.")

            # Step 3: Show OCR text (optional)
            if show_ocr_text:
                with st.expander("Raw OCR Text (All Pages)", expanded=False):
                    st.text_area(
                        "OCR Output",
                        value=combined_ocr_text[:50000],  # limit for UI safety
                        height=400,
                    )

            # Step 4: Show system prompts for both engines
            st.subheader("🧠 System Prompts for Question Extraction (Dual Engines)")
            st.markdown(
                "Two prompts are used in parallel (engine A & engine B). They can share the same API "
                "key or use separate keys for added throughput."
            )
            tab_a, tab_b = st.tabs(["Engine A", "Engine B"])
            with tab_a:
                st.code(ENGINE_A_PROMPT, language="markdown")
            with tab_b:
                st.code(ENGINE_B_PROMPT, language="markdown")

            st.markdown(
                """
We now run **page-wise extraction**, so large documents with 150+ questions
are handled more reliably, and each question knows its **page number**.
"""
            )

            # Step 5: Page-wise question extraction
            st.subheader("🤖 Extracting Questions (Page-wise, Dual Engines)")
            with st.spinner(
                "Calling OpenAI with two parallel engines to extract structured questions..."
            ):
                questions = extract_questions_pagewise(
                    page_texts, clients=clients, system_prompts=system_prompts
                )

            if not questions:
                st.warning(
                    "No questions returned by the engine. "
                    "Either the model failed, the JSON was invalid, or the PDF had no detectable questions."
                )
                return

            st.subheader(f"📚 Extracted Questions — {len(questions)}")

            # Step 6: Question-by-question view with optional images
            for q in questions:  # show all; you can slice if needed
                q_id = q.get("id", "")
                q_text = (q.get("question") or "").strip()
                page_num = q.get("page", None)
                has_figure = bool(q.get("has_figure", False))

                title_prefix = f"Q{q_id}"
                if page_num is not None:
                    title_prefix += f" (Page {page_num})"

                title_preview = q_text[:100] + ("..." if len(q_text) > 100 else "")

                with st.expander(f"{title_prefix}: {title_preview}"):
                    st.markdown(f"**Question {q_id} (Page {page_num}):**")
                    st.write(q_text)

                    options = q.get("options") or []
                    if options:
                        st.markdown("**Options:**")
                        for opt in options:
                            st.write(f"- {opt}")

                    st.markdown(f"**Answer:** `{q.get('answer')}`")
                    st.markdown(f"**Explanation:** {q.get('explanation')}")

                    # If has_figure, show the corresponding page image
                    if has_figure and page_num is not None:
                        st.markdown("**Associated Page Image (for figure/diagram):**")
                        # page_num is 1-based, list is 0-based
                        idx = page_num - 1
                        if 0 <= idx < len(pages):
                            st.image(
                                pages[idx],
                                caption=f"Page {page_num} (source for figure/diagram)",
                                use_column_width=True,
                            )
                        else:
                            st.warning(
                                f"Could not load image for page {page_num} (index out of range)."
                            )

            # Step 7: Table view (compact, all questions)
            table_rows = []
            for q in questions:
                table_rows.append(
                    {
                        "ID": q.get("id", ""),
                        "Page": q.get("page", ""),
                        "Has Figure": q.get("has_figure", False),
                        "Question": (q.get("question") or "")[:200],
                        "Answer": q.get("answer", ""),
                    }
                )

            if table_rows:
                df = pd.DataFrame(table_rows)
                st.markdown("### Table View (All Extracted Questions)")
                st.dataframe(df, use_container_width=True)

            # High-confidence training dataset (JSONL)
            st.subheader("📦 Training Dataset (High-Confidence Only)")
            st.markdown(
                "Only questions the model marked with very high confidence are exported. "
                f"Threshold: {HIGH_CONFIDENCE_THRESHOLD:.2f} confidence or higher."
            )
            training_jsonl, training_count = build_training_dataset(questions)
            if training_count:
                st.success(
                    f"Prepared {training_count} high-confidence examples for fine-tuning."
                )
                st.download_button(
                    label="⬇️ Download Training Dataset (JSONL)",
                    data=training_jsonl,
                    file_name="training_dataset.jsonl",
                    mime="application/json",
                )
            else:
                st.warning(
                    "No high-confidence questions were found. Increase OCR quality or lower the "
                    "confidence threshold in code if appropriate."
                )

            # Optional: Download JSON of all questions
            json_str = json.dumps(questions, ensure_ascii=False, indent=2)
            st.download_button(
                label="⬇️ Download Questions as JSON",
                data=json_str,
                file_name="extracted_questions.json",
                mime="application/json",
            )


if __name__ == "__main__":
    main()
