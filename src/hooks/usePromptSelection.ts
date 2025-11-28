/**
 * Hook for managing selected prompt template
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'akeneo_ai_selected_prompt';
const DEFAULT_PROMPT_ID = 'default';

export function usePromptSelection() {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(DEFAULT_PROMPT_ID);

  // Load selected prompt from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedPromptId(saved);
        console.log('[Prompt Selection] Loaded from localStorage:', saved);
      }
    } catch (error) {
      console.warn('[Prompt Selection] Failed to load from localStorage:', error);
    }
  }, []);

  // Save selected prompt to localStorage
  const selectPrompt = useCallback((promptId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, promptId);
      setSelectedPromptId(promptId);
      console.log('[Prompt Selection] Saved to localStorage:', promptId);
    } catch (error) {
      console.error('[Prompt Selection] Failed to save to localStorage:', error);
    }
  }, []);

  return {
    selectedPromptId,
    selectPrompt,
  };
}
