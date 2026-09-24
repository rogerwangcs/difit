import { useEffect, useState } from 'react';

import { getShikiHighlighter } from '../utils/shikiHighlighter';
import { isBundledShikiLanguage, loadShikiLanguage } from '../utils/shikiLanguageLoader';

export function useHighlightedCode(_code: string, lang: string) {
  const [ready, setReady] = useState(() => isBundledShikiLanguage(lang));

  useEffect(() => {
    if (ready) return;

    if (isBundledShikiLanguage(lang)) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void getShikiHighlighter()
      .then((highlighter) => loadShikiLanguage(highlighter, lang))
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [lang, ready]);

  const actualLang = ready ? lang : 'text';

  return { ready, actualLang };
}
