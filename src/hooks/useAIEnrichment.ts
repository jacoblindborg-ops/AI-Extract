/**
 * Custom hook for managing AI enrichment state
 */

import { useCallback, useEffect, useState } from 'react';
import { EXTENSION_CONFIG } from '../config';
import { akeneoApi } from '../services/akeneoApi';
import type {
  AIExtractionResponse,
  EnrichmentComparison,
  EnrichmentState,
  Product,
  ProductValues,
  SaveResult,
} from '../types';

export function useAIEnrichment(productUuid: string, promptId?: string, extractionMode?: string) {
  const [state, setState] = useState<EnrichmentState>({
    product: null,
    file: null,
    isUploading: false,
    isExtracting: false,
    isSaving: false,
    error: null,
    successMessage: null,
    comparisons: [],
    extractionResponse: null,
  });

  /**
   * Load product data from Akeneo API
   */
  const loadProduct = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isUploading: true,
        error: null,
        successMessage: null,
      }));

      console.log('[AI Enrichment Iframe] Loading product:', productUuid);

      // Direct REST API call - no SDK timeout!
      const product: Product = await akeneoApi.getProduct(productUuid);
      console.log('[AI Enrichment Iframe] Product loaded:', product.identifier);
      console.log('[AI Enrichment Iframe] Product family:', product.family);

      setState((prev) => ({
        ...prev,
        product,
        isUploading: false,
      }));
    } catch (error: any) {
      console.error('[AI Enrichment] Error loading product:', error);
      setState((prev) => ({
        ...prev,
        error: `Failed to load product: ${error?.message || 'Unknown error'}`,
        isUploading: false,
      }));
    }
  }, [productUuid]);

  /**
   * Fetch attributes metadata for a product family
   */
  const fetchFamilyAttributes = useCallback(async (familyCode: string) => {
    try {
      console.log('[AI Enrichment Iframe] Fetching attributes for family:', familyCode);

      // Direct REST API call - no SDK!
      const family = await akeneoApi.getFamily(familyCode);
      const attributeCodes = family.attributes || [];
      console.log('[AI Enrichment Iframe] Family loaded:', family.code, 'with', attributeCodes.length, 'attributes');

      // Fetch detailed metadata for each attribute (type, options)
      const attributeMetadata = await Promise.all(
        attributeCodes.slice(0, 15).map(async (code: string) => {
          try {
            // Direct REST API call
            const attr = await akeneoApi.getAttribute(code);

            // Fetch options for select/multiselect attributes
            let options = [];
            if (attr.type === 'pim_catalog_simpleselect' || attr.type === 'pim_catalog_multiselect') {
              try {
                options = await akeneoApi.getAttributeOptions(code);
              } catch (err) {
                console.warn(`[AI Enrichment Iframe] Could not fetch options for ${code}`);
              }
            }

            return {
              code: attr.code,
              type: attr.type,
              labels: attr.labels,
              options: options,
              scopable: attr.scopable || false,
              localizable: attr.localizable || false,
            };
          } catch (err: any) {
            console.warn(`[AI Enrichment Iframe] Could not fetch metadata for attribute ${code}:`, err.message);
            return { code, type: 'text', options: [] };
          }
        })
      );

      console.log('[AI Enrichment Iframe] Fetched metadata for', attributeMetadata.length, 'attributes');
      return attributeMetadata;
    } catch (error: any) {
      console.error('[AI Enrichment] Error fetching family attributes:', error);
      return null;
    }
  }, []);

  /**
   * Upload file and extract AI proposals
   */
  const extractFromFile = useCallback(
    async (file: File) => {
      try {
        setState((prev) => ({
          ...prev,
          file,
          isExtracting: true,
          error: null,
          successMessage: null,
          comparisons: [],
          extractionResponse: null,
        }));

        console.log('[AI Enrichment] Extracting from file:', file.name);

        if (!state.product) {
          throw new Error('Product not loaded');
        }

        // Fetch family attributes if product has a family
        let familyAttributes: string[] | null = null;
        if (state.product.family) {
          familyAttributes = await fetchFamilyAttributes(state.product.family);
          console.log('[AI Enrichment] Family attributes:', familyAttributes);
        }

        // Convert file to base64
        const fileBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]; // Remove data:...;base64, prefix
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        console.log('[AI Enrichment] File converted to base64, length:', fileBase64.length);

        // Build JSON payload
        const payload = {
          file: fileBase64,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          productUuid: productUuid,
          productData: state.product,
          familyAttributes: familyAttributes, // Dynamic attributes from product family
          promptId: promptId || 'default', // Selected prompt template ID
          extractionMode: extractionMode || 'all', // 'all' or 'empty' - controls which attributes to extract
        };

        console.log('[AI Enrichment] Using prompt template:', promptId || 'default');
        console.log('[AI Enrichment] Extraction mode:', extractionMode || 'all');

        // 🎯 Direct fetch to Cloudflare Worker - NO SDK TIMEOUT!
        console.log('[AI Enrichment Iframe] Sending to AI proxy:', EXTENSION_CONFIG.makeWebhookUrl);
        console.log('[AI Enrichment Iframe] Payload size:', JSON.stringify(payload).length);
        console.log('[AI Enrichment Iframe] Direct fetch - NO 5-SECOND LIMIT!');

        // Direct API call - bypasses Akeneo SDK completely!
        const response = await fetch(EXTENSION_CONFIG.makeWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': EXTENSION_CONFIG.workerApiKey, // Authentication
          },
          body: JSON.stringify(payload),
          // No timeout limit - can wait 60+ seconds!
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`AI proxy returned ${response.status}: ${errorText}`);
        }

        // Parse response directly - no SDK wrapper
        const extractionResponse: AIExtractionResponse = await response.json();
        console.log('[AI Enrichment Iframe] AI proxy response:', extractionResponse);
        console.log('[AI Enrichment] Parsed extraction response:', extractionResponse);

        if (!extractionResponse.success) {
          throw new Error(extractionResponse.message || 'AI extraction failed');
        }

        // Build comparisons from proposals with attribute metadata
        const comparisons: EnrichmentComparison[] = extractionResponse.proposals.map((proposal) => {
          const currentValueArray = state.product!.values[proposal.code] || [];
          const currentValueObj = currentValueArray.find(
            (v) => v.locale === proposal.locale && v.scope === proposal.scope
          );
          const currentValue = currentValueObj?.data?.toString() || null;

          const isDifferent = currentValue !== proposal.proposedValue;
          const isAutoSelected = proposal.confidence >= EXTENSION_CONFIG.confidenceThreshold;

          // Find attribute metadata (type and options)
          const attrMetadata = familyAttributes?.find((attr: any) =>
            (typeof attr === 'string' ? attr === proposal.code : attr.code === proposal.code)
          );

          const metadata: any = typeof attrMetadata === 'object' && attrMetadata !== null ? attrMetadata : null;

          return {
            ...proposal,
            currentValue,
            isSelected: isDifferent && isAutoSelected, // Auto-select high-confidence changes
            isDifferent,
            attributeType: metadata?.type || 'text',
            options: metadata?.options || [],
            scopable: metadata?.scopable || false,
            localizable: metadata?.localizable || false,
          };
        });

        console.log('[AI Enrichment] Created', comparisons.length, 'comparisons');

        setState((prev) => ({
          ...prev,
          isExtracting: false,
          comparisons,
          extractionResponse,
          successMessage: `AI extracted ${comparisons.length} attribute suggestions`,
        }));
      } catch (error: any) {
        console.error('[AI Enrichment] Error extracting:', error);
        setState((prev) => ({
          ...prev,
          error: `Failed to extract attributes: ${error?.message || 'Unknown error'}`,
          isExtracting: false,
        }));
      }
    },
    [state.product, productUuid, promptId, extractionMode, fetchFamilyAttributes]
  );

  /**
   * Toggle selection of a comparison
   */
  const toggleSelection = useCallback((code: string, locale: string | null) => {
    setState((prev) => {
      const comparisons = prev.comparisons.map((comp) => {
        if (comp.code === code && comp.locale === locale) {
          return { ...comp, isSelected: !comp.isSelected };
        }
        return comp;
      });

      return { ...prev, comparisons };
    });
  }, []);

  /**
   * Select all comparisons
   */
  const selectAll = useCallback(() => {
    setState((prev) => {
      const comparisons = prev.comparisons.map((comp) => ({
        ...comp,
        isSelected: true,
      }));

      return { ...prev, comparisons };
    });
  }, []);

  /**
   * Deselect all comparisons
   */
  const deselectAll = useCallback(() => {
    setState((prev) => {
      const comparisons = prev.comparisons.map((comp) => ({
        ...comp,
        isSelected: false,
      }));

      return { ...prev, comparisons };
    });
  }, []);

  /**
   * Update proposed value for a comparison (allows editing AI suggestions)
   */
  const updateProposedValue = useCallback((code: string, locale: string | null, newValue: string) => {
    setState((prev) => {
      const comparisons = prev.comparisons.map((comp) => {
        if (comp.code === code && comp.locale === locale) {
          return {
            ...comp,
            editedValue: newValue,
            isDifferent: comp.currentValue !== newValue,
          };
        }
        return comp;
      });

      return { ...prev, comparisons };
    });
  }, []);

  /**
   * Save selected changes to Akeneo
   */
  const saveChanges = useCallback(async (): Promise<SaveResult> => {
    try {
      setState((prev) => ({
        ...prev,
        isSaving: true,
        error: null,
        successMessage: null,
      }));

      const selectedComparisons = state.comparisons.filter((c) => c.isSelected);

      if (selectedComparisons.length === 0) {
        setState((prev) => ({ ...prev, isSaving: false }));
        return { success: true, message: 'No changes to save' };
      }

      console.log(
        '[AI Enrichment] Saving',
        selectedComparisons.length,
        'attribute changes'
      );

      // Build PATCH payload
      const valuesToUpdate: ProductValues = {};

      for (const comp of selectedComparisons) {
        if (!valuesToUpdate[comp.code]) {
          // Copy existing values for this attribute
          valuesToUpdate[comp.code] = [...(state.product!.values[comp.code] || [])];
        }

        // Determine correct locale/scope based on attribute properties
        // Non-scopable attributes must have scope: null
        // Non-localizable attributes must have locale: null
        const effectiveScope = comp.scopable ? comp.scope : null;
        const effectiveLocale = comp.localizable ? comp.locale : null;

        // Find or create the value entry for this locale/scope
        const existingIndex = valuesToUpdate[comp.code].findIndex(
          (v) => v.locale === effectiveLocale && v.scope === effectiveScope
        );

        const newValue = {
          locale: effectiveLocale,
          scope: effectiveScope,
          data: comp.editedValue || comp.proposedValue, // Use edited value if available
        };

        if (existingIndex >= 0) {
          // Update existing
          valuesToUpdate[comp.code][existingIndex] = newValue;
        } else {
          // Add new
          valuesToUpdate[comp.code].push(newValue);
        }
      }

      const patchPayload = {
        values: valuesToUpdate,
      };

      console.log('[AI Enrichment] PATCH payload:', patchPayload);

      // Save via direct REST API - no SDK timeout!
      console.log('[AI Enrichment Iframe] Saving changes via REST API...');
      await akeneoApi.updateProduct(productUuid, patchPayload);

      const updatedAttributes = Object.keys(valuesToUpdate);

      console.log('[AI Enrichment] Save successful');

      // Reload product to get fresh data
      await loadProduct();

      setState((prev) => ({
        ...prev,
        isSaving: false,
        successMessage: `Successfully updated ${updatedAttributes.length} attribute(s)`,
        comparisons: [], // Clear comparisons after save
        file: null,
      }));

      return {
        success: true,
        message: `Successfully updated ${updatedAttributes.length} attribute(s)`,
        updatedAttributes,
      };
    } catch (error: any) {
      console.error('[AI Enrichment] Error saving:', error);

      let errorMessage = `Failed to save changes: ${error.message}`;

      // Handle specific error cases
      if (error.message.includes('412')) {
        errorMessage = 'The product was modified by another user. Please refresh and try again.';
      } else if (error.message.includes('422')) {
        errorMessage = 'Validation error: Please check the values and try again.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Permission denied: You do not have access to modify this product.';
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSaving: false,
      }));

      return { success: false, message: errorMessage };
    }
  }, [state.comparisons, state.product, productUuid, loadProduct]);

  /**
   * Cancel/discard all changes
   */
  const cancelChanges = useCallback(() => {
    if (window.confirm('Are you sure you want to discard all changes?')) {
      setState((prev) => ({
        ...prev,
        comparisons: [],
        file: null,
        extractionResponse: null,
        successMessage: null,
        error: null,
      }));
    }
  }, []);

  /**
   * Load product on mount
   */
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  return {
    ...state,
    actions: {
      extractFromFile,
      toggleSelection,
      selectAll,
      deselectAll,
      updateProposedValue,
      saveChanges,
      cancelChanges,
      reloadProduct: loadProduct,
    },
  };
}
