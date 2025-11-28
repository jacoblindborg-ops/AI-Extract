/**
 * ErrorPanel Component
 */

import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  margin: 20px 0;
  padding: 20px;
  background-color: ${({ theme }) => theme.color.red20};
  border: 2px solid ${({ theme }) => theme.color.red100};
  border-radius: 8px;
`;

const ErrorTitle = styled.h3`
  margin: 0 0 10px 0;
  color: ${({ theme }) => theme.color.red140};
  font-size: 18px;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.color.red140};
  font-size: 14px;
  white-space: pre-wrap;
`;

const RetryButton = styled.button`
  margin-top: 15px;
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.color.red100};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.color.red120};
  }
`;

interface ErrorPanelProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorPanel({ message, onRetry }: ErrorPanelProps) {
  return (
    <ErrorContainer>
      <ErrorTitle>Error</ErrorTitle>
      <ErrorMessage>{message}</ErrorMessage>
      {onRetry && <RetryButton onClick={onRetry}>Retry</RetryButton>}
    </ErrorContainer>
  );
}
