import { describe, expect, it } from 'vitest';

import {
  getSideBySideLineNumberClass,
  getUnifiedNewLineNumberClass,
  getUnifiedOldLineNumberClass,
} from './diffLineStyles';

describe('diffLineStyles', () => {
  it('highlights unified old line numbers for deletions', () => {
    expect(getUnifiedOldLineNumberClass({ type: 'delete' })).toContain('bg-diff-deletion-num-bg');
    expect(getUnifiedOldLineNumberClass({ type: 'delete' })).toContain(
      'text-code-line-number-highlight',
    );
    expect(getUnifiedOldLineNumberClass({ type: 'add' })).toContain('bg-github-bg-secondary');
    expect(getUnifiedOldLineNumberClass({ type: 'add' })).toContain('text-code-line-number');
    expect(getUnifiedOldLineNumberClass({ type: 'normal' })).toContain('bg-github-bg-secondary');
    expect(getUnifiedOldLineNumberClass({ type: 'normal' })).toContain('text-code-line-number');
  });

  it('highlights unified new line numbers for additions', () => {
    expect(getUnifiedNewLineNumberClass({ type: 'add' })).toContain('bg-diff-addition-num-bg');
    expect(getUnifiedNewLineNumberClass({ type: 'add' })).toContain(
      'text-code-line-number-highlight',
    );
    expect(getUnifiedNewLineNumberClass({ type: 'delete' })).toContain('bg-github-bg-secondary');
    expect(getUnifiedNewLineNumberClass({ type: 'delete' })).toContain('text-code-line-number');
    expect(getUnifiedNewLineNumberClass({ type: 'normal' })).toContain('bg-github-bg-secondary');
    expect(getUnifiedNewLineNumberClass({ type: 'normal' })).toContain('text-code-line-number');
  });

  it('highlights side-by-side line numbers per side and line type', () => {
    expect(getSideBySideLineNumberClass({ type: 'delete' }, 'old')).toContain(
      'bg-diff-deletion-num-bg',
    );
    expect(getSideBySideLineNumberClass({ type: 'delete' }, 'old')).toContain(
      'text-code-line-number-highlight',
    );
    expect(getSideBySideLineNumberClass({ type: 'delete' }, 'new')).toContain(
      'bg-github-bg-secondary',
    );
    expect(getSideBySideLineNumberClass({ type: 'add' }, 'new')).toContain(
      'bg-diff-addition-num-bg',
    );
    expect(getSideBySideLineNumberClass({ type: 'add' }, 'new')).toContain(
      'text-code-line-number-highlight',
    );
    expect(getSideBySideLineNumberClass({ type: 'add' }, 'old')).toContain(
      'bg-github-bg-secondary',
    );
  });
});
