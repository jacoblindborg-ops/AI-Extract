/**
 * Hook for managing selected prompt template and extraction mode
 */

import { useCallback, useEffect, useState } from 'react';
import type { ExtractionMode } from '../components/PromptSelector';

const PROMPT_STORAGE_KEY = 'akeneo_ai_selected_prompt';
const MODE_STORAGE_KEY = 'akeneo_ai_extraction_mode';
const DEFAULT_PROMPT_ID = 'default';
const DEFAULT_EXTRACTION_MODE: ExtractionMode = 'all';

export function usePromptSelection() {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(DEFAULT_PROMPT_ID);
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>(DEFAULT_EXTRACTION_MODE);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedPrompt = localStorage.getItem(PROMPT_STORAGE_KEY);
      if (savedPrompt) {
        setSelectedPromptId(savedPrompt);
        console.log('[Prompt Selection] Loaded prompt from localStorage:', savedPrompt);
      }

      const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as ExtractionMode;
      if (savedMode && (savedMode === 'all' || savedMode === 'empty')) {
        setExtractionMode(savedMode);
        console.log('[Prompt Selection] Loaded extraction mode from localStorage:', savedMode);
      }
    } catch (error) {
      console.warn('[Prompt Selection] Failed to load from localStorage:', error);
    }
  }, []);

  // Save selected prompt to localStorage
  const selectPrompt = useCallback((promptId: string) => {
    try {
      localStorage.setItem(PROMPT_STORAGE_KEY, promptId);
      setSelectedPromptId(promptId);
      console.log('[Prompt Selection] Saved prompt to localStorage:', promptId);
    } catch (error) {
      console.error('[Prompt Selection] Failed to save prompt:', error);
    }
  }, []);

  // Save extraction mode to localStorage
  const selectExtractionMode = useCallback((mode: ExtractionMode) => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
      setExtractionMode(mode);
      console.log('[Prompt Selection] Saved extraction mode to localStorage:', mode);
    } catch (error) {
      console.error('[Prompt Selection] Failed to save extraction mode:', error);
    }
  }, []);

  return {
    selectedPromptId,
    selectPrompt,
    extractionMode,
    selectExtractionMode,
  };
}
