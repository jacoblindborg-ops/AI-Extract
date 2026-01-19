/**
 * Main AI Enrichment Application Component
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ActionBar } from './components/ActionBar';
import { AIComparisonTable } from './components/AIComparisonTable';
import { ErrorPanel } from './components/ErrorPanel';
import { FileUploader } from './components/FileUploader';
import { LoadingSpinner } from './components/LoadingSpinner';
import { PromptSelector } from './components/PromptSelector';
import { SuccessMessage } from './components/SuccessMessage';
import { useAIEnrichment } from './hooks/useAIEnrichment';
import { usePromptSelection } from './hooks/usePromptSelection';

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: ${({ theme }) => theme.fontFamily};
`;

const Header = styled.div`
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid ${({ theme }) => theme.color.purple100};
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: bold;
  color: ${({ theme }) => theme.color.grey140};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${({ theme }) => theme.color.grey100};
`;

const ProductInfo = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background-color: ${({ theme }) => theme.color.grey20};
  border-radius: 4px;
`;

const ProductLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.color.grey100};
  margin-bottom: 4px;
`;

const ProductIdentifier = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.grey140};
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.grey140};
  margin: 0 0 15px 0;
`;

const SectionDescription = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.color.grey100};
  margin: 0 0 15px 0;
`;

const ExtractButton = styled.button`
  padding: 12px 24px;
  background-color: ${({ theme }) => theme.color.purple100};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;

  &:hover {
    background-color: ${({ theme }) => theme.color.purple120};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.color.grey80};
    cursor: not-allowed;
  }
`;

const SummaryPanel = styled.div`
  margin: 20px 0;
  padding: 15px 20px;
  background-color: ${({ theme }) => theme.color.blue20};
  border-left: 4px solid ${({ theme }) => theme.color.blue100};
  border-radius: 4px;
`;

const SummaryText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.color.grey140};
  line-height: 1.6;
`;

export function AIEnrichmentApp() {
  const [productUuid, setProductUuid] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize and get product UUID from URL params (iframe mode)
  useEffect(() => {
    async function initialize() {
      try {
        console.log('[AI Enrichment Iframe] Extension initializing...');

        // Parse URL parameters passed by Akeneo
        const urlParams = new URLSearchParams(window.location.search);

        // Akeneo passes parameters with bracket notation: product[uuid]
        let productUuid = urlParams.get('product_uuid') || urlParams.get('product[uuid]');

        // If not in URL, try to get from PostMessage
        if (!productUuid) {
          console.log('[AI Enrichment Iframe] No product_uuid in URL, waiting for PostMessage...');

          // Listen for context from parent window
          const messagePromise = new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout waiting for product context from Akeneo'));
            }, 5000);

            const handler = (event: MessageEvent) => {
              console.log('[AI Enrichment Iframe] Received message:', event.data);

              if (event.data.type === 'context' && event.data.context?.productUuid) {
                clearTimeout(timeout);
                window.removeEventListener('message', handler);
                resolve(event.data.context.productUuid);
              }
            };

            window.addEventListener('message', handler);

            // Request context from parent
            if (window.parent !== window) {
              window.parent.postMessage({ type: 'request_context' }, '*');
            }
          });

          try {
            productUuid = await messagePromise;
          } catch (err) {
            console.warn('[AI Enrichment Iframe] PostMessage timeout, trying URL fallback');
          }
        }

        if (!productUuid) {
          throw new Error('No product UUID found in URL params or PostMessage');
        }

        console.log('[AI Enrichment Iframe] Product UUID:', productUuid);
        setProductUuid(productUuid);
        setIsInitializing(false);
      } catch (error) {
        console.error('[AI Enrichment Iframe] Initialization error:', error);
        setIsInitializing(false);
      }
    }

    initialize();
  }, []);

  // Show loading while initializing
  if (isInitializing) {
    return <LoadingSpinner message="Initializing AI Enrichment..." />;
  }

  // Show error if no product UUID
  if (!productUuid) {
    // Debug: Show what URL params we got
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const allParams = Array.from(urlParams.entries()).map(([k, v]) => `${k}=${v}`).join(', ');

    return (
      <ErrorPanel
        message={`Cannot load extension - no product UUID found.\n\nCurrent URL: ${currentUrl}\n\nURL Parameters: ${allParams || 'none'}\n\nExpected parameter: product_uuid\n\nPlease configure iframe URL with: ?product_uuid={{product_uuid}}&akeneo_url={{akeneo_url}}`}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return <AIEnrichmentContent productUuid={productUuid} />;
}

interface AIEnrichmentContentProps {
  productUuid: string;
}

function AIEnrichmentContent({ productUuid }: AIEnrichmentContentProps) {
  const { selectedPromptId, selectPrompt, extractionMode, selectExtractionMode } = usePromptSelection();

  const {
    product,
    file,
    isUploading,
    isExtracting,
    isSaving,
    error,
    successMessage,
    comparisons,
    actions,
  } = useAIEnrichment(productUuid, selectedPromptId, extractionMode);

  const selectedCount = comparisons.filter((c) => c.isSelected).length;

  const handleFileSelect = (selectedFile: File) => {
    actions.extractFromFile(selectedFile);
  };

  const handleFileRemove = () => {
    actions.cancelChanges();
  };

  // Show loading state while loading product
  if (isUploading && !product) {
    return <LoadingSpinner message="Loading product..." />;
  }

  // Show error state
  if (error) {
    return <ErrorPanel message={error} onRetry={actions.reloadProduct} />;
  }

  return (
    <Container>
      <Header>
        <Title>HELLO WORLD - TEST DEPLOY</Title>
        <Subtitle>If you see this, deployment is working!</Subtitle>
      </Header>

      {product && (
        <ProductInfo>
          <ProductLabel>Product</ProductLabel>
          <ProductIdentifier>{product.identifier}</ProductIdentifier>
        </ProductInfo>
      )}

      {successMessage && (
        <SuccessMessage message={successMessage} onDismiss={() => actions.reloadProduct()} />
      )}

      <PromptSelector
        selectedPromptId={selectedPromptId}
        onChange={selectPrompt}
        extractionMode={extractionMode}
        onExtractionModeChange={selectExtractionMode}
        disabled={isExtracting || isSaving}
      />

      <Section>
        <SectionTitle>1. Upload File</SectionTitle>
        <SectionDescription>
          Upload a product datasheet (PDF) or product image to extract attribute information using
          AI.
        </SectionDescription>
        <FileUploader
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          selectedFile={file}
          disabled={isExtracting || isSaving}
        />
      </Section>

      {isExtracting && <LoadingSpinner message="Extracting attributes with AI..." />}

      {comparisons.length > 0 && (
        <>
          <Section>
            <SectionTitle>2. Review AI Proposals</SectionTitle>
            <SectionDescription>
              Review the AI-extracted attributes below. Select which changes you want to apply.
              High-confidence proposals are pre-selected.
            </SectionDescription>

            <SummaryPanel>
              <SummaryText>
                <strong>{comparisons.length}</strong> attributes extracted
                <br />
                <strong>{selectedCount}</strong> selected for update
              </SummaryText>
            </SummaryPanel>

            <AIComparisonTable
              comparisons={comparisons}
              onToggleSelection={actions.toggleSelection}
              onSelectAll={actions.selectAll}
              onDeselectAll={actions.deselectAll}
              onUpdateValue={actions.updateProposedValue}
              disabled={isSaving}
            />
          </Section>

          <ActionBar
            hasChanges={comparisons.length > 0}
            selectedCount={selectedCount}
            isSaving={isSaving}
            onSave={actions.saveChanges}
            onCancel={actions.cancelChanges}
          />
        </>
      )}
    </Container>
  );
}
