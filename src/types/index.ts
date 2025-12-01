/**
 * Type definitions for Akeneo AI Enrichment Extension
 */

// Akeneo Product Types
export interface Product {
  uuid: string;
  identifier: string;
  family: string | null;
  parent: string | null;
  categories: string[];
  enabled: boolean;
  values: ProductValues;
  created: string;
  updated: string;
}

// Akeneo Attribute Types
export interface AttributeMetadata {
  code: string;
  type: string; // text, textarea, pim_catalog_simpleselect, pim_catalog_multiselect, etc.
  labels?: Record<string, string>;
  options?: AttributeOption[];
}

export interface AttributeOption {
  code: string;
  labels?: Record<string, string>;
}

export interface ProductValues {
  [attributeCode: string]: AttributeValue[];
}

export interface AttributeValue {
  locale: string | null;
  scope: string | null;
  data: string | number | boolean | null;
}

// Extension Configuration Types
export interface ExtensionConfig {
  makeWebhookUrl: string; // Full webhook URL for AI extraction
  workerApiKey: string; // API key for authenticating with worker
  credentialsCode: string; // Credentials code configured in Akeneo
  confidenceThreshold: number; // Auto-check if confidence >= this value
  supportedFileTypes: string[]; // e.g., ['application/pdf', 'image/jpeg', 'image/png']
  maxFileSizeMB: number; // Maximum file size in MB
  attributeWhitelist?: string[]; // Optional: limit which attributes can be enriched
}

// AI Extraction Types
export interface AIExtractionRequest {
  file: File;
  productUuid: string;
  currentValues: ProductValues;
}

export interface AIAttributeProposal {
  code: string; // Attribute code
  label: string; // Human-readable attribute name
  currentValue: string | null; // Current value in Akeneo
  proposedValue: string; // AI-proposed value
  confidence: number; // 0-1 confidence score
  locale: string | null; // Locale if applicable
  scope: string | null; // Scope if applicable
}

export interface AIExtractionResponse {
  success: boolean;
  message?: string;
  proposals: AIAttributeProposal[];
}

// Comparison State Types
export interface EnrichmentComparison extends AIAttributeProposal {
  isSelected: boolean; // User selected to apply this change
  isDifferent: boolean; // Whether proposed differs from current
  editedValue?: string; // User-edited value (overrides proposedValue)
  attributeType?: string; // Attribute type (text, select, multiselect, etc.)
  options?: AttributeOption[]; // Available options for select/multiselect
}

export interface EnrichmentState {
  product: Product | null;
  file: File | null;
  isUploading: boolean;
  isExtracting: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  comparisons: EnrichmentComparison[];
  extractionResponse: AIExtractionResponse | null;
}

// File Upload Types
export interface FileUploadResult {
  success: boolean;
  file?: File;
  error?: string;
}

// Save Result Types
export interface SaveResult {
  success: boolean;
  message: string;
  updatedAttributes?: string[];
}
