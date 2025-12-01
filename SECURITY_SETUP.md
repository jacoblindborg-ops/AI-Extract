# Security Setup Guide

## Overview

Your Cloudflare Worker is now protected with:
1. **API Key Authentication** - Only requests with valid `X-API-Key` header are accepted
2. **CORS Restrictions** - Only requests from your Vercel app are allowed

## Setup Steps

### Step 1: Generate a Secure API Key

Generate a random secure key using one of these methods:

**Option A: Using OpenSSL (Mac/Linux)**
```bash
openssl rand -base64 32
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Using Python**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the generated key - you'll need it for both Cloudflare and Vercel.

---

### Step 2: Set Secret in Cloudflare Worker

```bash
cd /Users/jacoblindborg/Documents/akeneo-ai-enrichment-iframe/cloudflare-worker

# Set the WORKER_API_KEY secret
wrangler secret put WORKER_API_KEY
# When prompted, paste your generated key

# Redeploy the worker
wrangler deploy
```

**Important:** The secret is stored securely in Cloudflare and is never visible in your code.

---

### Step 3: Set Environment Variable in Vercel

You have two options:

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/jacoblindborg-ops/ai-extract/settings/environment-variables
2. Add a new environment variable:
   - **Name**: `VITE_WORKER_API_KEY`
   - **Value**: (paste your generated key)
   - **Environment**: Production, Preview, Development
3. Click "Save"
4. Redeploy: Go to Deployments > Latest > Redeploy

**Option B: Via Vercel CLI**
```bash
# Install Vercel CLI if needed
npm install -g vercel

# Set the environment variable
vercel env add VITE_WORKER_API_KEY production
# When prompted, paste your generated key

# Redeploy
vercel --prod
```

---

### Step 4: Verify Authentication Works

1. After redeploying both Cloudflare Worker and Vercel app:
2. Go to your Akeneo instance and open the iframe extension
3. Upload a file to test extraction
4. **Success**: Extraction works normally
5. **Failure**: Check browser console for 401 Unauthorized errors

---

## Testing Authentication

### Test 1: Valid Request (Should Work)
Your iframe app will automatically send the correct API key.

### Test 2: Invalid Request (Should Fail)
Try calling the worker directly without the key:

```bash
curl -X POST https://polished-mode-6d33.jacob-lindborg.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing API key"
}
```

### Test 3: Wrong Key (Should Fail)
```bash
curl -X POST https://polished-mode-6d33.jacob-lindborg.workers.dev \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key" \
  -d '{"test": "data"}'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing API key"
}
```

---

## Security Features

### 1. API Key Authentication
- Worker checks `X-API-Key` header on every request
- Key is stored as a secret (not in code)
- Invalid/missing key returns 401 Unauthorized

### 2. CORS Protection
- Only allows requests from:
  - `https://ai-extract-ten.vercel.app` (production)
  - `http://localhost:3000` (local development)
- Blocks requests from other domains

### 3. Environment-Based Configuration
- API key loaded from environment variables
- Different keys for dev/staging/production (if needed)
- Never committed to Git

---

## Troubleshooting

### Error: "Unauthorized - Invalid or missing API key"

**Cause:** API keys don't match between Cloudflare and Vercel

**Fix:**
1. Verify the key in Cloudflare: Check worker logs with `wrangler tail`
2. Verify the key in Vercel: Check environment variables in dashboard
3. Make sure you redeployed **both** after setting the keys

### Error: CORS policy blocked

**Cause:** Request coming from unauthorized origin

**Fix:**
1. Check the `allowedOrigins` array in the worker code
2. Add your domain if testing from a different URL
3. Redeploy worker after changes

### Key Rotation

If you need to change the API key:
1. Generate a new key
2. Update Cloudflare secret: `wrangler secret put WORKER_API_KEY`
3. Update Vercel environment variable
4. Redeploy both services

---

## Best Practices

✅ **DO:**
- Keep the API key secret
- Use different keys for dev/staging/production
- Rotate keys periodically (e.g., every 90 days)
- Monitor worker logs for suspicious activity

❌ **DON'T:**
- Commit API keys to Git
- Share keys in Slack/email
- Use the same key across multiple projects
- Hardcode keys in source code

---

## Monitoring

Check Cloudflare Worker logs for authentication attempts:

```bash
wrangler tail
```

Look for:
- `[Worker] Authentication successful` - Valid requests
- `[Worker] Authentication failed` - Invalid key attempts

If you see many failed attempts, consider rotating your key.
