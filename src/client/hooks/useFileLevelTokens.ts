import { useEffect, useMemo, useState } from 'react';

import { type DiffFile } from '../../types/diff';
import { type SyntaxHighlightToken } from '../components/ShikiSyntaxHighlighter';
import { getPrismLanguageFromFilename } from '../utils/languageDetection';
import { getShikiHighlighter, highlightCodeToTokens } from '../utils/shikiHighlighter';
import { loadShikiLanguage } from '../utils/shikiLanguageLoader';

type LineTokensGetter = (lineNumber: number) => SyntaxHighlightToken[] | null;

export interface FileLevelTokens {
  getOldTokens: LineTokensGetter | null;
  getNewTokens: LineTokensGetter | null;
}

const EMPTY: FileLevelTokens = { getOldTokens: null, getNewTokens: null };

const MAX_WHOLE_FILE_LINES = 2000;

async function fetchBlobText(filePath: string, ref: string): Promise<string | null> {
  try {
    const response = await fetch(
      `/api/blob/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(ref)}`,
    );
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function tokenizeContent(
  content: string,
  language: string,
): Promise<SyntaxHighlightToken[][] | null> {
  if (content.split('\n').length > MAX_WHOLE_FILE_LINES) return null;

  try {
    const { tokens } = await highlightCodeToTokens(content, language);
    return tokens.map((line) =>
      line.map((token) => ({
        content: token.content,
        color: token.color,
        fontStyle: token.fontStyle,
      })),
    );
  } catch {
    return null;
  }
}

interface UseFileLevelTokensParams {
  file: DiffFile;
  enabled: boolean;
  baseCommitish?: string;
  targetCommitish?: string;
  reloadKey?: string | number;
}

export function useFileLevelTokens({
  file,
  enabled,
  baseCommitish,
  targetCommitish,
  reloadKey,
}: UseFileLevelTokensParams): FileLevelTokens {
  const language = useMemo(() => getPrismLanguageFromFilename(file.path), [file.path]);
  const isStdinDiff = baseCommitish === 'stdin' || targetCommitish === 'stdin';

  const [oldContent, setOldContent] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string | null>(null);
  const [grammarReady, setGrammarReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    void getShikiHighlighter()
      .then((highlighter) => loadShikiLanguage(highlighter, language))
      .then(() => {
        if (!cancelled) setGrammarReady(true);
      })
      .catch(() => {
        if (!cancelled) setGrammarReady(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, language]);

  useEffect(() => {
    if (!enabled || isStdinDiff) {
      setOldContent(null);
      setNewContent(null);
      return;
    }
    let cancelled = false;
    const needOld = file.status !== 'added' && !!baseCommitish;
    const needNew = file.status !== 'deleted' && !!targetCommitish;
    setOldContent(null);
    setNewContent(null);

    if (needOld) {
      const oldPath = file.oldPath || file.path;
      void fetchBlobText(oldPath, baseCommitish as string).then((text) => {
        if (!cancelled) setOldContent(text);
      });
    }
    if (needNew) {
      void fetchBlobText(file.path, targetCommitish as string).then((text) => {
        if (!cancelled) setNewContent(text);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    file.path,
    file.oldPath,
    file.status,
    baseCommitish,
    targetCommitish,
    reloadKey,
    isStdinDiff,
  ]);

  const [oldTokens, setOldTokens] = useState<SyntaxHighlightToken[][] | null>(null);
  const [newTokens, setNewTokens] = useState<SyntaxHighlightToken[][] | null>(null);

  useEffect(() => {
    if (!enabled || !grammarReady || oldContent == null) {
      setOldTokens(null);
      return;
    }

    let cancelled = false;
    void tokenizeContent(oldContent, language).then((tokens) => {
      if (!cancelled) setOldTokens(tokens);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, grammarReady, oldContent, language]);

  useEffect(() => {
    if (!enabled || !grammarReady || newContent == null) {
      setNewTokens(null);
      return;
    }

    let cancelled = false;
    void tokenizeContent(newContent, language).then((tokens) => {
      if (!cancelled) setNewTokens(tokens);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, grammarReady, newContent, language]);

  return useMemo<FileLevelTokens>(() => {
    if (!enabled) return EMPTY;
    const getOldTokens: LineTokensGetter | null = oldTokens
      ? (lineNumber: number) => oldTokens[lineNumber - 1] ?? null
      : null;
    const getNewTokens: LineTokensGetter | null = newTokens
      ? (lineNumber: number) => newTokens[lineNumber - 1] ?? null
      : null;
    return { getOldTokens, getNewTokens };
  }, [enabled, oldTokens, newTokens]);
}
