# OpenAI Integration Setup Guide

Your chatbot is now connected to OpenAI! Follow these steps to configure it securely.

## ⚠️ IMPORTANT: Regenerate Your API Key!

Your API key was exposed in a public message. **Immediately regenerate it** at:
https://platform.openai.com/api-keys

## 🚀 Setup Instructions

### Step 1: Local Development

1. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your **NEW** API key:
```env
OPENAI_API_KEY=sk-proj-YOUR-NEW-API-KEY-HERE
OPENAI_MODEL_NAME=gpt-4.1-nano-2025-04-14:simply-me:ikshan:Cku8w1k6
```

3. Test locally:
```bash
npm run dev
```

### Step 2: Deploy to Vercel

1. Push your code to GitHub (the .env files won't be committed - they're in .gitignore)

2. Go to your Vercel project dashboard

3. Navigate to: **Settings → Environment Variables**

4. Add these variables:
   - **Name**: `OPENAI_API_KEY`
     **Value**: Your new OpenAI API key

   - **Name**: `OPENAI_MODEL_NAME`
     **Value**: `gpt-4.1-nano-2025-04-14:simply-me:ikshan:Cku8w1k6`

5. Redeploy your site (or push a new commit to trigger auto-deploy)

## 🔒 Security Features

✅ API key stored in environment variables (never in code)
✅ Serverless function acts as middleware
✅ Frontend can't access your API key
✅ .env files are gitignored
✅ CORS enabled for your domain

## 🧪 Testing

After setup, test your chatbot:
1. Open your website
2. Send a message in the chat
3. You should get a response from your custom GPT model!

## 🐛 Troubleshooting

**"API key not configured"**
- Make sure environment variables are set in Vercel
- Redeploy after adding variables

**"Failed to get response"**
- Check Vercel function logs
- Verify your API key is valid
- Check your OpenAI account has credits

**Chatbot shows fallback message**
- Open browser console (F12) to see errors
- The API might be down or rate-limited

## 📝 How It Works

1. User sends message in chat
2. Frontend calls `/api/chat` (your Vercel function)
3. Vercel function calls OpenAI with your API key
4. Response sent back to user

Your API key never leaves the server! 🔐
