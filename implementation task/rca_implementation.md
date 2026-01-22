# Root Cause Analysis (RCA) Feature Implementation

## Overview

This document outlines the implementation of the Root Cause Analysis (RCA) feature in the Ikshan chatbot. The RCA feature helps users dive deeper into their problems by following a structured framework to identify root causes and develop corrective action plans.

---

## RCA Framework Stages

The Root Cause Analysis follows a 6-stage protocol:

1. **Problem Definition** - Understanding and defining the user's problem better through targeted questions
2. **Data Collection** - Collecting relevant data needed for accurate analysis
3. **Symptom Identification** - Identifying symptoms that may be going unnoticed (Coming Soon)
4. **Cause Identification** - Identifying potential causes (Coming Soon)
5. **Root Cause Validation** - Validating the actual root cause (Coming Soon)
6. **Corrective Action Plan** - Creating an actionable plan to address the root cause (Coming Soon)

---

## Current Implementation Coverage

### Persona Covered
- **Founder / Owner**

### Outcome Covered
- **Grow Revenue**

### Sub-Categories Implemented (8 Total)

| # | Sub-Category | Problem Definition Questions | Data Collection Items |
|---|--------------|------------------------------|----------------------|
| 1 | Social Media Content (Posts, Ads, Videos, Product Visuals) | 6 Questions | 4 Items |
| 2 | Get More Leads from Google & Website (SEO) | 6 Questions | 6 Items |
| 3 | Google & Meta Ads (ROI Improvement) | 6 Questions | 7 Items |
| 4 | Google Business Profile (GBP) | 5 Questions | 4 Items |
| 5 | Understanding Why Customers Don't Convert | 5 Questions | 8 Items |
| 6 | Selling on WhatsApp / Instagram | 5 Questions | 6 Items |
| 7 | Lead Qualification, Follow-Up & Conversion | 5 Questions | 5 Items |
| 8 | Ecommerce Listing SEO + Upsell Bundles | 5 Questions | 5 Items |

---

## Detailed Sub-Category Breakdown

### 1. Social Media Content

**Problem Definition Questions:**
- Q1. What is the main purpose of your social media content right now?
- Q2. How do you know content isn't working?
- Q3. Which best describes your current content style?
- Q4. Where does the breakdown seem to happen?
- Q5. How consistent is your content output?
- Q6. How confident are you that content contributes to revenue?

**Data Collection:**
- Instagram / Facebook / YouTube profile links
- Last 30–60 days of content
- Posts, reels, ads (whatever exists)
- Which platform brings inquiries? (if known)

---

### 2. Get More Leads from Google & Website (SEO)

**Problem Definition Questions:**
- Q1. What are you trying to improve via SEO?
- Q2. What best describes your current traffic?
- Q3. What happens to most visitors?
- Q4. Your SEO is mostly built around:
- Q5. How clear is your website's main action?
- Q6. How confident are you in SEO tracking?

**Data Collection:**
- Website URL
- Top 3 pages they want users to convert from
- Google Search Console access OR screenshots
- Queries
- Pages
- Primary CTA on website

---

### 3. Google & Meta Ads (ROI Improvement)

**Problem Definition Questions:**
- Q1. What is the main goal of running ads?
- Q2. What is the biggest concern with ads today?
- Q3. Do reported conversions match real sales?
- Q4. Where do users drop after clicking ads?
- Q5. Ads are optimized mainly for:
- Q6. How confident are you in ad ROI?

**Data Collection:**
- Landing page URL used in ads
- Ad account screenshots (last 30 days)
- Spend
- Conversions
- ROAS / CPL
- What happens after the click
- Checkout / WhatsApp / call

---

### 4. Google Business Profile (GBP)

**Problem Definition Questions:**
- Q1. What action do you want from GBP visitors?
- Q2. How is your GBP performance currently?
- Q3. Compared to competitors, your reviews are:
- Q4. What happens after inquiries?
- Q5. Your business is mostly:

**Data Collection:**
- GBP listing link
- Business category
- Reviews count + rating
- Main CTA enabled (call / website / WhatsApp)

---

### 5. Understanding Why Customers Don't Convert

**Problem Definition Questions:**
- Q1. Where do customers drop most often?
- Q2. Common customer response before leaving:
- Q3. Conversion depends mainly on:
- Q4. What do you think is the main issue?
- Q5. How structured is conversion tracking?

