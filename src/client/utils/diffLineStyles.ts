import { type DiffLine, type ExpandedLine } from '../../types/diff';

type DiffLineType = DiffLine['type'];

const LINE_NUMBER_CELL_BASE =
  'w-[var(--line-number-width)] min-w-[var(--line-number-width)] max-w-[var(--line-number-width)] px-2 text-right border-r border-github-border select-none align-top relative';

function isHighlightedLineNumber(lineType: DiffLineType, side: 'old' | 'new'): boolean {
  return (lineType === 'delete' && side === 'old') || (lineType === 'add' && side === 'new');
}

function getLineNumberBackground(lineType: DiffLineType, side: 'old' | 'new'): string {
  if (lineType === 'delete' && side === 'old') {
    return 'bg-diff-deletion-num-bg';
  }
  if (lineType === 'add' && side === 'new') {
    return 'bg-diff-addition-num-bg';
  }
  return 'bg-github-bg-secondary';
}

function getLineNumberTextClass(lineType: DiffLineType, side: 'old' | 'new'): string {
  return isHighlightedLineNumber(lineType, side)
    ? 'text-code-line-number-highlight'
    : 'text-code-line-number';
}

function getLineNumberCellClass(
  lineType: DiffLineType,
  side: 'old' | 'new',
  extraClass = '',
): string {
  return `${LINE_NUMBER_CELL_BASE} ${getLineNumberBackground(lineType, side)} ${getLineNumberTextClass(lineType, side)} ${extraClass}`.trim();
}

export function getUnifiedOldLineNumberClass(line: Pick<DiffLine | ExpandedLine, 'type'>): string {
  return getLineNumberCellClass(line.type, 'old');
}

export function getUnifiedNewLineNumberClass(line: Pick<DiffLine | ExpandedLine, 'type'>): string {
  return getLineNumberCellClass(line.type, 'new', 'overflow-visible');
}

export function getSideBySideLineNumberClass(
  line: Pick<DiffLine, 'type'> | undefined,
  side: 'old' | 'new',
  isExpanded = false,
): string {
  const bg = isExpanded
    ? 'bg-github-bg-tertiary/80'
    : line
      ? getLineNumberBackground(line.type, side)
      : 'bg-github-bg-secondary';

  const lineType = line?.type ?? 'normal';
  const textClass = isExpanded ? 'text-code-line-number' : getLineNumberTextClass(lineType, side);

  return `${LINE_NUMBER_CELL_BASE} ${bg} ${textClass} overflow-visible`;
}
