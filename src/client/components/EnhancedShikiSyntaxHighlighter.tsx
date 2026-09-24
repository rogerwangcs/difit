import React, { useCallback } from 'react';

import { useWordHighlight } from '../contexts/WordHighlightContext';
import { isWordToken } from '../utils/wordDetection';

import {
  ShikiSyntaxHighlighter,
  type ShikiSyntaxHighlighterProps,
  type SyntaxHighlightToken,
} from './ShikiSyntaxHighlighter';

type EnhancedShikiSyntaxHighlighterProps = Omit<
  ShikiSyntaxHighlighterProps,
  'renderToken' | 'onMouseOver' | 'onMouseOut'
>;

/**
 * Syntax highlighter with interactive word highlighting.
 *
 * When hovering over a word in the code, all occurrences of that word
 * are highlighted throughout the visible diff. This helps track variable
 * usage and identify patterns in the code.
 *
 * Features:
 * - Hover delay of 200ms to avoid accidental highlights
 * - Case-insensitive word matching
 * - Filters out single-character words
 * - Preserves original syntax highlighting from Shiki
 */
export const EnhancedShikiSyntaxHighlighter = React.memo(function EnhancedShikiSyntaxHighlighter(
  props: EnhancedShikiSyntaxHighlighterProps,
) {
  const { handleMouseOver, handleMouseOut, isWordHighlighted } = useWordHighlight();

  const renderToken = useCallback(
    (
      token: SyntaxHighlightToken,
      key: number,
      getTokenProps: (options: { token: SyntaxHighlightToken }) => Record<string, unknown>,
    ) => {
      const tokenProps = getTokenProps({ token });

      const parts = token.content.split(/( +)/);

      if (parts.length === 1 && parts[0] && !isWordToken(parts[0])) {
        return (
          <span key={key} {...tokenProps}>
            {token.content}
          </span>
        );
      }

      const renderedParts = parts.map((part, index) => {
        if (!part) return null;

        if (isWordToken(part)) {
          const trimmedPart = part.trim();
          const isHighlighted = isWordHighlighted(trimmedPart);
          return (
            <span
              key={`${key}-${index}`}
              className={`word-token ${isHighlighted ? 'word-highlight' : ''}`}
              data-word={trimmedPart}
            >
              {part}
            </span>
          );
        }

        return <span key={`${key}-${index}`}>{part}</span>;
      });

      return (
        <span key={key} {...tokenProps}>
          {renderedParts}
        </span>
      );
    },
    [isWordHighlighted],
  );

  return (
    <ShikiSyntaxHighlighter
      {...props}
      renderToken={renderToken}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    />
  );
});
