/**
 * ActionBar Component
 * Bottom bar with Save and Cancel actions
 */

import React from 'react';
import styled from 'styled-components';

const BarContainer = styled.div<{ $visible: boolean }>`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px 20px;
  background-color: ${({ theme }) => theme.color.white};
  border-top: 2px solid ${({ theme }) => theme.color.grey80};
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  z-index: 10;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const RightSection = styled.div`
  display: flex;
  gap: 10px;
`;

const InfoText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.color.grey100};
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  background-color: ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.color.purple100 : theme.color.grey60};
  color: ${({ $variant }) => ($variant === 'primary' ? 'white' : '#333')};

  &:hover {
    background-color: ${({ $variant, theme }) =>
      $variant === 'primary' ? theme.color.purple120 : theme.color.grey80};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.color.grey60};
    color: ${({ theme }) => theme.color.grey100};
    cursor: not-allowed;
  }
`;

interface ActionBarProps {
  hasChanges: boolean;
  selectedCount: number;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function ActionBar({
  hasChanges,
  selectedCount,
  isSaving,
  onSave,
  onCancel,
}: ActionBarProps) {
  return (
    <BarContainer $visible={hasChanges && selectedCount > 0}>
      <LeftSection>
        <InfoText>
          {selectedCount} attribute{selectedCount !== 1 ? 's' : ''} selected for update
        </InfoText>
      </LeftSection>
      <RightSection>
        <Button $variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button $variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Apply Selected Changes'}
        </Button>
      </RightSection>
    </BarContainer>
  );
}
