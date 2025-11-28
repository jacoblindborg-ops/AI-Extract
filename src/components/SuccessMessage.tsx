/**
 * SuccessMessage Component
 */

import React from 'react';
import styled from 'styled-components';

const SuccessContainer = styled.div`
  margin: 20px 0;
  padding: 20px;
  background-color: ${({ theme }) => theme.color.green20};
  border: 2px solid ${({ theme }) => theme.color.green100};
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SuccessText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.green140};
  font-size: 14px;
  font-weight: 500;
`;

const DismissButton = styled.button`
  padding: 5px 15px;
  background-color: ${({ theme }) => theme.color.green100};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.color.green120};
  }
`;

interface SuccessMessageProps {
  message: string;
  onDismiss: () => void;
}

export function SuccessMessage({ message, onDismiss }: SuccessMessageProps) {
  return (
    <SuccessContainer>
      <SuccessText>{message}</SuccessText>
      <DismissButton onClick={onDismiss}>Dismiss</DismissButton>
    </SuccessContainer>
  );
}
