import { REVIEWD_STORAGE_PREFIX } from './constants';

/** Remove all difit-storage-v1* keys from localStorage. */
export function clearReviewdStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(REVIEWD_STORAGE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => window.localStorage.removeItem(key));
}
