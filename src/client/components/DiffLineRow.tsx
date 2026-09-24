import React from 'react';

import { type DiffLine, type ExpandedLine } from '../../types/diff';
import { type DiffSegment } from '../utils/wordLevelDiff';

import {
  getUnifiedNewLineNumberClass,
  getUnifiedOldLineNumberClass,
} from '../utils/diffLineStyles';

import { CommentButton } from './CommentButton';
import { DiffCodeLine } from './DiffCodeLine';
import { OpenInEditorButton } from './OpenInEditorButton';
interface DiffLineRowProps {
  line: DiffLine | ExpandedLine;
  index: number;
  lineId?: string;
  isCurrentLine?: boolean;
  hoveredLineIndex: number | null;
  selectedLineStyle: string;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseMove: () => void;
  onCommentButtonMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenInEditor?: () => void;
  syntaxTheme?: string;
  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  filename?: string;
  diffSegments?: DiffSegment[];
}

const getLineClass = (line: DiffLine | ExpandedLine) => {
  // Expanded lines have a subtle different background
  if ('isExpanded' in line && line.isExpanded) {
    return 'bg-github-bg-tertiary/80';
  }
  switch (line.type) {
    case 'add':
      return 'bg-diff-addition-bg';
    case 'delete':
      return 'bg-diff-deletion-bg';
    default:
      return 'bg-transparent';
  }
};

export const DiffLineRow: React.FC<DiffLineRowProps> = React.memo(
  ({
    line,
    index,
    lineId,
    isCurrentLine = false,
    hoveredLineIndex,
    selectedLineStyle,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onCommentButtonMouseDown,
    onOpenInEditor,
    syntaxTheme,
    onClick,
    filename,
    diffSegments,
  }) => {
    const lineNumber = line.newLineNumber || line.oldLineNumber;
    const showLineActions = hoveredLineIndex === index && lineNumber;

    const highlightClass = isCurrentLine ? 'keyboard-cursor' : '';

    return (
      <tr
        id={lineId}
        data-diff-line-row="true"
        className={`group ${getLineClass(line)} relative ${selectedLineStyle} ${highlightClass} cursor-pointer`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onClick={onClick}
      >
        <td className={getUnifiedOldLineNumberClass(line)}>{line.oldLineNumber || ''}</td>
        <td className={getUnifiedNewLineNumberClass(line)}>
          <span>{line.newLineNumber || ''}</span>
          {showLineActions && (
            <>
              {onOpenInEditor && <OpenInEditorButton onClick={onOpenInEditor} />}
              <CommentButton onMouseDown={onCommentButtonMouseDown} />
            </>
          )}
        </td>
        <td className="p-0 w-full relative align-top">
          <DiffCodeLine
            line={line}
            syntaxTheme={syntaxTheme}
            filename={filename}
            diffSegments={diffSegments}
          />
        </td>
      </tr>
    );
  },
);

DiffLineRow.displayName = 'DiffLineRow';
