import type { ThemedToken } from 'shiki';
import React, { useCallback, useEffect, useState } from 'react';

import { useHighlightedCode } from '../hooks/useHighlightedCode';
import { getPrismLanguageFromFilename } from '../utils/languageDetection';
import { highlightCodeToTokens } from '../utils/shikiHighlighter';

export interface SyntaxHighlightToken {
  content: string;
  color?: string;
  fontStyle?: number;
}

export interface ShikiSyntaxHighlighterProps {
  code: string;
  language?: string;
  className?: string;
  syntaxTheme?: string;
  filename?: string;
  precomputedTokens?: SyntaxHighlightToken[][] | null;
  renderToken?: (
    token: SyntaxHighlightToken,
    key: number,
    getTokenProps: (options: { token: SyntaxHighlightToken }) => Record<string, unknown>,
  ) => React.ReactNode;
  onMouseOver?: (e: React.MouseEvent) => void;
  onMouseOut?: (e: React.MouseEvent) => void;
}

function toSyntaxToken(token: ThemedToken): SyntaxHighlightToken {
  return {
    content: token.content,
    color: token.color,
    fontStyle: token.fontStyle,
  };
}

function getTokenStyle(token: SyntaxHighlightToken): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (token.color) {
    style.color = token.color;
  }
  if (token.fontStyle !== undefined) {
    if (token.fontStyle & 1) {
      style.fontStyle = 'italic';
    }
    if (token.fontStyle & 2) {
      style.fontWeight = 'bold';
    }
    if (token.fontStyle & 4) {
      style.textDecoration = 'underline';
    }
  }
  return style;
}

export const ShikiSyntaxHighlighter = React.memo(function ShikiSyntaxHighlighter({
  code,
  language,
  className,
  filename = '',
  precomputedTokens,
  renderToken,
  onMouseOver,
  onMouseOut,
}: ShikiSyntaxHighlighterProps) {
  const detectedLang = language || (filename ? getPrismLanguageFromFilename(filename) : 'text');
  const { actualLang, ready } = useHighlightedCode(code, detectedLang);
  const [tokens, setTokens] = useState<SyntaxHighlightToken[][] | null>(precomputedTokens ?? null);

  useEffect(() => {
    if (precomputedTokens) {
      setTokens(precomputedTokens);
      return;
    }

    if (!ready || !code) {
      setTokens(code ? [[{ content: code }]] : []);
      return;
    }

    let cancelled = false;
    void highlightCodeToTokens(code, actualLang).then((result) => {
      if (!cancelled) {
        setTokens(result.tokens.map((line) => line.map(toSyntaxToken)));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, actualLang, ready, precomputedTokens]);

  const getTokenProps = useCallback(
    ({ token }: { token: SyntaxHighlightToken }) => ({
      style: getTokenStyle(token),
    }),
    [],
  );

  const lines = tokens ?? (code ? [[{ content: code }]] : []);

  return (
    <span
      className={className}
      style={{
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      {lines.map((line, lineIndex) => (
        <React.Fragment key={lineIndex}>
          {lineIndex > 0 ? '\n' : null}
          <span>
            {line.map((token, tokenIndex) =>
              renderToken ? (
                renderToken(token, tokenIndex, getTokenProps)
              ) : (
                <span key={tokenIndex} {...getTokenProps({ token })}>
                  {token.content}
                </span>
              ),
            )}
          </span>
        </React.Fragment>
      ))}
    </span>
  );
});
