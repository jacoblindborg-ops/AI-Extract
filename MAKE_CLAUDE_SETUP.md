# Make.com Scenario with Claude (Anthropic)

Complete guide for setting up AI attribute extraction using Claude in Make.com.

## Prerequisites

- Make.com account
- Anthropic API key (get it from https://console.anthropic.com)
- Your webhook URL: `https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29`

## Make.com Scenario Structure

```
[1. Custom Webhook]
    ↓
[2. Parse Product JSON]
    ↓
[3. Router] → [For Images] → [4a. Claude Vision API]
            ↓                          ↓
            → [For PDFs] → [4b. Extract PDF Text] → [4c. Claude Text API]
                                                           ↓
[5. Parse Claude Response]
    ↓
[6. Webhook Response]
```

## Step-by-Step Setup

### Module 1: Custom Webhook

1. Add **Webhooks → Custom Webhook**
2. Click **"Create a webhook"**
3. Name it: "Akeneo AI Enrichment"
4. Copy the URL (you already have it)

**Output:**
- `file` - Binary file data
- `productUuid` - String
- `productData` - JSON string

---

### Module 2: Parse Product JSON

1. Add **Tools → Parse JSON**
2. Configure:
   - **JSON string**: `{{1.productData}}`
3. Click **"Generate from sample"** if needed
4. Run the test script to get sample data

**Output:**
- `productData.uuid`
- `productData.identifier`
- `productData.values`
- etc.

---

### Module 3: Router (Optional but Recommended)

To handle both images and PDFs differently:

1. Add **Flow Control → Router**
2. Create two routes:

**Route 1 - Images:**
- **Filter**: `{{1.file.type}}` Contains `image`
- Goes to: Claude Vision API

**Route 2 - PDFs:**
- **Filter**: `{{1.file.type}}` Contains `pdf`
- Goes to: PDF Text Extractor → Claude Text API

---

### Module 4a: Claude Vision API (For Images)

1. Add **HTTP → Make a Request**
2. Configure:

**URL:**
```
https://api.anthropic.com/v1/messages
```

**Method:**
```
POST
```

**Headers:**
```
x-api-key: YOUR_ANTHROPIC_API_KEY
anthropic-version: 2023-06-01
content-type: application/json
```

**Body Type:**
```
Raw
```

**Body:**
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
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "{{1.file.type}}",
            "data": "{{base64(1.file.data)}}"
          }
        },
        {
          "type": "text",
          "text": "You are a product data extraction expert. Extract product attributes from this image and return ONLY valid JSON.\n\nCurrent product context:\n- Product SKU: {{2.productData.identifier}}\n- Product UUID: {{2.productData.uuid}}\n- Existing values: {{2.productData.values}}\n\nExtract these attributes if visible in the image:\n- weight (with unit, e.g., \"2.5 kg\")\n- dimensions (e.g., \"100x50x30 cm\")\n- description (concise product description)\n- features (key features, comma-separated)\n- material (primary material)\n- color (primary color)\n- brand (brand name)\n- manufacturer (if different from brand)\n- ean (barcode if visible)\n\nReturn ONLY this JSON structure:\n{\n  \"success\": true,\n  \"message\": \"Extracted X attributes\",\n  \"proposals\": [\n    {\n      \"code\": \"attribute_code\",\n      \"label\": \"Human Readable Name\",\n      \"proposedValue\": \"extracted value\",\n      \"confidence\": 0.95,\n      \"locale\": null,\n      \"scope\": null\n    }\n  ]\n}\n\nRules:\n1. Use snake_case for attribute codes (e.g., \"short_description\")\n2. confidence: 0.0 to 1.0\n   - 0.9-1.0: Clearly visible\n   - 0.7-0.89: Visible but may need verification\n   - 0.5-0.69: Inferred from context\n   - <0.5: Low confidence\n3. locale: \"en_US\" for English text, null for non-localizable\n4. scope: null\n5. Only include attributes actually found\n6. Keep values concise and formatted consistently\n7. Return ONLY valid JSON, no markdown or explanation"
        }
      ]
    }
  ]
}
```

**Output:**
- `content[0].text` - Contains the JSON response from Claude

---

### Module 4b: Extract PDF Text (For PDFs)

If handling PDFs, first extract the text:

1. Add **Tools → Text Parser**
   OR
2. Add **PDF → Extract Text** (if available)
   OR
3. Add **HTTP → Make a Request** to a PDF parsing service

For now, let's use a simple approach - send PDF to Claude directly (Claude 3.5 Sonnet supports PDF):

1. Add **HTTP → Make a Request**
2. Same as Module 4a, but change the body:

**Body for PDF:**
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
            "media_type": "application/pdf",
            "data": "{{base64(1.file.data)}}"
          }
        },
        {
          "type": "text",
          "text": "[Same extraction prompt as above]"
        }
      ]
    }
  ]
}
```

