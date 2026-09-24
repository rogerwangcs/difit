import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WordHighlightProvider } from '../contexts/WordHighlightContext';

import { EnhancedShikiSyntaxHighlighter } from './EnhancedShikiSyntaxHighlighter';

vi.mock('./ShikiSyntaxHighlighter', () => ({
  ShikiSyntaxHighlighter: ({ code, className, renderToken, onMouseOver, onMouseOut }: any) => {
    const tokens = [{ content: code, color: '#ffffff' }];
    return (
      <span className={className} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
        {renderToken ? (
          tokens.map((token: any, idx: number) =>
            renderToken(token, idx, () => ({ style: { color: token.color } })),
          )
        ) : (
          <span>{code}</span>
        )}
      </span>
    );
  },
}));

const mockUseWordHighlight = vi.fn();
vi.mock('../contexts/WordHighlightContext', () => ({
  WordHighlightProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useWordHighlight: () => mockUseWordHighlight(),
}));

describe('EnhancedShikiSyntaxHighlighter', () => {
  beforeEach(() => {
    mockUseWordHighlight.mockReturnValue({
      highlightedWord: null,
      handleMouseOver: vi.fn(),
      handleMouseOut: vi.fn(),
      isWordHighlighted: vi.fn(() => false),
    });
  });

  it('should render code content', () => {
    render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="const hello = world" />
      </WordHighlightProvider>,
    );

    expect(screen.getByText(/hello/)).toBeInTheDocument();
    expect(screen.getByText(/world/)).toBeInTheDocument();
  });

  it('should wrap words in spans with word-token class', () => {
    const { container } = render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="hello world" />
      </WordHighlightProvider>,
    );

    const wordTokens = container.querySelectorAll('.word-token');
    expect(wordTokens).toHaveLength(2);
    expect(wordTokens[0]).toHaveTextContent('hello');
    expect(wordTokens[1]).toHaveTextContent('world');
  });

  it('should highlight words that match the highlighted word', () => {
    mockUseWordHighlight.mockReturnValue({
      highlightedWord: 'hello',
      handleMouseOver: vi.fn(),
      handleMouseOut: vi.fn(),
      isWordHighlighted: vi.fn((word: string) => word.toLowerCase() === 'hello'),
    });

    const { container } = render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="hello world Hello" />
      </WordHighlightProvider>,
    );

    const highlightedWords = container.querySelectorAll('.word-highlight');
    expect(highlightedWords).toHaveLength(2);
  });

  it('should call handleMouseOver when hovering a word', () => {
    const handleMouseOver = vi.fn();
    mockUseWordHighlight.mockReturnValue({
      highlightedWord: null,
      handleMouseOver,
      handleMouseOut: vi.fn(),
      isWordHighlighted: vi.fn(() => false),
    });

    const { container } = render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="hello world" />
      </WordHighlightProvider>,
    );

    const firstWord = container.querySelector('.word-token');
    if (firstWord) {
      fireEvent.mouseOver(firstWord);
      expect(handleMouseOver).toHaveBeenCalled();
    }
  });

  it('should call handleMouseOut when leaving a word', () => {
    const handleMouseOut = vi.fn();
    mockUseWordHighlight.mockReturnValue({
      highlightedWord: null,
      handleMouseOver: vi.fn(),
      handleMouseOut,
      isWordHighlighted: vi.fn(() => false),
    });

    const { container } = render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="hello world" />
      </WordHighlightProvider>,
    );

    const firstWord = container.querySelector('.word-token');
    if (firstWord) {
      fireEvent.mouseOut(firstWord);
      expect(handleMouseOut).toHaveBeenCalled();
    }
  });

  it('should handle empty code', () => {
    const { container } = render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="" />
      </WordHighlightProvider>,
    );

    const wordTokens = container.querySelectorAll('.word-token');
    expect(wordTokens).toHaveLength(0);
  });

  it('should not mark symbols as word tokens', () => {
    const { container } = render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="+ - = ! @" />
      </WordHighlightProvider>,
    );

    const wordTokens = container.querySelectorAll('.word-token');
    expect(wordTokens).toHaveLength(0);
    expect(container.textContent).toBe('+ - = ! @');
  });

  it('should handle XML/HTML-like tokens with multiple words', () => {
    const { container } = render(
      <WordHighlightProvider>
        <EnhancedShikiSyntaxHighlighter code="EnhancedShikiSyntaxHighlighter code" />
      </WordHighlightProvider>,
    );

    const wordTokens = container.querySelectorAll('.word-token');
    expect(wordTokens).toHaveLength(2);
    expect(wordTokens[0]).toHaveTextContent('EnhancedShikiSyntaxHighlighter');
    expect(wordTokens[1]).toHaveTextContent('code');
  });
});
