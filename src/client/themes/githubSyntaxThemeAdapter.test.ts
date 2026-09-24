import { describe, expect, it } from 'vitest';

import {
  getGithubCodeWindowCssVariables,
  getGithubSyntaxShikiTheme,
  getGithubSyntaxThemeName,
} from './githubSyntaxThemeAdapter';

describe('githubSyntaxThemeAdapter', () => {
  it('uses github-dark-default for Shiki', () => {
    const theme = getGithubSyntaxShikiTheme();

    expect(getGithubSyntaxThemeName()).toBe('github-dark-default');
    expect(theme.colors?.['editor.foreground']).toBe('#e6edf3');
    expect(theme.colors?.['diffEditor.insertedTextBackground']).toBe('#3fb9504d');
    expect(theme.colors?.['diffEditor.removedTextBackground']).toBe('#ff7b724d');
  });

  it('maps code-window CSS variables from the GitHub theme', () => {
    const vars = getGithubCodeWindowCssVariables();

    expect(vars['--color-code-primary']).toBe('#e6edf3');
    expect(vars['--color-code-line-number']).toBe('#6e7681');
    expect(vars['--color-code-line-number-highlight']).toBe('#f0f6fc');
    expect(vars['--color-code-accent']).toBe('#3fb950');
    expect(vars['--color-code-danger']).toBe('#f85149');
    expect(vars['--color-diff-addition-bg']).toBe('#23863633');
    expect(vars['--color-diff-deletion-bg']).toBe('#da363333');
    expect(vars['--color-diff-addition-num-bg']).toBe('#2ea04359');
    expect(vars['--color-diff-deletion-num-bg']).toBe('#da363359');
    expect(vars['--color-diff-addition-border']).toBe('#2ea0434d');
    expect(vars['--color-diff-deletion-border']).toBe('#da36334d');
  });
});
