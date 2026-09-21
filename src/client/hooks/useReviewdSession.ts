import { useCallback, useEffect, useRef, useState } from 'react';

import { clearReviewdStorage } from '../../reviewd/reviewdStorage';

export interface ReviewdSession {
  session_id: string;
  generation: number;
  submit_seq: number;
  repo_name: string;
  branch: string;
  state: string;
  listener_attached?: boolean;
  proxy_url?: string;
  comment_count?: number;
}

export interface UseReviewdSessionOptions {
  pollIntervalMs?: number;
  onClearComments?: () => void;
}

const DEFAULT_POLL_MS = 2000;
const STOP_SENTINEL = '---review-loop-stopped---';

function buildDocumentTitle(session: ReviewdSession): string {
  return `Review · ${session.repo_name} · ${session.branch} · ${session.state}`;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function useReviewdSession(options: UseReviewdSessionOptions = {}) {
  const { pollIntervalMs = DEFAULT_POLL_MS, onClearComments } = options;
  const onClearCommentsRef = useRef(onClearComments);
  onClearCommentsRef.current = onClearComments;

  const [active, setActive] = useState(false);
  const [session, setSession] = useState<ReviewdSession | null>(null);
  const [sessions, setSessions] = useState<ReviewdSession[]>([]);
  const [threadCount, setThreadCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const generationRef = useRef<number | null>(null);

  const clearReviewState = useCallback(() => {
    clearReviewdStorage();
    onClearCommentsRef.current?.();
    setThreadCount(0);
  }, []);

  const applyGenerationGuard = useCallback(
    (nextGeneration: number) => {
      if (generationRef.current === null) {
        generationRef.current = nextGeneration;
        return;
      }
      if (nextGeneration > generationRef.current) {
        clearReviewState();
        generationRef.current = nextGeneration;
      }
    },
    [clearReviewState],
  );

  const refreshThreadCount = useCallback(async () => {
    const data = await fetchJson<{ threads?: unknown[] }>('/api/comments-json');
    if (!data) {
      return;
    }
    const threads = Array.isArray(data.threads) ? data.threads : [];
    setThreadCount(threads.length);
  }, []);

  const poll = useCallback(async () => {
    const current = await fetchJson<ReviewdSession>('/reviewd/session');
    if (!current) {
      setActive(false);
      setSession(null);
      return;
    }
    setActive(true);
    setSession(current);
    applyGenerationGuard(current.generation);
    document.title = buildDocumentTitle(current);

    const all = await fetchJson<ReviewdSession[]>('/reviewd/sessions');
    if (all) {
      setSessions(all);
    }
    await refreshThreadCount();
  }, [applyGenerationGuard, refreshThreadCount]);

  useEffect(() => {
    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [poll, pollIntervalMs]);

  const submitFeedback = useCallback(async () => {
    if (!session || !session.listener_attached || threadCount < 1 || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/reviewd/submit', { method: 'POST' });
      if (response.ok) {
        clearReviewState();
        const updated = await fetchJson<ReviewdSession>('/reviewd/session');
        if (updated) {
          generationRef.current = updated.generation;
          setSession(updated);
          document.title = buildDocumentTitle(updated);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [clearReviewState, session, submitting, threadCount]);

  const switchSession = useCallback((target: ReviewdSession) => {
    if (!target.proxy_url) {
      return;
    }
    window.location.assign(target.proxy_url);
  }, []);

  return {
    active,
    session,
    sessions,
    threadCount,
    submitting,
    submitFeedback,
    switchSession,
    stopSentinel: STOP_SENTINEL,
  };
}
