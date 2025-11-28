/**
 * Akeneo AI Enrichment Iframe Extension
 * Standalone App Entry Point
 *
 * This is a standalone React app that runs in an iframe within Akeneo PIM.
 * It communicates with Akeneo via PostMessage API and makes direct API calls.
 */

import { pimTheme } from 'akeneo-design-system';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { AIEnrichmentApp } from './App';
import { akeneoApi } from './services/akeneoApi';

console.log('[AI Enrichment Iframe] Starting...');

// Parse URL params from Akeneo
const urlParams = new URLSearchParams(window.location.search);
const contextFromUrl = {
  userUuid: urlParams.get('user[uuid]') || urlParams.get('user_uuid'),
  username: urlParams.get('user[username]') || urlParams.get('username'),
  locale: urlParams.get('user[catalog_locale]') || urlParams.get('locale'),
  channel: urlParams.get('user[catalog_scope]') || urlParams.get('channel'),
  productUuid: urlParams.get('product[uuid]') || urlParams.get('product_uuid'),
  productIdentifier: urlParams.get('product[identifier]'),
  tenant: urlParams.get('tenant'),
  akeneoUrl: urlParams.get('akeneo_url'), // Base URL of Akeneo instance
  accessToken: urlParams.get('access_token'), // Optional: Pre-generated access token
};

console.log('[AI Enrichment Iframe] Context from URL:', {
  ...contextFromUrl,
  accessToken: contextFromUrl.accessToken ? '***' : null, // Don't log token
});

// Configure Akeneo API service
// Multiple authentication options:
// 1. Access token from URL params (if provided)
// 2. OAuth credentials (configure in code below)
// 3. Session-based authentication (if same domain)

// Get Akeneo base URL - try multiple sources
let akeneoBaseUrl = contextFromUrl.akeneoUrl;

// If not in params, try to get from referrer (parent Akeneo window)
if (!akeneoBaseUrl && document.referrer) {
  try {
    const referrerUrl = new URL(document.referrer);
    akeneoBaseUrl = `${referrerUrl.protocol}//${referrerUrl.host}`;
    console.log('[AI Enrichment Iframe] Akeneo URL from referrer:', akeneoBaseUrl);
  } catch (e) {
    console.warn('[AI Enrichment Iframe] Could not parse referrer URL');
  }
}

// Fallback to parent window location
if (!akeneoBaseUrl && window.parent !== window) {
  try {
    akeneoBaseUrl = `${window.parent.location.protocol}//${window.parent.location.host}`;
    console.log('[AI Enrichment Iframe] Akeneo URL from parent window:', akeneoBaseUrl);
  } catch (e) {
    // Cross-origin restrictions - can't access parent location
    console.warn('[AI Enrichment Iframe] Cannot access parent window (CORS)');
  }
}

// Last resort fallback
if (!akeneoBaseUrl) {
  akeneoBaseUrl = window.location.origin;
  console.warn('[AI Enrichment Iframe] Using fallback URL:', akeneoBaseUrl);
}

// Option 1: If access token provided via URL, use it
if (contextFromUrl.accessToken) {
  console.log('[AI Enrichment Iframe] Using access token from URL params');
  akeneoApi.configure({ baseUrl: akeneoBaseUrl });
  akeneoApi.setToken(contextFromUrl.accessToken);
}
// Option 2: Configure with OAuth credentials (TODO: Add your credentials here)
else {
  console.log('[AI Enrichment Iframe] Configuring with OAuth credentials');
  akeneoApi.configure({
    baseUrl: akeneoBaseUrl,
    // TODO: Add your Akeneo API credentials here before deploying
    // Get these from: Akeneo > System > API connections
     clientId: '16_5690gc34ew00cc4o4w080g44o4408c4cs00kkw4wcgk4gs4w8o',
     secret: '5urzblhtwz0o484so48s8kokgg0ow88ocwwk44wkk40k4ck4s0',
     username: 'jacobpostman_7751',
     password: '3e681f0f6',
  });
}

console.log('[AI Enrichment Iframe] Akeneo API configured with base URL:', akeneoBaseUrl);

// Listen for PostMessage from Akeneo parent window
window.addEventListener('message', (event) => {
  // TODO: Verify event.origin matches your Akeneo instance
  console.log('[AI Enrichment Iframe] Received message:', event.data);

  // Handle context data from Akeneo
  if (event.data.type === 'context') {
    console.log('[AI Enrichment Iframe] Context data:', event.data.context);
    // You can update app state here with the context
  }

  // Handle authentication token from parent
  if (event.data.type === 'auth_token' && event.data.token) {
    console.log('[AI Enrichment Iframe] Received auth token from parent');
    // Update akeneoApi configuration with token
    // (Would need to add setToken method to akeneoApi)
  }
});

// Request context from Akeneo parent
if (window.parent !== window) {
  window.parent.postMessage({ type: 'request_context' }, '*');
}

// Initialize the app
async function initApp() {
  try {
    const rootElement = document.getElementById('root');

    if (!rootElement) {
      throw new Error('Root element not found');
    }

    // Render React app with theme provider
    ReactDOM.render(
      <ThemeProvider theme={pimTheme}>
        <AIEnrichmentApp />
      </ThemeProvider>,
      rootElement
    );

    console.log('[AI Enrichment Iframe] App initialized successfully');
  } catch (error) {
    console.error('[AI Enrichment Iframe] Failed to initialize:', error);

    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          max-width: 600px;
          margin: 50px auto;
          padding: 30px;
          background-color: #fff3f3;
          border: 2px solid #d32f2f;
          border-radius: 8px;
          text-align: center;
        ">
          <h2 style="color: #d32f2f; margin-top: 0;">App Error</h2>
          <p style="color: #333; font-size: 14px;">
            Failed to initialize the AI Enrichment app.
          </p>
          <p style="color: #666; font-size: 12px;">
            ${error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onclick="window.location.reload()"
            style="
              margin-top: 20px;
              padding: 10px 20px;
              background-color: #d32f2f;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            "
          >
            Reload
          </button>
        </div>
      `;
    }
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
