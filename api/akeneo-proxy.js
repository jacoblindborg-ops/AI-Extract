/**
 * Vercel Serverless Function - Akeneo API Proxy
 *
 * This backend function proxies requests to Akeneo API to avoid CORS issues.
 *
 * Architecture:
 * Browser → Vercel Function → Akeneo API ✅ No CORS!
 */

// Akeneo credentials - these should be in environment variables in production
const AKENEO_CONFIG = {
  baseUrl: 'https://columbus-partnership-69e2883482.demo.cloud.akeneo.com',
  clientId: '16_5690gc34ew00cc4o4w080g44o4408c4cs00kkw4wcgk4gs4w8o',
  secret: '5urzblhtwz0o484so48s8kokgg0ow88ocwwk44wkk40k4ck4s0',
  username: 'jacobpostman_7751',
  password: '3e681f0f6',
};

let cachedToken = null;

/**
 * Get OAuth access token (with caching)
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  // Get new token
  const basicAuth = Buffer.from(`${AKENEO_CONFIG.clientId}:${AKENEO_CONFIG.secret}`).toString('base64');

  const formBody = new URLSearchParams({
    grant_type: 'password',
    username: AKENEO_CONFIG.username,
    password: AKENEO_CONFIG.password,
  });

  const response = await fetch(`${AKENEO_CONFIG.baseUrl}/api/oauth/v1/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to authenticate: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // Cache token (typically valid for 1 hour, we'll cache for 55 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (55 * 60 * 1000),
  };

  return cachedToken.token;
}

/**
 * Proxy handler
 */
module.exports = async function handler(req, res) {
  // Enable CORS for the iframe
  res.setHeader('Access-Control-Allow-Origin', '*'); // In production: restrict to your Vercel domain
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method = 'GET', path } = req.query;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Missing path parameter' });
    }

    // Get access token
    const token = await getAccessToken();

    // Build Akeneo API URL
    const apiUrl = `${AKENEO_CONFIG.baseUrl}/api/rest/v1/${path}`;

    console.log(`[Akeneo Proxy] ${method} ${apiUrl}`);

    // Make request to Akeneo
    const fetchOptions = {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST/PATCH requests
    if ((method === 'POST' || method === 'PATCH') && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(apiUrl, fetchOptions);

    // Get response data
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (response.status === 204) {
      data = { success: true };
    } else {
      data = await response.text();
    }

    // Return response
    if (!response.ok) {
      console.error(`[Akeneo Proxy] Error: ${response.status}`, data);
      return res.status(response.status).json({
        error: 'Akeneo API error',
        status: response.status,
        details: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('[Akeneo Proxy] Error:', error);
    console.error('[Akeneo Proxy] Stack:', error.stack);
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      stack: error.stack,
      details: error.toString()
    });
  }
};
