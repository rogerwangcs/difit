import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import {
  DEFAULT_EDITOR_OPTION,
  type EditorOptionId,
  resolveEditorOption,
} from '../../utils/editorOptions';
import type { AppearanceSettings } from '../components/SettingsModal';
import { fetchClientSettings, saveClientSettings } from '../services/userSettings';
import { normalizeAutoViewedPatterns } from '../utils/autoViewedPatterns';
import {
  APPEARANCE_STORAGE_KEY,
  applyResolvedTheme,
  resolveThemePreference,
  type ResolvedTheme,
} from '../utils/appearanceTheme';

const DEFAULT_SETTINGS: AppearanceSettings = {
  fontSize: 14,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  theme: 'dark',
  editor: {
    id: DEFAULT_EDITOR_OPTION.id,
    command: DEFAULT_EDITOR_OPTION.command,
    argsTemplate: DEFAULT_EDITOR_OPTION.argsTemplate,
  },
  autoViewedPatterns: [],
};

const normalizeEditorSettings = (raw: unknown): AppearanceSettings['editor'] => {
  if (typeof raw === 'string') {
    const preset = resolveEditorOption(raw);
    return {
      id: preset.id,
      command: preset.command,
      argsTemplate: preset.argsTemplate,
    };
  }

  if (raw && typeof raw === 'object') {
    const candidate = raw as {
      id?: unknown;
      command?: unknown;
      argsTemplate?: unknown;
    };
    const preset = resolveEditorOption(typeof candidate.id === 'string' ? candidate.id : undefined);
    const id: EditorOptionId = preset.id;
    const command = typeof candidate.command === 'string' ? candidate.command : preset.command;
    const argsTemplate =
      typeof candidate.argsTemplate === 'string' ? candidate.argsTemplate : preset.argsTemplate;
    return { id, command, argsTemplate };
  }

  return DEFAULT_SETTINGS.editor;
};

const APPEARANCE_SETTINGS_KEY = 'appearance';

const stripLegacyAppearanceFields = (
  parsed: Record<string, unknown>,
): Partial<AppearanceSettings> => {
  const rest = { ...parsed };
  delete rest.syntaxTheme;
  delete rest.colorVision;
  return rest as Partial<AppearanceSettings>;
};

const normalizeStoredSettings = (raw: unknown): AppearanceSettings | null => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const parsed = stripLegacyAppearanceFields(raw as Record<string, unknown>);
  const candidate = parsed as Partial<AppearanceSettings> & {
    autoViewedPatterns?: unknown;
    editor?: unknown;
  };

  return {
    ...DEFAULT_SETTINGS,
    ...candidate,
    theme: candidate.theme ?? DEFAULT_SETTINGS.theme,
    editor: normalizeEditorSettings(candidate.editor),
    autoViewedPatterns: normalizeAutoViewedPatterns(candidate.autoViewedPatterns),
  };
};

interface UseAppearanceSettingsReturn {
  settings: AppearanceSettings;
  updateSettings: (newSettings: AppearanceSettings) => void;
}

export function useAppearanceSettings(): UseAppearanceSettingsReturn {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    try {
      const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (stored) {
        const normalized = normalizeStoredSettings(JSON.parse(stored));
        if (normalized) {
          return normalized;
        }
      }
    } catch (error) {
      console.warn('Failed to load appearance settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (!stored) {
        return;
      }

      const raw = JSON.parse(stored) as Record<string, unknown>;
      if (!raw.syntaxTheme && !raw.colorVision) {
        return;
      }

      const normalized = normalizeStoredSettings(raw);
      if (!normalized) {
        return;
      }

      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(normalized));
      saveClientSettings({ [APPEARANCE_SETTINGS_KEY]: normalized });
    } catch {
      // Migration is best-effort.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetchClientSettings().then((client) => {
      if (cancelled || !client) {
        return;
      }

      const remote = normalizeStoredSettings(client[APPEARANCE_SETTINGS_KEY]);
      if (remote) {
        setSettings(remote);
        try {
          localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(remote));
        } catch {
          // localStorage is only a cache here; ignore write failures.
        }
        return;
      }

      let hasLocalSettings = false;
      try {
        hasLocalSettings = localStorage.getItem(APPEARANCE_STORAGE_KEY) !== null;
      } catch {
        // Treat unreadable localStorage as empty.
      }
      if (hasLocalSettings) {
        saveClientSettings({ [APPEARANCE_SETTINGS_KEY]: settingsRef.current });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyTheme = useCallback((theme: ResolvedTheme) => {
    applyResolvedTheme(theme);
  }, []);

  const saveSettings = useCallback((newSettings: AppearanceSettings) => {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save appearance settings to localStorage:', error);
    }
    saveClientSettings({ [APPEARANCE_SETTINGS_KEY]: newSettings });
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--app-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--app-font-family', settings.fontFamily);

    const applyResolvedAppearance = (resolvedTheme: ResolvedTheme) => {
      applyTheme(resolvedTheme);
    };

    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyResolvedAppearance(
        resolveThemePreference('auto', mediaQuery.matches ? 'dark' : 'light'),
      );

      const handleChange = (e: MediaQueryListEvent) => {
        applyResolvedAppearance(resolveThemePreference('auto', e.matches ? 'dark' : 'light'));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyResolvedAppearance(settings.theme);
      return undefined;
    }
  }, [settings, applyTheme]);

  const updateSettings = useCallback(
    (newSettings: AppearanceSettings) => {
      setSettings(newSettings);
      saveSettings(newSettings);
    },
    [saveSettings],
  );

  return useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
}
