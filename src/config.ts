/**
 * Configuration for Akeneo AI Enrichment Extension
 *
 * To customize this extension:
 * 1. Update makeWebhookUrl with your Make.com webhook URL
 * 2. Adjust confidenceThreshold (0-1) for auto-selecting proposals
 * 3. Configure supportedFileTypes and maxFileSizeMB as needed
 * 4. Optional: Set attributeWhitelist to limit which attributes can be enriched
 */

import type { ExtensionConfig } from './types';

export const EXTENSION_CONFIG: ExtensionConfig = {
  // Cloudflare Worker URL for AI extraction
  // Replace with your deployed worker URL after deployment
  makeWebhookUrl: 'https://sparkling-term-6be2.jacob-lindborg.workers.dev',

  // Credentials code configured in Akeneo for SDK external calls
  // Configure in Akeneo UI: Connections > Credentials
  // Type: Bearer Token
  // Code: ai_enrichment_proxy
  // Token: (leave empty - not needed for our worker)
  credentialsCode: 'ai_enrichment_proxy',

  // Auto-select proposals with confidence >= this threshold (0-1)
  // e.g., 0.8 means proposals with 80%+ confidence are auto-checked
  confidenceThreshold: 0.8,

  // Supported file MIME types
  supportedFileTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],

  // Maximum file size in MB
  // Iframe version bypasses SDK timeout! Can handle large files (300KB+)
  // Cloudflare Worker can process files up to ~1MB effectively
  maxFileSizeMB: 1, // 1MB limit (no more timeout issues!)

  // Optional: Whitelist of attribute codes that can be enriched
  // Leave undefined to allow all attributes
  // attributeWhitelist: ['description', 'features', 'specifications', 'weight', 'dimensions'],
  attributeWhitelist: undefined,
};

// Helper function to validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!EXTENSION_CONFIG.supportedFileTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: ${EXTENSION_CONFIG.supportedFileTypes.join(', ')}`,
    };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > EXTENSION_CONFIG.maxFileSizeMB) {
    return {
      valid: false,
      error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum: ${EXTENSION_CONFIG.maxFileSizeMB}MB`,
    };
  }

  return { valid: true };
}
