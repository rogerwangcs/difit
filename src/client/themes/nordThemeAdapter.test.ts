import { describe, expect, it } from 'vitest';

import { getNordCssVariables, getNordShikiTheme, getNordTerminalColors } from './nordThemeAdapter';

describe('nordThemeAdapter', () => {
  it('maps shell and editor colors to github CSS variables', () => {
    const vars = getNordCssVariables();

    expect(vars['--color-github-bg-primary']).toBe('#0f1117');
    expect(vars['--color-github-bg-secondary']).toBe('#0f1117');
    expect(vars['--color-github-bg-tertiary']).toBe('#222833');
    expect(vars['--color-github-border']).toBe('#252d3a');
    expect(vars['--color-github-text-primary']).toBe('#d8dee9');
    expect(vars['--color-github-accent']).toBe('#a3be8c');
    expect(vars['--color-github-danger']).toBe('#bf616a');
    expect(vars['--color-diff-addition-bg']).toBe('#20292c');
    expect(vars['--color-diff-deletion-bg']).toBe('#36232a');
    expect(vars['--color-yellow-btn-bg']).toBe('#88c0d0ee');
    expect(vars['--color-yellow-btn-text']).toBe('#2e3440');
    expect(vars['--color-yellow-btn-hover-bg']).toBe('#88c0d0');
    expect(vars['--color-yellow-path-bg']).toBe('#434c5e');
    expect(vars['--color-yellow-path-text']).toBe('#88c0d0');
  });

  it('exports terminal colors from editor tokens', () => {
    const terminal = getNordTerminalColors();

    expect(terminal.background).toBe('#0f1117');
    expect(terminal.foreground).toBe('#d8dee9');
    expect(terminal.cursor).toBe('#d8dee9');
    expect(terminal.selectionBackground).toBe('#434c5ecc');
  });

  it('patches comment token color for Shiki', () => {
    const theme = getNordShikiTheme();
    const commentRule = theme.tokenColors?.find((entry) => entry.scope === 'comment');

    expect(commentRule?.settings?.foreground).toBe('#d4922f');
  });
});
