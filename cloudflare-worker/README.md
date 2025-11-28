# Akeneo AI Iframe Worker

This is the Cloudflare Worker for the Akeneo AI Enrichment iframe extension. It provides AI-powered product attribute extraction with customizable prompt templates and extraction modes.

## Features

### 5 Prompt Templates

1. **Standard Extraction** (`default`)
   - Balanced approach for common product attributes
   - Confidence threshold: >70%
   - Best for: General product enrichment

2. **Detailed Extraction** (`detailed`)
   - Comprehensive extraction including specs, materials, dimensions
   - Extracts fine-print details
   - Best for: Technical products with detailed documentation

3. **Conservative** (`conservative`)
   - High-confidence only (>90%)
   - Quality over quantity
   - Best for: Critical data that must be accurate

4. **Marketing Focus** (`marketing`)
   - Focuses on descriptions, features, benefits, selling points
   - Customer-facing content
   - Best for: E-commerce and catalog content

5. **Technical Specifications** (`technical`)
   - Measurable data: dimensions, weights, materials, SKUs
   - Certifications and compliance data
   - Best for: Technical documentation and logistics

### Extraction Modes

- **All Attributes**: Extract all attributes (compare AI vs existing values)
- **Empty Only**: Only extract for attributes that are currently empty

## Deployment

### Prerequisites

- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`
- Gemini API key from Google AI Studio

### Step 1: Login to Cloudflare

```bash
wrangler login
```

### Step 2: Set API Key Secret

```bash
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted
```

### Step 3: Deploy

```bash
wrangler deploy
```

### Step 4: Get Worker URL

After deployment, Wrangler will output your worker URL, something like:
```
https://akeneo-ai-iframe-worker.your-subdomain.workers.dev
```

### Step 5: Update Iframe App Config

Update the `EXTENSION_CONFIG.makeWebhookUrl` in your iframe app to point to the new worker URL:

```typescript
// src/config.ts
export const EXTENSION_CONFIG = {
  makeWebhookUrl: 'https://akeneo-ai-iframe-worker.your-subdomain.workers.dev',
  // ...
};
```

## API Reference

### Request Payload

```json
{
  "file": "base64-encoded-file",
  "fileName": "product-sheet.pdf",
  "fileType": "application/pdf",
  "fileSize": 123456,
  "productUuid": "uuid-here",
  "productData": {
    "identifier": "SKU-123",
    "family": "electronics",
    "values": { /* current attribute values */ }
  },
  "familyAttributes": [ /* attribute metadata */ ],
  "promptId": "default",
  "extractionMode": "all"
}
```

### Response

```json
{
  "success": true,
  "message": "Extracted 15 attributes using Standard Extraction",
  "proposals": [
    {
      "code": "name",
      "proposedValue": "Premium Widget",
      "confidence": 0.95,
      "locale": "en_US",
      "scope": "ecommerce",
      "reasoning": "Product name clearly visible in title"
    }
  ],
  "metadata": {
    "promptTemplate": "Standard Extraction",
    "extractionMode": "all",
    "totalAttributes": 20,
    "extractedAttributes": 15
  }
}
```

## Customizing Prompts

To modify the prompt templates, edit the `PROMPT_TEMPLATES` object in `akeneo-ai-iframe-worker.js`:

```javascript
const PROMPT_TEMPLATES = {
  custom: {
    name: 'My Custom Template',
    systemPrompt: 'Your custom system prompt...',
    extractionGuidance: 'Your extraction guidance...',
  },
  // ...
};
```

Then redeploy with `wrangler deploy`.

## Monitoring

View logs in real-time:
```bash
wrangler tail
```

View logs in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Logs" tab

## Troubleshooting

### "Gemini API error: 400"
- Check that your file is properly base64 encoded
- Verify file type is supported (PDF, PNG, JPG, WEBP)
- Check file size (max ~10MB for PDFs, ~4MB for images)

### "Failed to parse Gemini response as JSON"
- The AI may have returned non-JSON text
- Check logs to see raw response
- Consider adjusting temperature in generationConfig

### "Missing required fields"
- Ensure payload includes: file, productData, familyAttributes
- Check that familyAttributes is an array

## Cost Optimization

- Gemini 2.0 Flash is free up to 15 RPM / 1M TPM / 1500 RPD
- Cloudflare Workers free tier: 100,000 requests/day
- For production, consider Gemini Pro for better accuracy

## Support

For issues or questions:
- Check Cloudflare Worker logs: `wrangler tail`
- Check browser console for client-side errors
- Verify Gemini API quota: https://aistudio.google.com/app/apikey
