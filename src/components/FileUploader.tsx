/**
 * FileUploader Component
 * Allows users to upload PDF or image files for AI enrichment
 */

import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { validateFile } from '../config';

const UploadContainer = styled.div`
  margin: 20px 0;
  padding: 30px;
  border: 2px dashed ${({ theme }) => theme.color.grey80};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.color.grey20};
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.color.purple100};
    background-color: ${({ theme }) => theme.color.purple20};
  }

  &.drag-over {
    border-color: ${({ theme }) => theme.color.purple100};
    background-color: ${({ theme }) => theme.color.purple20};
  }
`;

const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  cursor: pointer;
`;

const UploadIcon = styled.div`
  font-size: 48px;
  color: ${({ theme }) => theme.color.grey100};
`;

const UploadText = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.color.grey140};
  font-weight: 500;
`;

const UploadHint = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.color.grey100};
`;

const HiddenInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.color.purple100};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.color.purple120};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.color.grey80};
    cursor: not-allowed;
  }
`;

const FilePreview = styled.div`
  margin-top: 15px;
  padding: 15px;
  background-color: ${({ theme }) => theme.color.white};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FileName = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.color.grey140};
  font-weight: 500;
`;

const FileSize = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.color.grey100};
  margin-left: 10px;
`;

const RemoveButton = styled.button`
  padding: 5px 10px;
  background-color: ${({ theme }) => theme.color.red100};
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.color.red120};
  }
`;

const ErrorMessage = styled.p`
  margin: 10px 0 0 0;
  padding: 10px;
  background-color: ${({ theme }) => theme.color.red20};
  border: 1px solid ${({ theme }) => theme.color.red100};
  border-radius: 4px;
  color: ${({ theme }) => theme.color.red140};
  font-size: 13px;
`;

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  disabled?: boolean;
}

export function FileUploader({
  onFileSelect,
  onFileRemove,
  selectedFile,
  disabled = false,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) {
        setError(null);
        return;
      }

      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0] || null;
    handleFileChange(file);
  };

  const handleRemove = () => {
    setError(null);
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <UploadContainer
        className={dragOver ? 'drag-over' : ''}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadLabel>
          <UploadIcon>📄</UploadIcon>
          <UploadText>
            {selectedFile ? 'File selected - Upload another?' : 'Upload PDF or Image'}
          </UploadText>
          <UploadHint>
            Drag and drop or click to browse
            <br />
            Supported: PDF, JPEG, PNG, WebP (max 10MB)
          </UploadHint>
          <HiddenInput
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            disabled={disabled}
          />
          <UploadButton type="button" disabled={disabled}>
            Choose File
          </UploadButton>
        </UploadLabel>
      </UploadContainer>

      {selectedFile && (
        <FilePreview>
          <div>
            <FileName>{selectedFile.name}</FileName>
            <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
          </div>
          <RemoveButton onClick={handleRemove} disabled={disabled}>
            Remove
          </RemoveButton>
        </FilePreview>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
