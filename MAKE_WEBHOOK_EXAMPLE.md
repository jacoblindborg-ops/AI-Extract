# Make.com Webhook Setup Guide

This guide explains how to set up the Make.com webhook that receives files from the Akeneo AI Enrichment extension and returns AI-extracted attribute proposals.

## Webhook Flow Overview

```
[Akeneo Extension]
    ↓ (multipart POST)
[Make Webhook]
    ↓
[Parse File + Product Data]
    ↓
[AI Model (OpenAI/Claude/etc.)]
    ↓
[Format Response]
    ↓
[Return JSON to Extension]
```

## 1. Create Make.com Scenario

1. Log in to Make.com
2. Create a new scenario
3. Add a **"Custom Webhook"** module as the first step
4. Click **"Create a webhook"**
5. Copy the webhook URL (you'll need this for the extension config)

## 2. Webhook Input Structure

The extension sends a **multipart/form-data** POST request with:

### Form Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The uploaded PDF or image file |
| `productUuid` | String | The product's UUID in Akeneo |
| `productData` | JSON String | Complete product object (needs parsing) |

### Example Webhook Data

```javascript
{
  "file": [Binary file data],
  "productUuid": "1234-5678-90ab-cdef",
  "productData": "{\"uuid\":\"1234...\",\"identifier\":\"SKU123\",\"values\":{...}}"
}
```

## 3. Make.com Scenario Steps

### Step 1: Custom Webhook
- **Module**: Custom Webhook
- **Action**: Receive data
- **Output**: file, productUuid, productData (as string)

### Step 2: Parse JSON
- **Module**: Tools → Parse JSON
- **JSON String**: `{{1.productData}}`
- **Data Structure**: (Make will auto-detect)
- **Output**: Parsed product object

### Step 3: OpenAI Vision (or other AI)

#### Option A: OpenAI GPT-4 Vision

- **Module**: OpenAI → Create a Completion
- **Model**: gpt-4-vision-preview (for images) or gpt-4 (for PDFs)
- **Messages**:
  - **Role**: System
  - **Content**: Your extraction prompt (see below)
  - **Role**: User
  - **Content** (for images): Upload the file from step 1
  - **Content** (for PDFs): Convert PDF to text first, then send

#### Option B: Claude (Anthropic)

- **Module**: HTTP → Make a Request
- **URL**: `https://api.anthropic.com/v1/messages`
- **Method**: POST
- **Headers**:
  - `x-api-key`: Your Anthropic API key
  - `anthropic-version`: 2023-06-01
  - `content-type`: application/json
- **Body**: See Claude API docs for format

### Step 4: Parse AI Response
- **Module**: Tools → Parse JSON
- **JSON String**: AI response
- **Extract**: The proposals array

### Step 5: Format Response
- **Module**: Tools → Set Multiple Variables
- Map AI output to the required format (see below)

### Step 6: HTTP Response
- **Module**: Webhook Response
- **Status**: 200
- **Body Type**: JSON
- **Body**: Formatted response (see below)

## 4. AI Extraction Prompt

Here's a recommended prompt for the AI model:

```
You are a product data extraction expert. Analyze the provided product document (datasheet, image, or catalog page) and extract product attributes.

Return ONLY valid JSON in this exact format:

{
  "success": true,
  "message": "Extraction successful",
  "proposals": [
    {
      "code": "attribute_code",
      "label": "Human Readable Label",
      "proposedValue": "extracted value as string",
      "confidence": 0.95,
      "locale": null,
      "scope": null
    }
  ]
}

Rules:
1. Extract these common attributes if found:
   - weight (with unit, e.g., "2.5 kg")
   - dimensions (e.g., "100x50x30 cm")
   - description (concise product description)
   - features (key features as comma-separated list)
   - material (primary material)
   - color (primary color)
   - brand (brand name if visible)
   - manufacturer (manufacturer name if different from brand)
   - ean (EAN/barcode if visible)

2. Use snake_case for attribute codes (e.g., "short_description")
3. confidence should be 0.0 to 1.0 (0% to 100%)
4. Set confidence based on:
   - 0.9-1.0: Clearly visible and unambiguous
   - 0.7-0.89: Visible but may need verification
   - 0.5-0.69: Inferred from context
   - <0.5: Low confidence guess

5. Use locale "en_US" for English text, null for non-localizable attributes
6. Use scope null (unless you know the channel)
7. Only include attributes you actually found in the document
8. If multiple values exist (e.g., colors), return the primary/first one
9. Keep values concise and formatted consistently

Current product data for reference:
Product UUID: {{productUuid}}
Existing values: {{productData.values}}

Do not make up data. Only extract what you can see or confidently infer.
```

## 5. Response Format

The webhook **MUST** return JSON in this format:

### Success Response

```json
{
  "success": true,
  "message": "Successfully extracted 8 attributes",
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
      "proposedValue": "High-performance industrial widget with advanced features...",
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
    },
    {
      "code": "material",
      "label": "Material",
      "proposedValue": "Stainless Steel",
      "confidence": 0.87,
      "locale": null,
      "scope": null
    },
    {
      "code": "color",
      "label": "Color",
      "proposedValue": "Silver",
      "confidence": 0.75,
      "locale": null,
      "scope": null
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "message": "Failed to extract attributes: File format not supported",
  "proposals": []
}
```

## 6. Field Descriptions

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | Boolean | Yes | Whether extraction succeeded |
| `message` | String | No | Human-readable message |
| `proposals` | Array | Yes | Array of extracted attributes |

### Proposal Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | String | Yes | Akeneo attribute code (snake_case) |
| `label` | String | Yes | Human-readable attribute name |
| `proposedValue` | String | Yes | The extracted value (always string) |
| `confidence` | Number | Yes | Confidence score 0.0-1.0 |
| `locale` | String\|null | Yes | Locale code (e.g., "en_US") or null |
| `scope` | String\|null | Yes | Channel code or null |

## 7. Example Make.com Modules

### Module 1: Custom Webhook
```
Name: Receive File from Akeneo
Type: Custom Webhook
Output:
  - file (binary)
  - productUuid (text)
  - productData (text)
```

### Module 2: Parse Product Data
```
Name: Parse Product JSON
Type: Tools > Parse JSON
Input:
  JSON string: {{1.productData}}
Output:
  - productData.uuid
  - productData.identifier
  - productData.values
  - etc.
```

### Module 3: OpenAI Vision
```
Name: Extract Attributes with AI
Type: OpenAI > Create a Completion
Input:
  Model: gpt-4-vision-preview
  Messages:
    - Role: system
      Content: [Your extraction prompt]
    - Role: user
      Content: [Image from {{1.file}}]
  Max tokens: 2000
  Temperature: 0.3
  Response format: JSON object
Output:
  - choices[0].message.content (JSON string)
```

### Module 4: Parse AI Response
```
Name: Parse AI JSON
Type: Tools > Parse JSON
Input:
  JSON string: {{3.choices[0].message.content}}
Output:
  - proposals (array)
```

### Module 5: Format Response
```
Name: Format for Extension
Type: Tools > Set Multiple Variables
Variables:
  - Name: response
    Value: {
      "success": true,
      "message": "Extracted {{length(4.proposals)}} attributes",
      "proposals": {{4.proposals}}
    }
```

### Module 6: Send Response
```
Name: Return to Extension
Type: Webhooks > Webhook Response
Input:
  Status: 200
  Headers:
    - Content-Type: application/json
  Body: {{5.response}}
```

## 8. Testing

### Test with cURL

```bash
curl -X POST 'YOUR_MAKE_WEBHOOK_URL' \
  -F 'file=@sample-datasheet.pdf' \
  -F 'productUuid=1234-5678-90ab-cdef' \
  -F 'productData={"uuid":"1234","identifier":"TEST001","values":{}}'
```

Expected response:
```json
{
  "success": true,
  "message": "Extracted 5 attributes",
  "proposals": [...]
}
```

## 9. Advanced: Attribute Whitelist

If you've configured an attribute whitelist in the extension (`config.ts`), you can filter proposals in Make:

```javascript
// In a JavaScript module in Make:
const whitelist = ["weight", "dimensions", "description", "color", "material"];
const filteredProposals = proposals.filter(p => whitelist.includes(p.code));

return {
  success: true,
  message: `Extracted ${filteredProposals.length} whitelisted attributes`,
  proposals: filteredProposals
};
```

## 10. Cost Optimization

### For Images:
- Use GPT-4 Vision only when needed
- Resize large images before sending to AI
- Cache common products to avoid re-processing

### For PDFs:
- Convert PDF to text first (use PDF parsing module)
- Only send relevant pages to AI
- Use cheaper models (GPT-3.5) for simple extraction

### General:
- Set reasonable max_tokens limit (1000-2000)
- Use temperature 0.2-0.3 for consistent extraction
- Implement error handling to avoid wasted API calls

## 11. Troubleshooting

### Extension shows "Failed to extract"
- Check Make.com scenario is active
- Verify webhook URL in extension config
- Check Make.com execution log for errors
- Ensure response format matches exactly

### Low confidence scores
- Improve AI prompt with examples
- Provide better quality images
- Add product context to prompt

### Wrong attributes extracted
- Refine the AI prompt
- Add attribute descriptions to prompt
- Include existing product data as context

## 12. Example Make.com Scenario JSON

Want to import this scenario? See `make-scenario-example.json` in this repository.

---

**Need help?** Check the Make.com documentation or the extension README.md for more details.
