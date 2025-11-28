/**
 * AIComparisonTable Component
 * Displays current vs AI-proposed values with confidence scores
 */

import React from 'react';
import styled from 'styled-components';
import type { EnrichmentComparison } from '../types';

const TableContainer = styled.div`
  margin: 20px 0;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.grey80};
  border-radius: 4px;
`;

const TableHead = styled.thead`
  background-color: ${({ theme }) => theme.color.grey40};
`;

const TableRow = styled.tr<{ $isSelected?: boolean; $isDifferent?: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.color.grey60};
  background-color: ${({ $isSelected, $isDifferent, theme }) =>
    $isSelected ? theme.color.green20 : $isDifferent ? theme.color.yellow20 : 'transparent'};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${({ theme }) => theme.color.grey20};
  }
`;

const TableHeader = styled.th`
  padding: 12px 15px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.grey140};
  border-bottom: 2px solid ${({ theme }) => theme.color.grey80};
`;

const TableCell = styled.td`
  padding: 12px 15px;
  font-size: 13px;
  color: ${({ theme }) => theme.color.grey140};
  vertical-align: top;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const AttributeLabel = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.color.grey140};
  margin-bottom: 4px;
`;

const AttributeCode = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.color.grey100};
  font-family: monospace;
`;

const ValueCell = styled.div`
  max-width: 300px;
  word-break: break-word;
`;

const ValueText = styled.div<{ $isEmpty?: boolean }>`
  color: ${({ $isEmpty, theme }) => ($isEmpty ? theme.color.grey80 : theme.color.grey140)};
  font-style: ${({ $isEmpty }) => ($isEmpty ? 'italic' : 'normal')};
`;

const ConfidenceBadge = styled.span<{ $level: 'high' | 'medium' | 'low' }>`
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background-color: ${({ $level, theme }) =>
    $level === 'high'
      ? theme.color.green100
      : $level === 'medium'
        ? theme.color.yellow100
        : theme.color.red100};
  color: white;
`;

const LocaleTag = styled.span`
  display: inline-block;
  padding: 2px 6px;
  margin-left: 8px;
  border-radius: 3px;
  font-size: 10px;
  background-color: ${({ theme }) => theme.color.grey60};
  color: ${({ theme }) => theme.color.grey140};
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${({ theme }) => theme.color.grey100};
  font-size: 14px;
`;

const SelectAllContainer = styled.div`
  padding: 10px 15px;
  background-color: ${({ theme }) => theme.color.grey20};
  border-bottom: 1px solid ${({ theme }) => theme.color.grey60};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SelectAllLabel = styled.label`
  font-size: 13px;
  color: ${({ theme }) => theme.color.grey140};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EditableInput = styled.input`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.color.grey80};
  border-radius: 3px;
  font-size: 13px;
  color: ${({ theme }) => theme.color.grey140};
  background-color: ${({ theme }) => theme.color.white};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.color.purple100};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.color.grey40};
    cursor: not-allowed;
  }
`;

const EditableSelect = styled.select`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.color.grey80};
  border-radius: 3px;
  font-size: 13px;
  color: ${({ theme }) => theme.color.grey140};
  background-color: ${({ theme }) => theme.color.white};
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

interface AIComparisonTableProps {
  comparisons: EnrichmentComparison[];
  onToggleSelection: (code: string, locale: string | null) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onUpdateValue?: (code: string, locale: string | null, newValue: string) => void;
  disabled?: boolean;
}

export function AIComparisonTable({
  comparisons,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onUpdateValue,
  disabled = false,
}: AIComparisonTableProps) {
  if (comparisons.length === 0) {
    return (
      <EmptyState>
        No attribute proposals yet. Upload a file to get AI-powered enrichment suggestions.
      </EmptyState>
    );
  }

  const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  const allSelected = comparisons.every((c) => c.isSelected);
  const someSelected = comparisons.some((c) => c.isSelected);

  const handleSelectAllToggle = () => {
    if (allSelected || someSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <TableContainer>
      <Table>
        <colgroup>
          <col style={{ width: '50px' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <TableHead>
          <tr>
            <TableHeader>
              <SelectAllContainer>
                <SelectAllLabel>
                  <Checkbox
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAllToggle}
                    disabled={disabled}
                  />
                  All
                </SelectAllLabel>
              </SelectAllContainer>
            </TableHeader>
            <TableHeader>Attribute</TableHeader>
            <TableHeader>Current Value</TableHeader>
            <TableHeader>AI Proposed Value</TableHeader>
            <TableHeader>Confidence</TableHeader>
            <TableHeader>Status</TableHeader>
          </tr>
        </TableHead>
        <tbody>
          {comparisons.map((comparison) => {
            const key = `${comparison.code}-${comparison.locale || 'no-locale'}`;
            return (
              <TableRow
                key={key}
                $isSelected={comparison.isSelected}
                $isDifferent={comparison.isDifferent}
              >
                <TableCell>
                  <Checkbox
                    type="checkbox"
                    checked={comparison.isSelected}
                    onChange={() => onToggleSelection(comparison.code, comparison.locale)}
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell>
                  <AttributeLabel>
                    {comparison.label}
                    {comparison.locale && <LocaleTag>{comparison.locale}</LocaleTag>}
                  </AttributeLabel>
                  <AttributeCode>{comparison.code}</AttributeCode>
                </TableCell>
                <TableCell>
                  <ValueCell>
                    <ValueText $isEmpty={!comparison.currentValue}>
                      {comparison.currentValue || '(empty)'}
                    </ValueText>
                  </ValueCell>
                </TableCell>
                <TableCell>
                  <ValueCell>
                    {/* Render dropdown for select/multiselect, input for text */}
                    {comparison.attributeType === 'pim_catalog_simpleselect' && comparison.options && comparison.options.length > 0 ? (
                      <EditableSelect
                        value={comparison.editedValue || comparison.proposedValue}
                        onChange={(e) => onUpdateValue?.(comparison.code, comparison.locale, e.target.value)}
                        disabled={disabled}
                      >
                        <option value="">-- Select --</option>
                        {comparison.options.map((opt: any) => (
                          <option key={opt.code || opt} value={opt.code || opt}>
                            {opt.labels?.en_US || opt.code || opt}
                          </option>
                        ))}
                      </EditableSelect>
                    ) : (
                      <EditableInput
                        type="text"
                        value={comparison.editedValue || comparison.proposedValue}
                        onChange={(e) => onUpdateValue?.(comparison.code, comparison.locale, e.target.value)}
                        disabled={disabled}
                        placeholder="AI suggested value..."
                      />
                    )}
                  </ValueCell>
                </TableCell>
                <TableCell>
                  <ConfidenceBadge $level={getConfidenceLevel(comparison.confidence)}>
                    {formatConfidence(comparison.confidence)}
                  </ConfidenceBadge>
                </TableCell>
                <TableCell>
                  {comparison.isDifferent ? (
                    <span style={{ color: '#f39c12' }}>Different</span>
                  ) : (
                    <span style={{ color: '#27ae60' }}>Same</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
}
