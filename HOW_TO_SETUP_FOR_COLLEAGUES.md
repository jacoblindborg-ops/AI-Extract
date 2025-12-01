# How to Setup Akeneo AI Enrichment - Complete Guide for Colleagues

This guide contains **all external resources, accounts, and credentials** needed to replicate this setup.

---

## 🚨 Security Warning

**IMPORTANT**: Several credentials in this document should be rotated/changed:
- ⚠️ GitHub Personal Access Token (exposed in conversation) - **REVOKE IMMEDIATELY**
- ⚠️ Akeneo API credentials (hardcoded in proxy) - Consider using environment variables
- ⚠️ Gemini API key - Keep secret, never commit to Git

---

## 📋 Required Accounts & Services

### 1. Google AI Studio (Gemini API)

**Purpose**: AI model for extracting product attributes

**How to Get**:
1. Go to: https://ai.google.dev/
2. Click "Get API Key"
3. Sign in with Google account
4. Create new API key in Google AI Studio
5. Copy the key (looks like: `AIzaSy...`)

**Free Tier**:
- 500 requests per day
- Gemini 2.5 Flash model
- No credit card required

**Upgrade**: https://ai.google.dev/pricing (if you need more than 500 req/day)

---

### 2. Cloudflare Account (Workers)

**Purpose**: Serverless backend for AI processing

**How to Get**:
1. Go to: https://dash.cloudflare.com/sign-up
2. Create free account
3. Verify email

**Free Tier**:
- 100,000 requests per day
- No credit card required

**Install Wrangler CLI**:
```bash
npm install -g wrangler
wrangler login
```

---

### 3. Vercel Account (Hosting)

**Purpose**: Host the iframe React app and API proxy

**How to Get**:
1. Go to: https://vercel.com/signup
2. Sign up with GitHub (recommended)
3. Verify email

**Free Tier**:
- 100 GB bandwidth per month
- Unlimited projects
- Automatic deployments from GitHub

**Install Vercel CLI** (optional):
```bash
npm install -g vercel
vercel login
```

---

### 4. GitHub Account (Code Repository)

**Purpose**: Version control and automatic deployments

**How to Get**:
1. Go to: https://github.com/signup
2. Create free account
3. Verify email

