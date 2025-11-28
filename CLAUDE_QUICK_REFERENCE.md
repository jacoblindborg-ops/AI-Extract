# Claude Setup - Quick Reference

## Your Webhook URL
```
https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29
```

## Make.com Modules (5 Total)

### 1️⃣ Custom Webhook
- **Module**: Webhooks → Custom Webhook
- **URL**: Use the webhook above
- **Output**: `file`, `productUuid`, `productData`

---

### 2️⃣ Parse Product JSON
- **Module**: Tools → Parse JSON
- **JSON string**: `{{1.productData}}`
- **Output**: Product object with `identifier`, `uuid`, `values`, etc.

---

### 3️⃣ Claude API Call
- **Module**: HTTP → Make a Request
- **URL**: `https://api.anthropic.com/v1/messages`
- **Method**: `POST`

**Headers** (3 required):
| Name | Value |
|------|-------|
| `x-api-key` | `sk-ant-api03-YOUR_KEY_HERE` |
| `anthropic-version` | `2023-06-01` |
| `content-type` | `application/json` |

**Body** (Raw JSON):
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 2048,
  "temperature": 0.3,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "document",
          "source": {
            "type": "base64",
            "media_type": "{{1.file.type}}",
            "data": "{{base64(1.file.data)}}"
          }
        },
        {
          "type": "text",
          "text": "You are a product data extraction expert. Extract product attributes from this document and return ONLY valid JSON.\n\nCurrent product:\n- SKU: {{2.identifier}}\n- UUID: {{2.uuid}}\n\nExtract these attributes if found:\n- weight (with unit, e.g., \"2.5 kg\")\n- dimensions (e.g., \"100x50x30 cm\")\n- description (concise description)\n- material (e.g., \"Stainless Steel\")\n- color (e.g., \"Silver\")\n- brand (brand name)\n- ean (barcode if visible)\n\nReturn ONLY this JSON (no markdown, no code blocks):\n\n{\n  \"success\": true,\n  \"message\": \"Extracted X attributes\",\n  \"proposals\": [\n    {\n      \"code\": \"weight\",\n      \"label\": \"Weight\",\n      \"proposedValue\": \"2.5 kg\",\n      \"confidence\": 0.95,\n      \"locale\": null,\n      \"scope\": null\n    }\n  ]\n}\n\nRules:\n1. Use snake_case for codes (e.g., \"short_description\")\n2. confidence: 0.0-1.0 (0.9-1.0 = clearly visible, 0.7-0.89 = visible, 0.5-0.69 = inferred)\n3. locale: \"en_US\" for English, null for non-localizable\n4. scope: null\n5. Only include attributes actually found\n6. Return ONLY valid JSON"
        }
      ]
    }
  ]
}
```

**Output**: `content[0].text` (contains JSON response)

---

### 4️⃣ Parse Claude Response
- **Module**: Tools → Parse JSON
- **JSON string**: `{{3.content[0].text}}`
- **Output**: `success`, `message`, `proposals` array

---

### 5️⃣ Webhook Response
- **Module**: Webhooks → Webhook Response
- **Status**: `200`
- **Headers**: `Content-Type: application/json`

**Body**:
```json
{
  "success": {{4.success}},
  "message": "{{4.message}}",
  "proposals": {{4.proposals}}
}
```

---

## Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Click **Settings** → **API Keys**
3. Click **Create Key**
4. Copy the key (starts with `sk-ant-api03-...`)
5. Paste it in the `x-api-key` header in Module 3

---

## Test Your Setup

### Step 1: Create the Scenario in Make.com
Add all 5 modules above

### Step 2: Click "Run Once"
Make will listen for incoming data

### Step 3: Send Test Data
```bash
cd /Users/jacoblindborg/Documents/akeneo-ai-enrichment
./test-webhook.sh
```

### Step 4: Check the Results
- Go to Make.com → History
- See incoming data in Module 1
- See Claude's response in Module 3
- See parsed JSON in Module 4
- Verify final response in Module 5

---

## Expected Claude Response

Claude should return JSON like this:

```json
{
  "success": true,
  "message": "Extracted 5 attributes from document",
  "proposals": [
    {
      "code": "weight",
      "label": "Weight",
      "proposedValue": "2.5 kg",
      "confidence": 0.95,
      "locale": null,
      "scope": null
    },
    {
      "code": "description",
      "label": "Description",
      "proposedValue": "High-performance industrial widget",
      "confidence": 0.88,
      "locale": "en_US",
      "scope": null
    },
    {
      "code": "dimensions",
      "label": "Dimensions",
      "proposedValue": "100 x 50 x 30 cm",
      "confidence": 0.92,
      "locale": null,
      "scope": null
    }
  ]
}
```

---

## Troubleshooting

### Claude returns markdown instead of JSON
**Problem**: Response looks like:
```
```json
{...}
```
```

**Solution**: Add a Text Parser between Module 3 and 4:
- Pattern: Extract text between first `{` and last `}`
- OR: Tell Claude more explicitly "NO MARKDOWN" in the prompt

---

### Error: "Invalid API key"
**Problem**: `x-api-key` header is wrong

**Solution**:
- Check your API key from https://console.anthropic.com
- Make sure it starts with `sk-ant-api03-`
- No extra spaces or quotes

---

### Error: "Content too large"
**Problem**: File is too big for Claude

**Solution**:
- Resize images before sending (max 5MB recommended)
- For large PDFs, extract text first and send text only

---

### Extension shows "Failed to extract"
**Problem**: Webhook response format is wrong

**Solution**:
- Check Module 5 (Webhook Response) uses the exact format shown above
- Verify in Make History that Module 5 actually runs
- Check response has `success`, `message`, and `proposals` fields

---

## Cost Estimate

**Claude 3.5 Sonnet pricing:**
- Input: $3 per million tokens
- Output: $15 per million tokens

**Typical usage per extraction:**
- Input: ~2,000 tokens (image + prompt)
- Output: ~500 tokens (JSON response)
- **Cost per extraction**: ~$0.01 USD

**For 1,000 product enrichments:**
- Estimated cost: ~$10 USD

Much cheaper than manual data entry! 🎉

---

## Ready to Go!

1. ✅ Webhook URL configured
2. ✅ Extension built
3. ✅ Test script ready
4. ✅ Claude setup guide ready

**Next**: Create the Make.com scenario using the 5 modules above, then test with `./test-webhook.sh`
