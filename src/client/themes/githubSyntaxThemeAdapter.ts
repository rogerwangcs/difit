import githubDarkDefaultTheme from 'shiki/dist/themes/github-dark-default.mjs';

type VsCodeTheme = {
  name?: string;
  colors?: Record<string, string>;
  tokenColors?: Array<{
    name?: string;
    scope?: string | string[];
    settings?: { foreground?: string; background?: string; fontStyle?: string };
  }>;
};

const baseTheme = githubDarkDefaultTheme as VsCodeTheme;

const CODE_ACCENT = '#3fb950';
const CODE_DANGER = '#f85149';
// Muted diff tints — closer to the shell background, with a slightly stronger gutter column.
const DIFF_ADDITION_BG = '#23863633';
const DIFF_DELETION_BG = '#da363333';
const DIFF_ADDITION_NUM_BG = '#2ea04359';
const DIFF_DELETION_NUM_BG = '#da363359';
const DIFF_ADDITION_BORDER = '#2ea0434d';
const DIFF_DELETION_BORDER = '#da36334d';
const CODE_LINE_NUMBER_HIGHLIGHT = '#f0f6fc';

function getThemeColors(): Record<string, string> {
  return baseTheme.colors ?? {};
}

function getColor(key: string, fallback: string): string {
  return getThemeColors()[key] ?? fallback;
}

export function getGithubSyntaxShikiTheme(): VsCodeTheme {
  return baseTheme;
}

export function getGithubSyntaxThemeName(): string {
  return baseTheme.name ?? 'github-dark-default';
}

/** CSS variables scoped to diff/code surfaces — syntax colors stay Nord for UI chrome. */
export function getGithubCodeWindowCssVariables(): Record<string, string> {
  return {
    '--color-code-primary': getColor('editor.foreground', '#e6edf3'),
    '--color-code-line-number': getColor('editorLineNumber.foreground', '#6e7681'),
    '--color-code-line-number-highlight': CODE_LINE_NUMBER_HIGHLIGHT,
    '--color-code-accent': CODE_ACCENT,
    '--color-code-danger': CODE_DANGER,
    '--color-diff-addition-bg': DIFF_ADDITION_BG,
    '--color-diff-deletion-bg': DIFF_DELETION_BG,
    '--color-diff-addition-num-bg': DIFF_ADDITION_NUM_BG,
    '--color-diff-deletion-num-bg': DIFF_DELETION_NUM_BG,
    '--color-diff-addition-border': DIFF_ADDITION_BORDER,
    '--color-diff-deletion-border': DIFF_DELETION_BORDER,
  };
}