---

### Module 5: Parse Claude Response

1. Add **Tools → Text Parser**
2. Configure:
   - **Text**: `{{4.content[0].text}}`
   - **Pattern**: Extract between `{` and `}` (or use JSON parser)

OR better:

1. Add **Tools → Parse JSON**
2. Configure:
   - **JSON string**: `{{4.content[0].text}}`

**Output:**
- `proposals` (array)
- `success` (boolean)
- `message` (string)

---

### Module 6: Webhook Response

**CRITICAL**: This sends the response back to the Akeneo extension.

1. Add **Webhooks → Webhook Response**
2. Configure:

**Status:**
```
200
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "success": {{5.success}},
  "message": "{{5.message}}",
  "proposals": {{5.proposals}}
}
```

OR if you want to build it manually:

**Body:**
```json
{
  "success": true,
  "message": "Successfully extracted {{length(5.proposals)}} attributes",
  "proposals": {{5.proposals}}
}
```

---

## Complete Claude Prompt (Copy-Paste Ready)

Use this prompt in your Claude API call:

```
You are a product data extraction expert. Extract product attributes from this image/document and return ONLY valid JSON.

Current product context:
- Product SKU: {{2.productData.identifier}}
- Product UUID: {{2.productData.uuid}}

Extract these attributes if found:
1. weight - Product weight with unit (e.g., "2.5 kg", "500 g")
2. dimensions - Product dimensions (e.g., "100x50x30 cm", "10x5x3 inches")
3. description - Concise product description (1-2 sentences)
4. features - Key product features (comma-separated list)
5. specifications - Technical specifications
6. material - Primary material (e.g., "Stainless Steel", "Plastic", "Wood")
7. color - Primary color (e.g., "Silver", "Black", "White")
8. brand - Brand name
9. manufacturer - Manufacturer name (if different from brand)
10. ean - EAN/UPC barcode (if visible)
11. model_number - Model or part number
12. country_of_origin - Manufacturing country

Return ONLY this exact JSON structure (no markdown, no code blocks, no explanation):

{
  "success": true,
  "message": "Extracted X attributes from document",
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
      "proposedValue": "High-performance industrial widget for professional use",
      "confidence": 0.88,
      "locale": "en_US",
      "scope": null
    }
  ]
}

IMPORTANT RULES:
1. Attribute codes MUST be snake_case (e.g., "short_description", "model_number")
2. Confidence score 0.0 to 1.0:
   - 0.9-1.0: Text is clearly visible and unambiguous
   - 0.7-0.89: Visible but formatting may need verification
   - 0.5-0.69: Inferred from context or partially visible
   - 0.3-0.49: Educated guess based on limited information
   - <0.3: Very uncertain
3. Locale:
   - Use "en_US" for English text
   - Use "sv_SE" for Swedish text
   - Use null for non-localizable attributes (weight, dimensions, ean, etc.)
4. Scope: Always use null (unless you know the specific channel)
5. Only include attributes actually found - do not make up data
6. If multiple values exist (e.g., multiple colors), return the primary/first one
7. Include units for measurements (kg, cm, mm, etc.)
8. Format numeric values as strings
9. Return ONLY valid JSON - no markdown formatting, no code blocks, no additional text

If extraction fails, return:
{
  "success": false,
  "message": "Could not extract attributes: [reason]",
  "proposals": []
}
```

---

## Simplified Scenario (Single Route)

If you want a simpler setup that works for both images and PDFs:

### Module 1: Custom Webhook
(Same as above)

### Module 2: Parse Product JSON
(Same as above)