**Data Collection:**
- Exact conversion path
- Website → checkout
- Website → WhatsApp
- Ads → call
- Price point
- Any customer messages / chats / objections (anonymized)
- Who handles conversion
- Founder / team / automation

---

### 6. Selling on WhatsApp / Instagram

**Problem Definition Questions:**
- Q1. Where do most chats come from?
- Q2. What happens to most chats?
- Q3. Who handles conversations?
- Q4. Response time is usually:
- Q5. Is there a defined chat-to-sale flow?

**Data Collection:**
- WhatsApp business setup
- Catalog / quick replies / automation (yes/no)
- Sample chat conversations (anonymized)
- Response time expectation
- Payment flow
- Link / UPI / COD / manual

---

### 7. Lead Qualification, Follow-Up & Conversion

**Problem Definition Questions:**
- Q1. How do you define a "qualified lead"?
- Q2. What happens after first contact?
- Q3. Biggest leakage point?
- Q4. How many follow-ups usually happen?
- Q5. Lead tracking is:

**Data Collection:**
- Product listing URLs
- Top 5 products by revenue
- Bundle or combo pages (if any)
- Cart & checkout flow
- Average order value (approx)

---

### 8. Ecommerce Listing SEO + Upsell Bundles

**Problem Definition Questions:**
- Q1. What's the main revenue issue?
- Q2. Product listings are optimized for:
- Q3. Most customers buy:
- Q4. Bundles exist mainly to:
- Q5. Drop-off usually happens at:

**Data Collection:**
- Product listing URLs
- Top 5 products by revenue
- Bundle or combo pages (if any)
- Cart & checkout flow
- Average order value (approx)

---

## UI/UX Implementation

### Launch Button
- **Location:** Appears after Stage 1 solution is shown (alongside "Check Another Idea" and "Learn Implementation")
- **Condition:** Only visible when:
  - Goal = "Grow Revenue"
  - Role = "Founder / Owner"
  - A valid category is selected
- **Style:** Green gradient button with Brain icon

### Problem Definition Stage
- Questions appear one at a time
- Options displayed as clickable buttons (checkbox style)
- User's selection is recorded and next question appears
- Progress indicated through stage header

### Data Collection Stage
- Displayed as a numbered list of required inputs
- Clear visual styling with left border accent
- Continue button to proceed to summary
- Option to start a new idea

### Summary
- Shows all user responses
- Indicates upcoming stages (Coming Soon)
- Provides final action buttons

---

## Technical Implementation

### Files Modified
1. `src/components/ChatBotNew.jsx` - Main component with RCA logic
2. `src/components/ChatBotNew.css` - Styling for RCA components

### New State Variables
```javascript
const [rcaActive, setRcaActive] = useState(false);
const [rcaStage, setRcaStage] = useState('problem-definition');
const [rcaCurrentQuestionIndex, setRcaCurrentQuestionIndex] = useState(0);
const [rcaResponses, setRcaResponses] = useState({});
const [rcaData, setRcaData] = useState(null);
```

### New Functions
- `handleLaunchRCA(category)` - Initializes and launches RCA flow
- `showRCAQuestion(data, questionIndex)` - Displays RCA questions
- `handleRCAOptionSelect(option, questionIndex)` - Handles option selection
- `showDataCollectionStage(data)` - Shows data collection requirements
- `showRCASummary()` - Shows final summary with responses
- `handleRCADataCollectionContinue()` - Handles continuation after data collection
- `findRCAData(goal, role, category)` - Helper to find matching RCA data

### Data Structure
```javascript
RCA_DATA = {
  'grow-revenue': {
    'founder-owner': {
      'category-name': {
        problemDefinition: [
          { question: '...', options: ['...'] }
        ],
        dataCollection: ['...']
      }
    }
  }
}
```

---

## Future Expansion

### Additional Personas (Planned)
- Sales / Marketing
- Ops / Admin
- Finance / Legal
- HR / Recruiting
- Support / Success
- Individual / Student

### Additional Outcomes (Planned)
- Save Time
- Make Better Decisions
- Personal Growth

### Additional RCA Stages (Planned)
- Symptom Identification
- Cause Identification
- Root Cause Validation
- Corrective Action Plan (AI-generated recommendations)

---

## Source Data
- RCA data sourced from: `public/rca - RCA.csv`
- Categories data sourced from: `public/categories - Categories.csv`

---

## Date Created
January 15, 2026

## Version
1.0.0
