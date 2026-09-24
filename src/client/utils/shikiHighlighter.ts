import type { ThemeInput } from 'shiki';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

import {
  getGithubSyntaxShikiTheme,
  getGithubSyntaxThemeName,
} from '../themes/githubSyntaxThemeAdapter';

import { loadShikiLanguage, resolveShikiLanguage } from './shikiLanguageLoader';

let highlighterPromise: Promise<HighlighterCore> | null = null;

async function createHighlighter(): Promise<HighlighterCore> {
  const highlighter = await createHighlighterCore({
    themes: [getGithubSyntaxShikiTheme() as ThemeInput],
    langs: [],
    engine: createOnigurumaEngine(() => import('shiki/wasm')),
  });

  return highlighter;
}

export async function getShikiHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter().catch((error) => {
      highlighterPromise = null;
      throw error;
    });
  }

  return highlighterPromise;
}

export async function highlightCodeToTokens(
  code: string,
  lang: string,
): Promise<{ tokens: import('shiki').ThemedToken[][]; language: string }> {
  const highlighter = await getShikiHighlighter();
  let resolvedLang = resolveShikiLanguage(lang);

  try {
    resolvedLang = await loadShikiLanguage(highlighter, resolvedLang);
  } catch {
    resolvedLang = 'text';
  }

  const result = highlighter.codeToTokens(code, {
    lang: resolvedLang,
    theme: getGithubSyntaxThemeName(),
  });

  return { tokens: result.tokens, language: resolvedLang };
}