### Module 3: Claude API Call

**HTTP → Make a Request**

**URL:** `https://api.anthropic.com/v1/messages`

**Method:** `POST`

**Headers:**
```
x-api-key: sk-ant-api03-YOUR_KEY_HERE
anthropic-version: 2023-06-01
content-type: application/json
```

**Body:**
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
          "text": "[The complete prompt from above]"
        }
      ]
    }
  ]
}
```

**Note:** Claude 3.5 Sonnet supports both images and PDFs with the `document` type!

### Module 4: Parse Claude Response

**Tools → Parse JSON**
- JSON string: `{{3.content[0].text}}`

### Module 5: Webhook Response

**Webhooks → Webhook Response**
```json
{
  "success": {{4.success}},
  "message": "{{4.message}}",
  "proposals": {{4.proposals}}
}
```

---

## Testing Your Scenario

### 1. Set Up the Webhook
✅ Done - you already have it

### 2. Test with Sample Data
```bash
cd /Users/jacoblindborg/Documents/akeneo-ai-enrichment
./test-webhook.sh
```

### 3. Check Make.com History
- Go to Make.com → Your scenario
- Click **History** tab
- See the execution log
- Check each module's output

### 4. Verify Claude Response
Look for the `content[0].text` output from the Claude module. It should contain valid JSON:

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
    }
  ]
}
```

---

## Cost Optimization for Claude

### Model Selection

**Claude 3.5 Sonnet (Recommended)**
- Best balance of quality and cost
- Excellent at structured extraction
- Supports vision and documents
- $3 per million input tokens
- $15 per million output tokens

**Claude 3 Haiku (Budget option)**
- Faster and cheaper
- Good for simple extraction
- $0.25 per million input tokens
- $1.25 per million output tokens

**Claude 3 Opus (Premium)**
- Highest quality
- Best for complex documents
- $15 per million input tokens
- $75 per million output tokens

### Tips to Reduce Costs

1. **Use appropriate max_tokens**: Set to 2048 for most cases
2. **Lower temperature**: Use 0.2-0.3 for consistent extraction
3. **Compress images**: Resize large images before sending
4. **Cache prompts**: Use prompt caching for repeated prompts
5. **Filter files**: Only process relevant file types

---

## Error Handling

Add an error handler module:

1. After Claude API call, add **Tools → Set Variables**
2. Check if response is valid:
   - If `{{3.status_code}}` ≠ 200, return error
3. Fallback response:

```json
{
  "success": false,
  "message": "AI extraction failed: {{3.error.message}}",
  "proposals": []
}
```

---

## Example Scenario Blueprint

Want to import a ready-made scenario? Here's a simplified blueprint:

```json
{
  "name": "Akeneo AI Enrichment - Claude",
  "flow": [
    {
      "module": "gateway:CustomWebHook",
      "notes": "Receives file + product data from Akeneo"
    },
    {
      "module": "util:ParseJSON",
      "mapper": {
        "json": "{{1.productData}}"
      }
    },
    {
      "module": "http:ActionSendData",
      "mapper": {
        "url": "https://api.anthropic.com/v1/messages",
        "method": "post",
        "headers": [
          {"name": "x-api-key", "value": "YOUR_KEY"},
          {"name": "anthropic-version", "value": "2023-06-01"},
          {"name": "content-type", "value": "application/json"}
        ],
        "body": "{...}"
      }
    },
    {
      "module": "util:ParseJSON",
      "mapper": {
        "json": "{{3.content[0].text}}"
      }
    },
    {
      "module": "gateway:WebhookResponse",
      "mapper": {
        "status": "200",
        "body": "{\"success\":{{4.success}},\"proposals\":{{4.proposals}}}"
      }
    }
  ]
}
```

---

## Next Steps

1. ✅ Get your Anthropic API key from https://console.anthropic.com
2. ✅ Create the Make.com scenario using the structure above
3. ✅ Test with: `./test-webhook.sh`
4. ✅ Check Make.com History to verify
5. ✅ Upload extension to Akeneo
6. ✅ Test with real product files!

---

**Need the API key?** Go to https://console.anthropic.com → Settings → API Keys → Create Key

**Questions?** The Claude API docs are at: https://docs.anthropic.com/en/api/messages
