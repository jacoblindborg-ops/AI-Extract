/**
 * Prompt Selector Component
 * Allows users to choose from predefined AI extraction prompts
 */

import React from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  margin: 20px 0;
  padding: 15px 20px;
  background-color: ${({ theme }) => theme.color.grey20};
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.color.grey60};
`;

const SelectorLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.grey120};
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid ${({ theme }) => theme.color.grey80};
  border-radius: 4px;
  background-color: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.purple100};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.color.grey40};
    cursor: not-allowed;
  }
`;

const PromptDescription = styled.p`
  margin: 10px 0 0 0;
  font-size: 12px;
  color: ${({ theme }) => theme.color.grey100};
  line-height: 1.5;
`;

const OptionGroup = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.color.grey60};
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 8px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${({ theme }) => theme.color.grey120};
  cursor: pointer;

  input {
    cursor: pointer;
  }

  &:hover {
    color: ${({ theme }) => theme.color.grey140};
  }
`;

export const PROMPT_TEMPLATES = [
  {
    id: 'default',
    name: 'Standard Extraction',
    description: 'Balanced approach - extracts all common product attributes with high confidence',
  },
  {
    id: 'detailed',
    name: 'Detailed Extraction',
    description:
      'More thorough - extracts additional details like specifications, dimensions, materials',
  },
  {
    id: 'conservative',
    name: 'Conservative (High Confidence Only)',
    description: 'Only extracts attributes with very high confidence (>90%)',
  },
  {
    id: 'marketing',
    name: 'Marketing Focus',
    description: 'Focuses on marketing content - descriptions, features, benefits, selling points',
  },
  {
    id: 'technical',
    name: 'Technical Specifications',
    description:
      'Focuses on technical data - dimensions, weights, materials, certifications, SKUs',
  },
];

export type ExtractionMode = 'all' | 'empty';

interface PromptSelectorProps {
  selectedPromptId: string;
  onChange: (promptId: string) => void;
  extractionMode: ExtractionMode;
  onExtractionModeChange: (mode: ExtractionMode) => void;
  disabled?: boolean;
}

export function PromptSelector({
  selectedPromptId,
  onChange,
  extractionMode,
  onExtractionModeChange,
  disabled,
}: PromptSelectorProps) {
  const selectedPrompt = PROMPT_TEMPLATES.find((p) => p.id === selectedPromptId);

  return (
    <SelectorContainer>
      <SelectorLabel htmlFor="prompt-selector">AI Extraction Mode</SelectorLabel>
      <Select
        id="prompt-selector"
        value={selectedPromptId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {PROMPT_TEMPLATES.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </Select>
      {selectedPrompt && (
        <PromptDescription>
          <strong>{selectedPrompt.name}:</strong> {selectedPrompt.description}
        </PromptDescription>
      )}

      <OptionGroup>
        <SelectorLabel>Extract Attributes For:</SelectorLabel>
        <RadioGroup>
          <RadioLabel>
            <input
              type="radio"
              name="extraction-mode"
              value="all"
              checked={extractionMode === 'all'}
              onChange={(e) => onExtractionModeChange(e.target.value as ExtractionMode)}
              disabled={disabled}
            />
            All attributes (compare AI vs existing values)
          </RadioLabel>
          <RadioLabel>
            <input
              type="radio"
              name="extraction-mode"
              value="empty"
              checked={extractionMode === 'empty'}
              onChange={(e) => onExtractionModeChange(e.target.value as ExtractionMode)}
              disabled={disabled}
            />
            Empty attributes only (fill in missing data)
          </RadioLabel>
        </RadioGroup>
      </OptionGroup>
    </SelectorContainer>
  );
}
