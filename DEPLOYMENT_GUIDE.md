# Deployment Guide - Akeneo AI Enrichment Iframe

## Step-by-Step Deployment

### Step 1: Configure Authentication (REQUIRED BEFORE DEPLOYMENT)

The iframe needs to authenticate with your Akeneo REST API. Choose one option:

#### Option A: OAuth Credentials (Recommended)

1. **Get API Credentials from Akeneo:**
   - Log into your Akeneo instance
   - Go to: **System** → **API connections**
   - Click "Create" to create a new connection
   - Set permissions: Read products, Write products, Read families, Read attributes
   - Copy the **Client ID** and **Secret**

2. **Update the code:**

   Open `src/index.tsx` and update lines 52-60:

   ```typescript
   akeneoApi.configure({
     baseUrl: akeneoBaseUrl,
     clientId: '3_your_actual_client_id',           // From Akeneo
     secret: 'your_actual_secret_here',              // From Akeneo
     username: 'your_akeneo_username',               // Your Akeneo user
     password: 'your_akeneo_password',               // Your Akeneo password
   });
   ```

#### Option B: Access Token via URL (Simpler for Testing)

If Akeneo can pass an access token via URL params, no code changes needed! Just configure your iframe URL like:

```
https://your-app.vercel.app?product_uuid={{product_uuid}}&akeneo_url={{akeneo_url}}&access_token={{access_token}}
```

The app will automatically use the token if provided.

#### Option C: Session-Based (Advanced)

If you host the iframe on the same domain as Akeneo, it can use existing session cookies. Requires custom hosting setup.

---

### Step 2: Build the App

```bash
cd akeneo-ai-enrichment-iframe
npm install
npm run build
```

Expected output: `dist/` folder with `index.html` and `bundle.*.js`

---

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Deploy to production
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N** (first time)
- What's your project's name? `akeneo-ai-enrichment-iframe`
- In which directory is your code located? `./`
- Want to override the settings? **N**

**Copy the production URL** - you'll need it for Akeneo configuration.

Example: `https://akeneo-ai-enrichment-iframe.vercel.app`

---

### Step 4: Configure Iframe in Akeneo

Create a new iframe extension in your Akeneo instance.

**Method 1: Via Akeneo UI (if available)**
- Go to Extensions
- Create new iframe extension
- Configure URL and parameters

**Method 2: Via Configuration File**

Create or update your extension manifest:

```yaml
# config/extension.yml
name: ai_enrichment_iframe
version: 1.0.0
description: AI-powered product enrichment with document analysis

extensions:
  - module: pim/product-edit-form
    type: iframe
    config:
      title: AI Enrichment
      url: https://YOUR-VERCEL-URL.vercel.app?product_uuid={{product_uuid}}&akeneo_url={{akeneo_url}}
      height: 800px
```

**Replace `YOUR-VERCEL-URL.vercel.app` with your actual Vercel URL!**

---

### Step 5: Test the Integration

1. **Open a product in Akeneo**
2. **Look for the "AI Enrichment" tab/section**
3. **Upload a test PDF** (try the 313KB PDF that previously failed!)
4. **Wait for processing** (~18 seconds for large files)
5. **Review AI suggestions** - should see extracted attributes
6. **Select attributes** and click "Save"

---

## Troubleshooting

### "Failed to load product" Error

**Cause:** Authentication not configured properly

**Fix:**
1. Check you added credentials in `src/index.tsx`
2. Verify credentials are correct in Akeneo
3. Check API connection has proper permissions
4. Rebuild and redeploy: `npm run build && vercel --prod`

### "No product UUID found" Error

**Cause:** Iframe not receiving product context from Akeneo

**Fix:**
1. Verify URL includes `?product_uuid={{product_uuid}}`
2. Check iframe is configured correctly in Akeneo
3. Look at browser console for PostMessage logs

### CORS Errors

**Cause:** Vercel not allowing Akeneo domain

**Fix:**
Already configured in `vercel.json`, but verify:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://*.akeneo.com"
        }
      ]
    }
  ]
}
```

Update `*.akeneo.com` to match your Akeneo domain if different.

### Iframe Blocked by Browser

**Cause:** Content Security Policy

**Fix:**
- Check browser console for CSP errors
- Ensure Akeneo allows iframe embedding
- Verify Vercel deployment has correct headers

---

## Security Notes

⚠️ **Important:** Hardcoding credentials in client-side code means they are visible in the JavaScript bundle. For production:

1. **Option 1:** Use a backend proxy
   - Deploy a simple Node.js server that handles authentication
   - Iframe calls your server, server calls Akeneo
   - Credentials stay server-side

2. **Option 2:** Token-based approach
   - Akeneo generates short-lived tokens
   - Passes token via URL to iframe
   - Iframe uses token (already supported!)

3. **Option 3:** API connection with restricted permissions
   - Create Akeneo API connection with minimal permissions
   - Only allow product read/write for specific families
   - Limit IP address if possible

---

## What You've Deployed

- ✅ Standalone React app running in iframe
- ✅ Direct REST API calls (no SDK timeout!)
- ✅ Can handle 1MB+ files
- ✅ 60+ second processing time
- ✅ Dynamic attribute extraction
- ✅ Editable AI suggestions
- ✅ Dropdown menus for select attributes

The 313KB PDF that was timing out should now work perfectly! 🎉
