# Quick Start Guide

Your webhook is configured and the extension is ready! Here's what to do next.

## ✅ What's Ready

- **Extension built**: `dist/ai-enrichment.js` (8.4 MB)
- **Webhook configured**: `https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29`
- **Test script ready**: `test-webhook.sh`

## Step 1: Test the Webhook (See What Data Arrives)

Before setting up the full AI pipeline, test to see what data the webhook receives:

### Option A: Run Test Script

```bash
cd /Users/jacoblindborg/Documents/akeneo-ai-enrichment
./test-webhook.sh
```

This sends sample data to your webhook. Then:
1. Go to Make.com
2. Open your scenario (or create one with Custom Webhook)
3. Click **History** tab
4. See the incoming data!

### Option B: Use Make.com's "Run Once"

1. Go to Make.com
2. Create scenario with **Custom Webhook** module
3. Click **"Run Once"** button
4. Run the test script (or upload in Akeneo)
5. Make will capture and show you the data structure

## Step 2: Build Your Make.com Scenario

Once you've seen the data structure, build your scenario:

### Module 1: Custom Webhook
```
Type: Webhooks → Custom Webhook
URL: https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29
```

### Module 2: Parse Product Data
```
Type: Tools → Parse JSON
JSON string: {{1.productData}}
```

### Module 3: AI Extraction
Choose one:

**Option A: OpenAI GPT-4 Vision** (for images/PDFs with images)
```
Type: OpenAI → Create a Completion
Model: gpt-4-vision-preview
Message: [Your extraction prompt + file]
```

**Option B: OpenAI GPT-4** (for text-based PDFs)
```
Type: OpenAI → Create a Completion
Model: gpt-4-turbo-preview
Message: [Your extraction prompt + extracted text from PDF]
```

**Option C: Claude** (Anthropic)
```
Type: HTTP → Make a Request
URL: https://api.anthropic.com/v1/messages
Method: POST
Headers:
  - x-api-key: YOUR_ANTHROPIC_API_KEY
  - anthropic-version: 2023-06-01
Body: [See Claude API docs]
```

### Module 4: Format Response
```
Type: Webhooks → Webhook Response
Status: 200
Body: {
  "success": true,
  "message": "Extracted X attributes",
  "proposals": [
    {
      "code": "weight",
      "label": "Weight",
      "proposedValue": "2.5 kg",
      "confidence": 0.95,
      "locale": null,
      "scope": null
    }
  ]
}
```

**IMPORTANT**: The response format MUST match exactly. See `MAKE_WEBHOOK_EXAMPLE.md` for details.

## Step 3: Test AI Extraction

### Example AI Prompt

Use this in your OpenAI/Claude module:

```
Extract product attributes from the provided document. Return ONLY valid JSON:

{
  "success": true,
  "message": "Extraction successful",
  "proposals": [
    {
      "code": "weight",
      "label": "Weight",
      "proposedValue": "extracted value with unit",
      "confidence": 0.95,
      "locale": null,
      "scope": null
    }
  ]
}

Extract these attributes if found:
- weight (with unit, e.g., "2.5 kg")
- dimensions (e.g., "100x50x30 cm")
- description (concise description)
- material (primary material)
- color (primary color)
- brand (brand name)

Rules:
- Use snake_case for codes
- confidence 0.0-1.0 (1.0 = 100% certain)
- locale: "en_US" for English, null for non-localizable
- scope: null
- Only include attributes actually found
```

### Test with Sample Data

Run the test script again:
```bash
./test-webhook.sh path/to/sample-datasheet.pdf
```

Check Make.com History to see:
1. Incoming data ✅
2. Parsed product data ✅
3. AI extraction result ✅
4. Formatted response ✅

## Step 4: Upload to Akeneo

Once your webhook returns correct data, upload the extension:

### Via Akeneo UI

1. Go to **System → Extensions → UI Extensions**
2. Click **"Create"**
3. Upload: `/Users/jacoblindborg/Documents/akeneo-ai-enrichment/dist/ai-enrichment.js`
4. Configure:
   - **Code**: `ai_enrichment`
   - **Position**: `pim.product.tab`
   - **Label (en_US)**: `AI Enrichment`
5. **Save** and activate

### Via API

```bash
# Get your Akeneo credentials
PIM_URL="https://your-instance.demo.cloud.akeneo.com"
USERNAME="your_username"
PASSWORD="your_password"
CLIENT_ID="your_client_id"
CLIENT_SECRET="your_client_secret"

# Get access token
TOKEN=$(curl -X POST "$PIM_URL/api/oauth/v1/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "password",
    "username": "'$USERNAME'",
    "password": "'$PASSWORD'",
    "client_id": "'$CLIENT_ID'",
    "client_secret": "'$CLIENT_SECRET'"
  }' | jq -r '.access_token')

# Upload extension
curl -X POST "$PIM_URL/api/rest/v1/ui-extensions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "code=ai_enrichment" \
  -F "name=AI Product Enrichment" \
  -F "position=pim.product.tab" \
  -F "labels[en_US]=AI Enrichment" \
  -F "file=@/Users/jacoblindborg/Documents/akeneo-ai-enrichment/dist/ai-enrichment.js"
```

## Step 5: Test in Akeneo

1. Open any product in Akeneo PIM
2. Look for the **"AI Enrichment"** tab
3. Upload a PDF or image
4. Watch the magic happen! ✨

You should see:
- ✅ File uploaded
- ✅ "Extracting attributes with AI..."
- ✅ Comparison table with proposals
- ✅ Confidence scores
- ✅ Select which to apply
- ✅ Save to Akeneo

## Expected Data Flow

```
[Product Tab]
    ↓
[Upload PDF/Image]
    ↓
[Extension POSTs to Make]
    → file: [binary]
    → productUuid: "abc-123"
    → productData: '{"uuid":"abc-123","values":{...}}'
    ↓
[Make Webhook Receives]
    ↓
[Parse Product JSON]
    ↓
[Send to AI]
    → Prompt + File/Text
    ↓
[AI Returns Attributes]
    ↓
[Format Response]
    ↓
[Return to Extension]
    ← {
        "success": true,
        "proposals": [...]
      }
    ↓
[Extension Displays Comparison]
    ↓
[User Selects & Applies]
    ↓
[Extension PATCHes to Akeneo]
    ↓
[✅ Product Updated!]
```

## Troubleshooting

### Webhook not receiving data
- Check the URL is correct in `src/config.ts`
- Rebuild: `npm run build`
- Test with: `./test-webhook.sh`

### AI returns wrong format
- Check response in Make.com History
- Ensure JSON format matches exactly
- Use webhook response module, not HTTP response

### Extension shows error
- Open browser console (F12)
- Look for errors starting with `[AI Enrichment]`
- Check Make.com execution logs

### No attributes extracted
- Improve AI prompt
- Check file is readable (not scanned/low quality)
- Increase max_tokens in AI settings

## Next Steps

1. ✅ Run `./test-webhook.sh` to see incoming data
2. ✅ Build Make.com scenario with AI
3. ✅ Test with sample files
4. ✅ Upload extension to Akeneo
5. ✅ Test with real products!

## Files Reference

- **Extension**: `dist/ai-enrichment.js` (ready to upload)
- **Config**: `src/config.ts` (webhook URL configured)
- **Test Script**: `test-webhook.sh` (test the webhook)
- **Full Docs**: `README.md` (complete documentation)
- **Webhook Guide**: `MAKE_WEBHOOK_EXAMPLE.md` (detailed webhook setup)

---

**Questions?** Check the `README.md` or `MAKE_WEBHOOK_EXAMPLE.md` for detailed documentation!
