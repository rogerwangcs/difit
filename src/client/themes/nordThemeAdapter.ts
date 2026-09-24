import nordColorTheme from './nord/nord-color-theme.json';

export interface NordTerminalColors {
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
}

type VsCodeTheme = {
  name?: string;
  colors?: Record<string, string>;
  tokenColors?: Array<{
    name?: string;
    scope?: string | string[];
    settings?: { foreground?: string; background?: string; fontStyle?: string };
  }>;
};

const SHELL_BACKGROUND = '#0f1117';
const SHELL_BORDER = '#252d3a';
const ELEVATED_SURFACE = '#222833';
const LINE_HIGHLIGHT = '#1a1e28';
const COMMENT_TOKEN = '#d4922f';
// Midpoint between original Nord translucent diff tints and the darker solid pass.
const DIFF_ADDITION_BG = '#20292c';
const DIFF_DELETION_BG = '#36232a';

const USER_COLOR_OVERRIDES: Record<string, string> = {
  'editor.background': SHELL_BACKGROUND,
  'editorGutter.background': SHELL_BACKGROUND,
  'sideBar.background': SHELL_BACKGROUND,
  'tab.activeBackground': SHELL_BACKGROUND,
  'statusBar.background': SHELL_BACKGROUND,
  'statusBar.noFolderBackground': SHELL_BACKGROUND,
  'statusBar.debuggingBackground': SHELL_BACKGROUND,
  'terminal.background': SHELL_BACKGROUND,
  'sideBar.border': SHELL_BORDER,
  'diffEditor.insertedTextBackground': DIFF_ADDITION_BG,
  'diffEditor.removedTextBackground': DIFF_DELETION_BG,
};

const baseTheme = nordColorTheme as VsCodeTheme;

function getThemeColors(): Record<string, string> {
  return { ...baseTheme.colors, ...USER_COLOR_OVERRIDES };
}

function getColor(key: string, fallback = '#000000'): string {
  return getThemeColors()[key] ?? fallback;
}

export function getNordCssVariables(): Record<string, string> {
  return {
    '--color-github-bg-primary': getColor('sideBar.background', SHELL_BACKGROUND),
    '--color-github-bg-secondary': getColor('editor.background', SHELL_BACKGROUND),
    '--color-github-bg-tertiary': ELEVATED_SURFACE,
    '--color-github-border': getColor('sideBar.border', SHELL_BORDER),
    '--color-github-text-primary': getColor('editor.foreground', '#d8dee9'),
    '--color-github-text-secondary': getColor('sideBar.foreground', '#d8dee9'),
    '--color-github-text-muted': getColor('editorLineNumber.foreground', '#4c566a'),
    '--color-github-accent': getColor('charts.green', '#a3be8c'),
    '--color-github-danger': getColor('charts.red', '#bf616a'),
    '--color-github-warning': getColor('charts.yellow', '#ebcb8b'),
    '--color-diff-addition-bg': DIFF_ADDITION_BG,
    '--color-diff-deletion-bg': DIFF_DELETION_BG,
    '--color-diff-addition-border': getColor('editorGutter.addedBackground', '#a3be8c'),
    '--color-diff-deletion-border': getColor('editorGutter.deletedBackground', '#bf616a'),
    '--color-diff-neutral-bg': LINE_HIGHLIGHT,
    '--color-comment-bg': LINE_HIGHLIGHT,
    '--color-comment-border': getColor('sideBar.border', SHELL_BORDER),
    '--color-comment-text': getColor('editor.foreground', '#d8dee9'),
    '--color-yellow-btn-bg': getColor('button.background', '#88c0d0ee'),
    '--color-yellow-btn-border': getColor('button.hoverBackground', '#88c0d0'),
    '--color-yellow-btn-text': getColor('button.foreground', '#2e3440'),
    '--color-yellow-btn-hover-bg': getColor('button.hoverBackground', '#88c0d0'),
    '--color-yellow-btn-hover-border': getColor('button.hoverBackground', '#88c0d0'),
    '--color-yellow-path-bg': getColor('button.secondaryBackground', '#434c5e'),
    '--color-yellow-path-text': getColor('charts.lines', '#88c0d0'),
    '--color-editor-btn-bg': 'rgba(216, 222, 233, 0.1)',
    '--color-editor-btn-border': 'rgba(216, 222, 233, 0.3)',
    '--color-editor-btn-text': getColor('editor.foreground', '#d8dee9'),
    '--color-editor-btn-hover-bg': 'rgba(216, 222, 233, 0.2)',
    '--color-editor-btn-hover-border': 'rgba(216, 222, 233, 0.45)',
  };
}

export function getNordTerminalColors(): NordTerminalColors {
  return {
    background: getColor('editor.background', SHELL_BACKGROUND),
    foreground: getColor('editor.foreground', '#d8dee9'),
    cursor: getColor('editorCursor.foreground', '#d8dee9'),
    selectionBackground: getColor('editor.selectionBackground', '#434c5ecc'),
  };
}

function patchCommentTokenColors(
  tokenColors: VsCodeTheme['tokenColors'],
): VsCodeTheme['tokenColors'] {
  if (!tokenColors) {
    return tokenColors;
  }

  return tokenColors.map((entry) => {
    const scope = entry.scope;
    const isComment =
      scope === 'comment' ||
      (Array.isArray(scope) && scope.some((s) => s.includes('comment'))) ||
      entry.name?.toLowerCase().includes('comment');

    if (!isComment || !entry.settings?.foreground) {
      return entry;
    }

    return {
      ...entry,
      settings: {
        ...entry.settings,
        foreground: COMMENT_TOKEN,
      },
    };
  });
}

export function getNordShikiTheme(): VsCodeTheme {
  return {
    ...baseTheme,
    colors: getThemeColors(),
    tokenColors: patchCommentTokenColors(baseTheme.tokenColors),
  };
}
