# Google Sheets Integration Setup

This guide will help you set up Google Sheets to save user ideas from the "Contribute an Idea" chatbot feature.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Ikshan - User Ideas"
4. Add the following column headers in Row 1:
   - A1: `Timestamp`
   - B1: `Name`
   - C1: `Email`
   - D1: `User Message`
   - E1: `Bot Response`
   - F1: `Source`

## Step 2: Create Google Apps Script Webhook

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Paste the following script:

```javascript
function doPost(e) {
  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);

    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Append a new row with the data
    sheet.appendRow([
      data.timestamp,
      data.userName,
      data.userEmail,
      data.userMessage,
      data.botResponse,
      data.source
    ]);

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Save** (💾 icon)
5. Click **Deploy** → **New deployment**
6. Click the gear icon (⚙️) next to "Select type" → Choose **Web app**
7. Configure:
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
8. Click **Deploy**
9. **Copy the Web App URL** (it looks like: `https://script.google.com/macros/s/.../exec`)

## Step 3: Add to Vercel Environment Variables

1. Go to your Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Key:** `GOOGLE_SHEETS_WEBHOOK_URL`
   - **Value:** [Paste the Web App URL you copied]
5. Apply to all environments (Production, Preview, Development)
6. Redeploy your application

## Step 4: Test the Integration

1. Visit your Ikshan website
2. Click "Contribute an Idea"
3. Click one of the suggestion prompts or type a message
4. Check your Google Sheet - a new row should appear!

## Troubleshooting

**Data not appearing in sheet:**
- Check that the webhook URL is correct in Vercel
- Make sure you've redeployed after adding the environment variable
- Check the Apps Script execution logs: Extensions → Apps Script → Executions

**Permission errors:**
- Make sure "Who has access" is set to "Anyone" in the deployment settings
- Redeploy the Apps Script if you made changes

## Data Privacy

- The sheet will contain user names, emails, and conversations
- Only users with access to your Google account can view the sheet
- Consider adding access controls if sharing with team members
- Ensure you comply with privacy regulations (GDPR, CCPA, etc.) when collecting user data
