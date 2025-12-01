# Akeneo AI Product Enrichment - Complete Documentation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Comparison](#architecture-comparison)
3. [Solution 1: Original PIM SDK Extension](#solution-1-original-pim-sdk-extension)
4. [Solution 2: Iframe Extension (Recommended)](#solution-2-iframe-extension-recommended)
5. [Features Comparison](#features-comparison)
6. [Setup & Deployment](#setup--deployment)
7. [User Guide](#user-guide)
8. [Technical Details](#technical-details)
9. [Security](#security)
10. [Troubleshooting](#troubleshooting)
11. [Future Enhancements](#future-enhancements)

---

## Overview

We have developed **two separate AI-powered product enrichment solutions** for Akeneo PIM that automatically extract product attributes from PDFs and images using Google's Gemini AI.

### Key Capabilities

- ✅ **Automated Attribute Extraction** - Upload a product datasheet (PDF) or image, and AI extracts relevant attributes
- ✅ **Smart Suggestions** - AI confidence scores help identify reliable data
- ✅ **Bulk Updates** - Review and apply multiple attribute changes at once
- ✅ **Family-Aware** - Automatically detects and extracts attributes specific to each product family
- ✅ **Multi-Language Support** - Handles localized content and attribute values

### Business Value

| Benefit | Impact |
|---------|--------|
| **Time Savings** | Reduce manual data entry from 15-30 minutes per product to 2-3 minutes |
| **Data Accuracy** | AI-powered extraction with confidence scoring minimizes human error |
| **Scalability** | Process large product catalogs efficiently |
| **Cost Efficiency** | Leverage free tier AI (500 requests/day) with option to upgrade |

---

## Architecture Comparison

### Solution 1: Original PIM SDK Extension (Legacy)

```
┌─────────────────────────────────────────────────────────────┐
│                      Akeneo PIM                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          PIM SDK Extension (JavaScript)               │  │
│  │  - Runs inside Akeneo UI                             │  │
│  │  - Uses Akeneo SDK (5-second timeout limit!)         │  │
│  └──────────────────┬──────────────────────────────────-┘  │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Cloudflare Worker     │
         │  - Receives PDF        │
         │  - Calls Gemini API    │
         │  - Returns proposals   │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Google Gemini API    │
         │   (2.5 Flash)          │
         └────────────────────────┘
```

**Limitation:** 5-second SDK timeout prevents processing files > 150KB

---

### Solution 2: Iframe Extension (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                      Akeneo PIM                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Iframe (Embedded Web App)                    │  │
│  │  - Hosted on Vercel                                  │  │
│  │  - React application                                 │  │
│  │  - No SDK timeout restrictions!                      │  │
│  └──────────────────┬──────────────────────────────────-┘  │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      │ Direct API calls (no timeout)
                      │
         ┌────────────▼───────────┐
         │  Akeneo Proxy          │
         │  (Vercel Serverless)   │
         │  - OAuth handling      │
         │  - CORS solution       │
         └────────────┬───────────┘
                      │
         ┌────────────▼───────────┐
         │  AI Worker             │
         │  (Cloudflare)          │
         │  - 5 prompt templates  │
         │  - Extraction modes    │
         │  - API authentication  │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Google Gemini API    │
         │   (2.5 Flash)          │
         └────────────────────────┘
```

**Advantage:** Handles large files (up to 1MB+), no timeout issues

---

## Solution 1: Original PIM SDK Extension

### Overview

The original extension runs as JavaScript code directly within the Akeneo PIM interface using the official Akeneo SDK.

### Technical Stack

- **Frontend**: Vanilla JavaScript with Akeneo Design System
- **API**: Akeneo SDK for PIM operations
- **AI Backend**: Cloudflare Worker → Google Gemini
- **Deployment**: Packaged as `.zip` and uploaded via Akeneo UI

### Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **5-second SDK timeout** | Cannot process files > 150KB | Use iframe solution |
| **No custom prompts** | Single extraction strategy | Use iframe solution |
| **Limited control** | SDK controls all API calls | Use iframe solution |

### When to Use

- ✅ Small files only (< 150KB)
- ✅ Simple use cases
- ✅ Testing/proof of concept
- ❌ Production workloads
- ❌ Large product datasheets

### Repository

- **Location**: Original project folder
- **Worker URL**: `https://sparkling-term-6be2.jacob-lindborg.workers.dev`

---

## Solution 2: Iframe Extension (Recommended)

### Overview

A standalone React web application embedded as an iframe within Akeneo PIM. This architecture bypasses SDK limitations and provides full control over the extraction process.

### Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 18 + TypeScript | User interface |
| **UI Library** | Akeneo Design System | Native Akeneo look & feel |
| **Styling** | Styled Components | CSS-in-JS |
| **Hosting** | Vercel | Serverless deployment |
| **Backend Proxy** | Vercel Serverless Functions | Akeneo API calls |
| **AI Worker** | Cloudflare Worker | AI processing |
| **AI Model** | Google Gemini 2.5 Flash | Attribute extraction |

### Key Features

#### 1. Five Prompt Templates

Users can select different AI extraction strategies:

| Template | Description | Best For |
|----------|-------------|----------|
| **Standard Extraction** | Balanced approach, >70% confidence | General products |
| **Detailed Extraction** | Thorough specs, dimensions, materials | Technical products |
| **Conservative** | High confidence only (>90%) | Critical data |
| **Marketing Focus** | Descriptions, features, benefits | E-commerce content |
| **Technical Specifications** | Dimensions, weights, SKUs, certifications | Logistics & compliance |

#### 2. Extraction Modes

- **All Attributes**: Extract all attributes (compare AI vs existing values)
- **Empty Only**: Only fill in missing/empty attributes

#### 3. Smart Auto-Selection

Proposals with confidence ≥ 80% are automatically pre-selected for review.

#### 4. Attribute Type Support

- ✅ Text fields
- ✅ Textarea fields
- ✅ Select dropdowns (validates against option list)
- ✅ Multi-select fields
- ✅ Numeric fields
- ✅ Boolean fields

#### 5. Security

- 🔒 API key authentication for worker
- 🔒 CORS restrictions to authorized domains
- 🔒 OAuth token caching in backend proxy
- 🔒 Environment-based secrets

### URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Iframe App** | https://ai-extract-ten.vercel.app | User interface |
| **AI Worker** | https://polished-mode-6d33.jacob-lindborg.workers.dev | AI processing |
| **GitHub Repo** | https://github.com/jacoblindborg-ops/AI-Extract | Source code |

---

## Features Comparison

| Feature | Original Extension | Iframe Extension |
|---------|-------------------|------------------|
| File size limit | 150KB (SDK timeout) | 1MB+ (no timeout) |
| Prompt templates | 1 (fixed) | 5 (customizable) |
| Extraction modes | All attributes only | All or Empty only |
| Processing time | <5 seconds | Up to 60+ seconds |
| Auto-selection | ✅ Yes | ✅ Yes (configurable) |
| Editable proposals | ✅ Yes | ✅ Yes |
| Select/multiselect validation | ✅ Yes | ✅ Yes |
| Family-aware extraction | ✅ Yes | ✅ Yes |
| Authentication | ❌ No | ✅ API key |
| CORS protection | ❌ No | ✅ Yes |
| Settings persistence | ❌ No | ✅ LocalStorage |
| **Recommended for production** | ❌ No | ✅ Yes |

---

## Setup & Deployment

### Prerequisites

- Akeneo PIM instance (Cloud or Enterprise)
- Google Gemini API key ([Get one free](https://ai.google.dev/))
- Cloudflare account
- Vercel account
- GitHub account

---

### Iframe Extension Setup (Recommended)

#### Step 1: Clone Repository

```bash
git clone https://github.com/jacoblindborg-ops/AI-Extract.git
cd AI-Extract
npm install
```

#### Step 2: Deploy Cloudflare Worker

```bash
cd cloudflare-worker

# Login to Cloudflare
wrangler login

# Set Gemini API key
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted

# Generate and set worker API key (for authentication)
wrangler secret put WORKER_API_KEY
# Paste a random secure key (use: openssl rand -base64 32)

# Deploy
wrangler deploy

# Note the worker URL (e.g., https://polished-mode-6d33.jacob-lindborg.workers.dev)
```

#### Step 3: Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com
2. Import GitHub repository
3. Configure environment variables:
   - `VITE_WORKER_API_KEY` = (same key you set in Cloudflare)
4. Deploy

**Option B: Via CLI**
```bash
cd ..  # Back to project root
npm install -g vercel
vercel login
vercel

# Add environment variable
vercel env add VITE_WORKER_API_KEY production
# Paste the same API key you used in Cloudflare

# Deploy to production
vercel --prod
```

#### Step 4: Configure in Akeneo

1. Go to Akeneo PIM → **System** → **Extensions**
2. Click **Create Extension**
3. Fill in details:
   - **Name**: AI Product Enrichment
   - **Type**: Iframe Extension
   - **URL**: `https://your-vercel-app.vercel.app/?product_uuid={{product_uuid}}&akeneo_url={{akeneo_url}}`
   - **Location**: Product Edit Page → Tab
4. **Save**

#### Step 5: Test

1. Go to any product in Akeneo
2. You should see a new "AI Product Enrichment" tab
3. Upload a PDF or image
4. Review and apply AI suggestions

---

### Original Extension Setup (Legacy)

#### Step 1: Deploy Cloudflare Worker

```bash
cd cloudflare-worker-original

wrangler login
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

#### Step 2: Build Extension Package

```bash
cd ../original-extension
npm install
npm run build

# This creates extension.zip
```

#### Step 3: Upload to Akeneo

1. Go to Akeneo PIM → **System** → **Extensions**
2. Click **Upload Extension**
3. Select `extension.zip`
4. **Activate** the extension

---

## User Guide

### How to Use the Iframe Extension

#### 1. Select AI Extraction Strategy

Choose from 5 prompt templates based on your product type:

- **Standard**: For most products
- **Detailed**: For products with complex specifications
- **Conservative**: When accuracy is critical
- **Marketing**: For customer-facing content
- **Technical**: For technical documentation

#### 2. Choose Extraction Mode

- **All attributes**: Compare AI suggestions with existing values (shows differences)
- **Empty attributes only**: Only fill in missing data (faster)

#### 3. Upload Product File

Supported formats:
- PDF (up to 1MB)
- JPEG/JPG
- PNG
- WebP

#### 4. Review AI Suggestions

The extension displays:
- **Attribute name** (with type indicator)
- **Current value** (if any)
- **AI proposed value**
- **Confidence score** (0-100%)
- **Reasoning** (why AI chose this value)

#### 5. Select Changes to Apply

- ✅ High-confidence proposals (>80%) are pre-selected
- ✏️ Edit any proposed value before applying
- 🔄 Select/deselect individual proposals
- ✅ Select All / ❌ Deselect All buttons available

#### 6. Save to Akeneo

Click **Save Selected Changes** to update product attributes in Akeneo PIM.

---

## Technical Details

### Prompt Template Implementation

Each template in the Cloudflare Worker has:

1. **System Prompt**: Defines AI behavior and extraction strategy
2. **Extraction Guidance**: Specific instructions for the template
3. **Confidence Threshold**: Varies by template (70-90%)

Example (Conservative Template):

```javascript
{
  id: 'conservative',
  name: 'Conservative (High Confidence Only)',
  systemPrompt: `You are an AI assistant focused on high-precision product data extraction.
Your task is to extract ONLY information you are extremely confident about (>90% confidence).
When in doubt, do not extract. Quality over quantity is the priority.`,
  extractionGuidance: 'Extract only information that is explicitly stated and completely unambiguous.'
}
```

### Extraction Mode Logic

```javascript
function filterAttributesByMode(familyAttributes, productValues, mode) {
  if (mode === 'empty') {
    // Only return attributes that are currently empty
    return familyAttributes.filter((attr) => {
      const currentValues = productValues[attr.code];
      if (!currentValues || currentValues.length === 0) return true;
      return currentValues.every((val) => !val.data || val.data === '');
    });
  }
  // mode === 'all'
  return familyAttributes;
}
```

### API Authentication Flow

```
┌──────────────┐                              ┌──────────────────┐
│ Iframe App   │                              │ Cloudflare Worker│
│              │                              │                  │
│ 1. User      │                              │ 4. Check         │
│    uploads   │                              │    X-API-Key     │
│    file      │                              │    header        │
│              │   2. POST with X-API-Key     │                  │
│              ├─────────────────────────────>│ 5. Validate      │
│              │   Header: X-API-Key: xxx     │    against       │
│              │                              │    WORKER_API_KEY│
│              │                              │                  │
│              │   3. 401 Unauthorized        │ 6a. Invalid      │
│              │<─────────────────────────────┤     → 401        │
│              │      OR                      │                  │
│              │   200 OK + Proposals         │ 6b. Valid        │
│              │<─────────────────────────────┤     → Process    │
│              │                              │                  │
└──────────────┘                              └──────────────────┘
```

### Data Flow

```
User Action (Upload PDF)
    ↓
React App (FileUploader component)
    ↓
useAIEnrichment Hook
    ↓
EXTENSION_CONFIG.makeWebhookUrl (Cloudflare Worker)
    ↓
Authentication Check (X-API-Key)
    ↓
Filter Attributes (by extraction mode)
    ↓
Build Gemini Prompt (using selected template)
    ↓
Call Gemini API (gemini-2.5-flash)
    ↓
Parse JSON Response
    ↓
Return Proposals to Iframe
    ↓
Build Comparisons (with confidence & metadata)
    ↓
Display in AIComparisonTable
    ↓
User Reviews & Edits
    ↓
User Clicks "Save"
    ↓
Build PATCH Payload
    ↓
Vercel Proxy (/api/akeneo-proxy)
    ↓
Akeneo REST API
    ↓
Product Updated
    ↓
Success Message + Reload Product
```

---

## Security

### Authentication

#### Cloudflare Worker Authentication

The worker requires a valid API key in the `X-API-Key` header:

```bash
curl -X POST https://polished-mode-6d33.jacob-lindborg.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_SECRET_KEY" \
  -d '{"file": "...", "productData": {...}}'
```

**Secrets Management:**

| Secret | Where Stored | How to Set |
|--------|--------------|------------|
| `GEMINI_API_KEY` | Cloudflare Worker | `wrangler secret put GEMINI_API_KEY` |
| `WORKER_API_KEY` | Cloudflare Worker | `wrangler secret put WORKER_API_KEY` |
| `VITE_WORKER_API_KEY` | Vercel Env Vars | Vercel Dashboard or `vercel env add` |

#### Generating Secure Keys

```bash
# Generate random API key (32 bytes, base64)
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### CORS Protection

Worker only accepts requests from:
- `https://ai-extract-ten.vercel.app` (production)
- `http://localhost:3000` (local development)

Requests from other domains are blocked.

### Akeneo API Security

The Vercel backend proxy (`/api/akeneo-proxy.js`) handles:
- OAuth password grant authentication
- Token caching (55-minute TTL)
- Basic Auth header generation
- CORS headers for iframe

**Credentials stored in proxy:**
```javascript
const AKENEO_CONFIG = {
  baseUrl: 'https://your-akeneo-instance.com',
  clientId: 'your_client_id',
  secret: 'your_client_secret',
  username: 'your_username',
  password: 'your_password',
};
```

⚠️ **Important**: These credentials are server-side only and never exposed to the browser.

---

## Troubleshooting

### Common Issues

#### 1. "Unauthorized - Invalid or missing API key"

**Cause**: API keys don't match between Cloudflare and Vercel

**Solution**:
1. Verify Cloudflare secret: `wrangler tail` (check logs)
2. Verify Vercel env var in dashboard
3. Ensure both use the **same exact key**
4. Redeploy both services

---

#### 2. "Gemini API error: 429 - Quota exceeded"

**Cause**: Exceeded free tier limits (500 requests/day)

**Solutions**:
- Wait for quota reset (daily)
- Upgrade to paid Gemini API plan
- Use `gemini-2.5-flash-lite` for lower token usage

---

#### 3. "Cannot load extension - no product UUID"

**Cause**: URL parameters not configured correctly

**Solution**:
Update iframe URL in Akeneo to include:
```
?product_uuid={{product_uuid}}&akeneo_url={{akeneo_url}}
```

---

#### 4. "AI proxy returned 500"

**Cause**: Worker error (check logs)

**Debug**:
```bash
# View live worker logs
wrangler tail

# Check for:
# - Gemini API errors
# - Invalid file format
# - Missing attributes
```

---

#### 5. Files > 150KB timeout in original extension

**Cause**: Akeneo SDK 5-second timeout

**Solution**: Use iframe extension instead (no timeout limit)

---

#### 6. CORS errors in browser console

**Cause**: Request from unauthorized domain

**Solution**:
1. Check `allowedOrigins` in worker
2. Add your domain if needed
3. Redeploy worker

---

### Debug Mode

Enable verbose logging in browser console:

```javascript
// In src/hooks/useAIEnrichment.ts, all console.log statements are already included
// Open browser DevTools → Console tab to see detailed logs
```

Logs include:
- Product loading
- File upload
- Payload size
- Worker response
- Attribute comparisons
- Save operations

---

## Future Enhancements

### Planned Features

| Feature | Priority | Status |
|---------|----------|--------|
| **Batch Processing** | High | 📝 Planned |
| **Multi-file Upload** | Medium | 📝 Planned |
| **Custom Prompt Editor** | Medium | 📝 Planned |
| **AI Training/Feedback Loop** | Low | 💡 Idea |
| **PDF Text Highlighting** | Low | 💡 Idea |
| **Confidence Threshold Adjustment** | Medium | 📝 Planned |
| **Export/Import Templates** | Low | 💡 Idea |
| **Audit Log** | High | 📝 Planned |
| **Multi-language Prompts** | Medium | 📝 Planned |

### Batch Processing Vision

Allow users to:
1. Select multiple products
2. Upload corresponding files
3. Queue AI extraction jobs
4. Review all proposals in one interface
5. Bulk apply changes

### Custom Prompt Editor Vision

Allow users to:
1. Create custom prompt templates
2. Save templates to Akeneo
3. Share templates with team
4. Version control for prompts

---

## Cost Analysis

### Free Tier (Current)

| Service | Free Tier | Cost if Exceeded |
|---------|-----------|------------------|
| **Gemini API** | 500 requests/day | $0.00 (upgrade required) |
| **Cloudflare Workers** | 100,000 requests/day | $5/month for 10M requests |
| **Vercel** | 100 GB bandwidth/month | $20/month Pro plan |

### Estimated Monthly Costs (Production)

**Scenario**: 1,000 products enriched/month

| Service | Usage | Cost |
|---------|-------|------|
| Gemini API | 1,000 requests | $0 (within free tier) |
| Cloudflare Workers | 1,000 requests | $0 (within free tier) |
| Vercel | ~10 GB bandwidth | $0 (within free tier) |
| **Total** | | **$0/month** |

**Scenario**: 10,000 products enriched/month (paid tier)

| Service | Usage | Cost |
|---------|-------|------|
| Gemini API | 10,000 requests | Upgrade to paid tier |
| Cloudflare Workers | 10,000 requests | $0 (within free tier) |
| Vercel | ~100 GB bandwidth | $0 or $20 (Pro plan) |
| **Total** | | **~$20-50/month** |

---

## Support & Contact

### Resources

- **GitHub Repository**: https://github.com/jacoblindborg-ops/AI-Extract
- **Akeneo Documentation**: https://api.akeneo.com/extensions/iframe.html
- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/

### Monitoring

- **Worker Logs**: `wrangler tail`
- **Vercel Logs**: Vercel Dashboard → Deployments → Logs
- **Browser Logs**: DevTools → Console

---

## Appendix

### File Structure

```
AI-Extract/
├── src/
│   ├── components/
│   │   ├── AIComparisonTable.tsx
│   │   ├── FileUploader.tsx
│   │   ├── PromptSelector.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useAIEnrichment.ts
│   │   └── usePromptSelection.ts
│   ├── services/
│   │   └── akeneoApi.ts
│   ├── types/
│   │   └── index.ts
│   ├── config.ts
│   └── App.tsx
├── api/
│   └── akeneo-proxy.js
├── cloudflare-worker/
│   ├── akeneo-ai-iframe-worker.js
│   ├── wrangler.toml
│   └── README.md
├── dist/                    # Build output
├── package.json
├── vercel.json
└── README.md
```

### Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main application component |
| `src/hooks/useAIEnrichment.ts` | Core business logic |
| `src/components/PromptSelector.tsx` | Template selection UI |
| `api/akeneo-proxy.js` | Akeneo API proxy |
| `cloudflare-worker/akeneo-ai-iframe-worker.js` | AI processing |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Original PIM SDK extension |
| 2.0 | 2024 | Iframe extension with prompt templates |
| 2.1 | 2024 | Added API authentication & CORS |

---

*Document last updated: 2024*
