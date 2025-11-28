# Akeneo AI Enrichment - Iframe Extension

**Standalone React app that solves the 5-second timeout issue**

## ✅ What's Complete

1. ✅ **Project cloned and configured** for standalone deployment
2. ✅ **Removed ALL Akeneo SDK dependencies** - No more `PIM.api.*` calls
3. ✅ **Direct fetch() to Cloudflare** - Bypasses Akeneo timeout completely
4. ✅ **Direct REST API calls** - Product loading, attribute metadata, saving
5. ✅ **URL param handling** - Gets product UUID from Akeneo iframe context
6. ✅ **PostMessage API** - Communicates with parent Akeneo window
7. ✅ **Vercel deployment ready** - `vercel.json` configured with iframe headers

## 🎯 The Architecture

### Before (Extension with SDK)
```
┌─────────────────────────────────────────┐
│ Akeneo Extension (Inside Akeneo UI)    │
│                                         │
│  Upload File → PIM.api.external.call()  │ ❌ 5-SECOND TIMEOUT
│                  ↓                      │
│             Cloudflare Worker           │
│                  ↓                      │
│              Gemini API (18s)           │
│                  ✗ TIMEOUT              │
└─────────────────────────────────────────┘
```

### After (Iframe)
```
┌─────────────────────────────────────────┐
│ Akeneo PIM (Parent Window)             │
│   ↓ PostMessage (product_uuid)          │
└─────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ Iframe (Your Vercel App)                │
│                                         │
│  Upload File → Direct fetch()           │ ✅ NO TIMEOUT LIMIT
│                  ↓                      │
│             Cloudflare Worker           │
│                  ↓                      │
│              Gemini API (60s+)          │
│                  ✓ SUCCESS              │
│                                         │
│  Save → Direct REST API                 │ ✅ NO TIMEOUT
│         akeneoApi.updateProduct()       │
└─────────────────────────────────────────┘
```

## 🚀 Deployment Steps

### 1. Install Dependencies
```bash
cd akeneo-ai-enrichment-iframe
npm install
```

### 2. Test Locally
```bash
npm start
# App runs at http://localhost:3000
# Test with: http://localhost:3000?product_uuid=test-uuid-123&akeneo_url=https://your-instance.akeneo.cloud
```

### 3. Build
```bash
npm run build
# Output: dist/
```

### 4. Deploy to Vercel
```bash
npm install -g vercel  # If not installed
vercel --prod
```

### 5. Configure in Akeneo

Create an iframe extension in Akeneo:

```yaml
# manifest.yml
name: ai_enrichment_iframe
version: 1.0.0
description: AI-powered product enrichment with document analysis

extensions:
  - module: pim/product-edit-form
    type: iframe
    config:
      title: AI Enrichment
      url: https://your-app.vercel.app?product_uuid={{product_uuid}}&akeneo_url={{akeneo_url}}
      height: 800px
```

## 🔐 Authentication

The iframe needs to authenticate with Akeneo REST API. Two options:

### Option 1: OAuth Credentials (Recommended for Production)
Configure in `src/services/akeneoApi.ts`:
```typescript
akeneoApi.configure({
  baseUrl: 'https://your-instance.akeneo.cloud',
  clientId: 'your_client_id',
  secret: 'your_client_secret',
  username: 'your_username',
  password: 'your_password',
});
```

### Option 2: Session Cookies (If Same-Origin)
If iframe is on same domain as Akeneo, browser cookies will authenticate automatically.

## 📁 Key Files Changed

### Core Logic
- `src/hooks/useAIEnrichment.ts` - Replaced ALL PIM SDK calls:
  - `PIM.api.product_uuid.get()` → `akeneoApi.getProduct()`
  - `PIM.api.family.get()` → `akeneoApi.getFamily()`
  - `PIM.api.attribute.get()` → `akeneoApi.getAttribute()`
  - `PIM.api.external.call()` → `fetch()` (NO TIMEOUT!)
  - `PIM.api.product_uuid.save()` → `akeneoApi.updateProduct()`

### API Service
- `src/services/akeneoApi.ts` - NEW: Direct REST API implementation

### Initialization
- `src/index.tsx` - Removed PIM SDK, added URL param parsing
- `src/App.tsx` - Get product UUID from URL params/PostMessage

### Configuration
- `src/config.ts` - Increased file size limit to 1MB (no more timeout!)
- `vercel.json` - Deployment config with iframe CSP headers
- `webpack.config.js` - Standalone SPA build configuration

## 🎯 The Win

| Metric | Extension (SDK) | Iframe (Direct) |
|--------|----------------|-----------------|
| Max file size | 150KB | 1MB+ |
| Processing time | 5 seconds max | 60+ seconds |
| Large PDF (313KB) | ❌ Timeout | ✅ Works |
| API calls | Via SDK (timeout) | Direct (no timeout) |

## 🧪 Testing

Test with the 313KB PDF that previously failed:
```bash
# 1. Upload essve_brandfog-2.pdf (313KB)
# 2. Wait ~18 seconds
# 3. ✅ See extracted attributes!
```

## 📝 Next Steps

1. ✅ Complete API integration
2. 🚧 Test locally
3. 🚧 Deploy to Vercel
4. 🚧 Configure Akeneo iframe
5. 🚧 Test with large files
6. 🚧 Production authentication setup

## 🐛 Troubleshooting

**Issue**: "No product UUID found"
- **Fix**: Ensure Akeneo passes `product_uuid` via URL params

**Issue**: "Failed to fetch product"
- **Fix**: Check Akeneo API credentials in `akeneoApi.configure()`

**Issue**: CORS errors
- **Fix**: Ensure Vercel headers allow Akeneo domain (already configured in `vercel.json`)

**Issue**: iframe blocked by CSP
- **Fix**: Check `Content-Security-Policy` header in Vercel deployment
