// Vercel Serverless Function to save ideas to Google Sheets
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userMessage, botResponse, timestamp, userName, userEmail } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'User message is required' });
    }

    // Get Google Sheets credentials from environment variables
    const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!sheetsWebhookUrl) {
      console.error('Google Sheets webhook URL not configured');
      // Don't fail the request, just log the error
      return res.status(200).json({
        success: false,
        message: 'Webhook not configured, idea not saved'
      });
    }

    // Send data to Google Sheets via webhook (Google Apps Script)
    const response = await fetch(sheetsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: timestamp || new Date().toISOString(),
        userName: userName || 'Anonymous',
        userEmail: userEmail || 'Not provided',
        userMessage,
        botResponse: botResponse || '',
        source: 'Ikshan Website - Contributor Mode'
      })
    });

    if (!response.ok) {
      console.error('Failed to save to Google Sheets:', response.status);
      return res.status(200).json({
        success: false,
        message: 'Failed to save to sheets'
      });
    }

    console.log('Idea saved to Google Sheets successfully');
    return res.status(200).json({
      success: true,
      message: 'Idea saved successfully'
    });

  } catch (error) {
    console.error('Error in save-idea handler:', error);
    return res.status(200).json({
      success: false,
      message: 'Error saving idea',
      error: error.message
    });
  }
}
