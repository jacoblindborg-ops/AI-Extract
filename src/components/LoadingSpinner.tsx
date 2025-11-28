/**
 * LoadingSpinner Component
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
`;

const Spinner = styled.div`
  border: 4px solid ${({ theme }) => theme.color.grey60};
  border-top: 4px solid ${({ theme }) => theme.color.purple100};
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.color.grey100};
`;

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <SpinnerContainer>
      <Spinner />
      <LoadingText>{message}</LoadingText>
    </SpinnerContainer>
  );
}
