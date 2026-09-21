import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { REVIEWD_STORAGE_PREFIX } from '../../reviewd/constants';
import { useReviewdSession } from './useReviewdSession';

describe('useReviewdSession', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stays inactive when /reviewd/session returns 404', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const { result } = renderHook(() => useReviewdSession());
    await waitFor(() => {
      expect(result.current.active).toBe(false);
    });
  });

  it('clears storage and calls onClearComments when generation increases', async () => {
    localStorage.setItem(`${REVIEWD_STORAGE_PREFIX}/repo/abc`, '{}');
    const onClearComments = vi.fn();

    let generation = 1;
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/reviewd/session')) {
        return {
          ok: true,
          json: async () => ({
            session_id: 'abc',
            generation,
            submit_seq: 0,
            repo_name: 'sample',
            branch: 'main',
            state: 'active',
            listener_attached: false,
          }),
        } as Response;
      }
      if (url.endsWith('/reviewd/sessions')) {
        return { ok: true, json: async () => [] } as Response;
      }
      if (url.endsWith('/api/comments-json')) {
        return { ok: true, json: async () => ({ threads: [] }) } as Response;
      }
      return { ok: false } as Response;
    });

    const { result } = renderHook(() => useReviewdSession({ onClearComments, pollIntervalMs: 50 }));
    await waitFor(() => {
      expect(result.current.active).toBe(true);
    });

    generation = 2;
    await waitFor(
      () => {
        expect(onClearComments).toHaveBeenCalled();
        expect(localStorage.getItem(`${REVIEWD_STORAGE_PREFIX}/repo/abc`)).toBeNull();
      },
      { timeout: 3000 },
    );
  });
});
