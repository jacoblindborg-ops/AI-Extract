# Content Security Policy (CSP) Solutions

Your extension is being blocked by Akeneo's Content Security Policy (CSP). Here are all possible solutions:

## The Problem

```
Refused to connect to https://hook.eu2.make.com/...
because it does not appear in the connect-src directive of the Content Security Policy.
```

Akeneo blocks external requests for security. We need to whitelist Make.com or use a proxy.

---

## ✅ Solution 1: Contact Akeneo Support (Best)

**Recommended for production use.**

### Steps:
1. Contact Akeneo Support (via your CSM or support portal)
2. Request CSP whitelist addition:

```
Please add these domains to the Content Security Policy connect-src directive:
- hook.eu2.make.com
- *.make.com
```

3. Explain the use case: "AI-powered product enrichment via Make.com webhooks"

### Timeline:
- Usually takes 1-3 business days
- May require approval from security team

### After approval:
- Re-upload the extension (already built with correct URL)
- Test immediately - should work!

---

## ✅ Solution 2: Use a Proxy Server (Quick Workaround)

**Good for immediate testing or if Akeneo can't whitelist Make.com.**

### How it works:
```
[Extension] → [Your Proxy] → [Make.com]
              (allowed)       (forward request)
```

### Option A: PHP Proxy (Simplest)

1. **Upload proxy-example.php** to your web server
2. **Update extension config** to use your proxy URL:

```typescript
// src/config.ts
makeWebhookUrl: 'https://yourcompany.com/akeneo-proxy.php',
```

3. **Rebuild and upload**:
```bash
npm run build
```

**File included:** `proxy-example.php` (ready to use)

### Option B: Node.js Proxy

```javascript
// proxy-server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.raw({ type: '*/*', limit: '50mb' }));

app.post('/webhook', async (req, res) => {
  try {
    const response = await fetch(
      'https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29',
      {
        method: 'POST',
        body: req.body,
        headers: {
          'Content-Type': req.get('Content-Type'),
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Proxy running on port 3000'));
```

Run with:
```bash
npm install express node-fetch
node proxy-server.js
```

### Option C: Cloudflare Worker (Free, Fast)

1. Go to Cloudflare Workers: https://workers.cloudflare.com
2. Create new worker with this code:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Only allow POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Forward to Make.com
  const makeUrl = 'https://hook.eu2.make.com/57rv84gi6gmmqv0r6732the3z2uttk29'

  const response = await fetch(makeUrl, {
    method: 'POST',
    body: request.body,
    headers: {
      'Content-Type': request.headers.get('Content-Type'),
    },
  })

  // Return Make.com's response with CORS headers
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

3. Deploy and get URL: `https://your-worker.workers.dev`
4. Update config:
```typescript
makeWebhookUrl: 'https://your-worker.workers.dev',
```

---

## ✅ Solution 3: Check Akeneo CSP Settings

Some Akeneo instances allow CSP configuration:

### Steps:
1. Log in to Akeneo as admin
2. Go to **System → Configuration**
3. Look for **Security** or **Content Security Policy**
4. Check if you can add custom domains to `connect-src`

**Note:** This is usually only available for on-premise installations, not SaaS.

---

## ✅ Solution 4: Alternative Architecture (No External Calls)

If you can't whitelist Make.com or use a proxy, consider this alternative:

### Two-Step Process:
1. **Extension saves file to Akeneo asset**
2. **Make.com polls Akeneo** for new assets and processes them
3. **Make.com writes back to Akeneo** via API

This way, the extension doesn't make external calls.

**Downside:** Not real-time, requires polling

---

## Recommended Approach

### For Testing (Today):
Use **Solution 2** - Set up a quick Cloudflare Worker proxy (5 minutes, free)

### For Production (Next Week):
Use **Solution 1** - Contact Akeneo support to whitelist Make.com

---

## Quick Start with Cloudflare Worker

1. **Sign up** at https://workers.cloudflare.com (free)
2. **Create worker** with the code above
3. **Deploy** and copy URL
4. **Update config.ts**:
```typescript
makeWebhookUrl: 'https://your-worker.workers.dev',
```
5. **Rebuild**: `npm run build`
6. **Re-upload** to Akeneo
7. **Test!**

---

## Testing Your Solution

After implementing any solution above:

1. **Rebuild extension:**
```bash
cd /Users/jacoblindborg/Documents/akeneo-ai-enrichment
npm run build
```

2. **Upload** `dist/ai-enrichment.js` to Akeneo

3. **Test in browser:**
- Open product in Akeneo
- Go to AI Enrichment tab
- Upload a test file
- Open browser console (F12)
- Should see: `[AI Enrichment] Sending to Make webhook: [YOUR_URL]`
- Should NOT see CSP error

4. **Check Make.com:**
- Go to Make.com → History
- Should see incoming request

---

## Which Solution Should You Use?

| Solution | Setup Time | Cost | Best For |
|----------|------------|------|----------|
| Akeneo Support | 1-3 days | Free | Production (most secure) |
| Cloudflare Worker | 5 minutes | Free | Quick testing, production |
| PHP Proxy | 10 minutes | Hosting cost | If you have existing server |
| Node.js Proxy | 15 minutes | Server cost | More control needed |

**My recommendation:** Start with Cloudflare Worker for immediate testing, then contact Akeneo support for long-term production use.

---

## Need Help?

If none of these work, let me know and we can explore other options!