**Create Personal Access Token**:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Click "Generate token"
5. **Copy the token immediately** (you won't see it again)
6. ⚠️ **Keep it secret** - never share or commit to Git

---

### 5. Akeneo PIM Instance

**Purpose**: Product Information Management system

**What You Need**:
- Akeneo Cloud or Enterprise instance
- Admin access to create extensions
- API credentials (Client ID, Secret, Username, Password)

**How to Get API Credentials**:
1. Log in to Akeneo PIM
2. Go to: **System** → **Connections** → **Create**
3. Connection type: **Default**
4. Fill in:
   - Code: `ai_enrichment`
   - Label: `AI Enrichment Extension`
   - Flow type: `Data destination`
5. **Save**
6. Copy credentials:
   - Client ID (e.g., `16_5690gc34ew00cc4o4w080g44o4408c4cs00kkw4wcgk4gs4w8o`)
   - Secret (e.g., `5urzblhtwz0o484so48s8kokgg0ow88ocwwk44wkk40k4ck4s0`)
7. Create API user:
   - Go to: **System** → **Users** → **Create**
   - Username: `api_enrichment`
   - Password: (set a secure password)
   - Role: **Administrator** (or custom role with product edit permissions)

---

## 🔗 External Resources Provided

### Current Live Deployments

| Resource | URL | Purpose |
|----------|-----|---------|
| **Akeneo Instance** | https://columbus-partnership-69e2883482.demo.cloud.akeneo.com | Your PIM instance |
| **GitHub Repository** | https://github.com/jacoblindborg-ops/AI-Extract | Source code |
| **Vercel Iframe App** | https://ai-extract-ten.vercel.app | User interface |
| **Original Worker** | https://sparkling-term-6be2.jacob-lindborg.workers.dev | Legacy extension worker |
| **New Iframe Worker** | https://polished-mode-6d33.jacob-lindborg.workers.dev | Iframe extension worker |

---

## 🔐 Credentials Summary

### ⚠️ SENSITIVE - Store Securely

**Akeneo API Credentials** (currently in `/api/akeneo-proxy.js`):
```javascript
baseUrl: 'https://columbus-partnership-69e2883482.demo.cloud.akeneo.com'
clientId: '16_5690gc34ew00cc4o4w080g44o4408c4cs00kkw4wcgk4gs4w8o'
secret: '5urzblhtwz0o484so48s8kokgg0ow88ocwwk44wkk40k4ck4s0'
username: 'jacobpostman_7751'
password: '3e681f0f6'
```

**GitHub Token** (⚠️ REVOKE THIS - it was exposed):
```
ghp_[REDACTED] - Token was exposed and needs to be revoked
```

**To Revoke**:
1. Go to: https://github.com/settings/tokens
2. Find the token
3. Click "Delete"
4. Generate a new one

---

## 🚀 Complete Setup Instructions

### Prerequisites

Install required tools:
```bash
# Node.js (v18 or higher)
# Check: node --version

# Wrangler CLI
npm install -g wrangler

# Vercel CLI (optional)
npm install -g vercel
```

---

### Step-by-Step Setup

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/jacoblindborg-ops/AI-Extract.git
cd AI-Extract
npm install
```

---

#### 2️⃣ Setup Cloudflare Worker

```bash
cd cloudflare-worker

# Login to Cloudflare
wrangler login
# Follow the browser prompt to authenticate

# Set Gemini API Key
wrangler secret put GEMINI_API_KEY
# Paste your Gemini API key when prompted

# Generate and set Worker API Key (for authentication)
# Generate secure random key:
openssl rand -base64 32
# Copy the output, then:
wrangler secret put WORKER_API_KEY
# Paste the generated key when prompted

# Deploy the worker
wrangler deploy

# IMPORTANT: Copy the worker URL from the output
# Example: https://akeneo-ai-iframe-worker.your-subdomain.workers.dev
```

---

#### 3️⃣ Update Iframe App Configuration

```bash
cd ..  # Back to project root

# Edit src/config.ts
# Update makeWebhookUrl with your worker URL from step 2
```

Example:
```typescript
makeWebhookUrl: 'https://YOUR-WORKER-URL.workers.dev',
```

---

#### 4️⃣ Update Akeneo API Credentials

```bash
# Edit api/akeneo-proxy.js
# Update AKENEO_CONFIG with your credentials
```

Example:
```javascript
const AKENEO_CONFIG = {
  baseUrl: 'https://your-akeneo-instance.cloud.akeneo.com',
  clientId: 'YOUR_CLIENT_ID',
  secret: 'YOUR_CLIENT_SECRET',
  username: 'YOUR_API_USERNAME',
  password: 'YOUR_API_PASSWORD',
};
```

---

#### 5️⃣ Deploy to Vercel

**Option A: Via Vercel Dashboard** (Recommended)

1. Go to: https://vercel.com/new
2. Import from GitHub
3. Select repository: `AI-Extract`
4. Configure project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variable:
   - Name: `VITE_WORKER_API_KEY`
   - Value: (paste the same Worker API Key from step 2)
6. Click **Deploy**
7. Copy the deployment URL (e.g., `https://ai-extract-abc123.vercel.app`)

**Option B: Via CLI**

```bash
vercel login
vercel

# Add environment variable
vercel env add VITE_WORKER_API_KEY production
# Paste the Worker API Key from step 2

# Deploy to production
vercel --prod
```

---

#### 6️⃣ Configure Extension in Akeneo

1. Log in to Akeneo PIM
2. Go to: **System** → **Extensions**
3. Click **Create Extension**
4. Fill in details:
   - **Extension Name**: `AI Product Enrichment`
   - **Extension Type**: `Iframe Extension`
   - **Extension URL**:
     ```
     https://YOUR-VERCEL-URL.vercel.app/?product_uuid={{product_uuid}}&akeneo_url={{akeneo_url}}
     ```
     Replace `YOUR-VERCEL-URL` with your Vercel deployment URL
   - **Location**: `Product Edit Page → Tab`
   - **Label**: `AI Enrichment`
5. Click **Save**
6. **Activate** the extension

---

#### 7️⃣ Test the Extension

1. Go to any product in Akeneo
2. You should see a new **"AI Enrichment"** tab
3. Select a prompt template (e.g., "Standard Extraction")
4. Choose extraction mode (All or Empty)
5. Upload a PDF or image
6. Review AI suggestions
7. Click **Save Selected Changes**

---

## 🔄 How to Update

### Update Worker Code

```bash
cd cloudflare-worker
# Make your changes to akeneo-ai-iframe-worker.js
wrangler deploy
```

### Update Iframe App

```bash
cd AI-Extract
git pull  # Get latest changes
# Make your changes
git add .
git commit -m "Your changes"
git push

# Vercel will auto-deploy from GitHub
# Or manually: vercel --prod
```

---

## 🔑 Security Best Practices

### 1. Rotate Credentials

Generate new Worker API Key periodically:
```bash
# Generate new key
openssl rand -base64 32

# Update in Cloudflare
cd cloudflare-worker
wrangler secret put WORKER_API_KEY

# Update in Vercel
vercel env rm VITE_WORKER_API_KEY production
vercel env add VITE_WORKER_API_KEY production

# Redeploy both
wrangler deploy
vercel --prod
```

### 2. Move Credentials to Environment Variables

**Recommended**: Move Akeneo credentials from `api/akeneo-proxy.js` to Vercel environment variables:

1. In Vercel Dashboard, add:
   - `AKENEO_BASE_URL`
   - `AKENEO_CLIENT_ID`
   - `AKENEO_CLIENT_SECRET`
   - `AKENEO_USERNAME`
   - `AKENEO_PASSWORD`

2. Update `api/akeneo-proxy.js`:
   ```javascript
   const AKENEO_CONFIG = {
     baseUrl: process.env.AKENEO_BASE_URL,
     clientId: process.env.AKENEO_CLIENT_ID,
     secret: process.env.AKENEO_CLIENT_SECRET,
     username: process.env.AKENEO_USERNAME,
     password: process.env.AKENEO_PASSWORD,
   };
   ```

3. Redeploy: `vercel --prod`

### 3. Revoke Exposed GitHub Token

The GitHub token `ghp_[REDACTED]` was exposed during development.

**Action Required**:
1. Go to: https://github.com/settings/tokens
2. Find and delete this token
3. Generate a new one
4. Use the new token for future Git operations

---

## 📊 Cost Breakdown

### Current Setup (Free Tier)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Gemini API | 500 req/day | ~50-100/day | **$0** |
| Cloudflare Workers | 100K req/day | ~50-100/day | **$0** |
| Vercel | 100 GB bandwidth | ~5-10 GB/month | **$0** |
| GitHub | Unlimited public repos | 1 repo | **$0** |
| **Total** | | | **$0/month** |

### If Scaling Up (Paid Tier)

For 10,000+ requests/month:
- Gemini API: Upgrade to paid tier (~$20-50/month)
- Cloudflare Workers: Still free (under 100K req/day)
- Vercel: May need Pro plan ($20/month)
- **Estimated Total**: $40-70/month

---

## 📝 Checklist for Colleagues

Use this checklist when setting up for the first time:

- [ ] Created Google AI Studio account
- [ ] Generated Gemini API key
- [ ] Created Cloudflare account
- [ ] Installed Wrangler CLI
- [ ] Logged in to Wrangler
- [ ] Created Vercel account
- [ ] Created GitHub account (or use existing)
- [ ] Forked/cloned repository
- [ ] Generated Worker API key
- [ ] Set Gemini API key in Cloudflare
- [ ] Set Worker API key in Cloudflare
- [ ] Deployed Cloudflare Worker
- [ ] Updated `src/config.ts` with worker URL
- [ ] Updated `api/akeneo-proxy.js` with Akeneo credentials
- [ ] Set Worker API key in Vercel
- [ ] Deployed to Vercel
- [ ] Configured extension in Akeneo
- [ ] Tested extension with a product
- [ ] Verified AI extraction works
- [ ] Tested all 5 prompt templates
- [ ] Tested both extraction modes (All/Empty)
- [ ] Reviewed security setup
- [ ] Rotated any exposed credentials

---

## 🆘 Support & Troubleshooting

### Common Issues

**Issue**: "Unauthorized - Invalid or missing API key"
- **Fix**: Verify Worker API key matches in both Cloudflare and Vercel

**Issue**: "Gemini API error: 429"
- **Fix**: Exceeded free tier (500 req/day), wait or upgrade

**Issue**: "Cannot load extension"
- **Fix**: Check iframe URL parameters in Akeneo configuration

**Issue**: CORS errors
- **Fix**: Verify `allowedOrigins` in worker includes your Vercel URL

### Getting Help

1. Check browser console (F12 → Console tab)
2. Check Cloudflare Worker logs: `wrangler tail`
3. Check Vercel deployment logs in dashboard
4. Review documentation:
   - `CONFLUENCE_DOCUMENTATION.md` - Complete guide
   - `SECURITY_SETUP.md` - Security implementation
   - `cloudflare-worker/README.md` - Worker details

---

## 📚 Additional Resources

- **Akeneo Iframe Extensions**: https://api.akeneo.com/extensions/iframe.html
- **Gemini API Documentation**: https://ai.google.dev/gemini-api/docs
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Vercel Documentation**: https://vercel.com/docs
- **GitHub Repository**: https://github.com/jacoblindborg-ops/AI-Extract

---

## 🎓 Training Materials

### For End Users (Akeneo Users)

Create a simple guide showing:
1. Where to find the AI Enrichment tab
2. How to select a prompt template
3. How to upload a file
4. How to review and apply suggestions

### For Developers (Your Team)

Share:
- This document (`HOW_TO_SETUP_FOR_COLLEAGUES.md`)
- `CONFLUENCE_DOCUMENTATION.md` for technical details
- `SECURITY_SETUP.md` for security implementation
- Access to GitHub repository

---

## 🔄 Maintenance Schedule

| Task | Frequency | Responsible |
|------|-----------|-------------|
| Rotate Worker API Key | Every 90 days | DevOps |
| Check Gemini quota usage | Weekly | Product Owner |
| Review worker logs | Monthly | Developer |
| Update dependencies | Monthly | Developer |
| Test all prompt templates | After each update | QA |
| Backup configuration | Monthly | DevOps |

---

*Last Updated: December 2024*
*Contact: [Your Team Contact Info]*
