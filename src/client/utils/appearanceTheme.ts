import { getGithubCodeWindowCssVariables } from '../themes/githubSyntaxThemeAdapter';
import { getNordCssVariables } from '../themes/nordThemeAdapter';

type ThemePreference = 'light' | 'dark' | 'auto';

export type ColorVisionMode = 'normal' | 'deuteranopia';

export type ResolvedTheme = 'light' | 'dark';

type ThemeStorage = Pick<Storage, 'getItem'>;

type ThemeWindow = Pick<Window, 'matchMedia'>;

const THEME_ATTRIBUTE = 'data-theme';

const NORD_THEME_VALUES = {
  ...getNordCssVariables(),
  ...getGithubCodeWindowCssVariables(),
};

export const APPEARANCE_STORAGE_KEY = 'reviewit-appearance-settings';

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'auto';

const isResolvedTheme = (value: string | null): value is ResolvedTheme =>
  value === 'light' || value === 'dark';

const getThemeStorage = (): ThemeStorage | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const getThemeWindow = (): ThemeWindow | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window;
};

type StoredAppearanceSettings = {
  theme?: ThemePreference;
};

function getStoredAppearanceSettings(
  storage: ThemeStorage | undefined = getThemeStorage(),
): StoredAppearanceSettings | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const settings: StoredAppearanceSettings = {};
      const candidate = parsed as { theme?: unknown };

      if (isThemePreference(candidate.theme)) {
        settings.theme = candidate.theme;
      }

      return settings;
    }
  } catch {
    return null;
  }

  return null;
}

function getSystemTheme(themeWindow: ThemeWindow | undefined = getThemeWindow()): ResolvedTheme {
  const matchesDark = themeWindow?.matchMedia('(prefers-color-scheme: dark)').matches ?? true;
  return matchesDark ? 'dark' : 'light';
}

export function resolveThemePreference(
  preference: ThemePreference | null | undefined,
  systemTheme: ResolvedTheme = getSystemTheme(),
): ResolvedTheme {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }

  return systemTheme;
}

export function getResolvedTheme(
  doc: Document | undefined = typeof document === 'undefined' ? undefined : document,
  storage: ThemeStorage | undefined = getThemeStorage(),
  themeWindow: ThemeWindow | undefined = getThemeWindow(),
): ResolvedTheme {
  const documentTheme = doc?.documentElement.getAttribute(THEME_ATTRIBUTE) ?? null;
  if (isResolvedTheme(documentTheme)) {
    return documentTheme;
  }

  return resolveThemePreference(
    getStoredAppearanceSettings(storage)?.theme,
    getSystemTheme(themeWindow),
  );
}

export function applyResolvedTheme(
  theme: ResolvedTheme,
  _colorVision: ColorVisionMode = 'normal',
  doc = document,
) {
  const root = doc.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, theme);

  Object.entries(NORD_THEME_VALUES).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  if (doc.body) {
    doc.body.style.backgroundColor = 'var(--color-github-bg-primary)';
    doc.body.style.color = 'var(--color-github-text-primary)';
  }
}

export function bootstrapAppearanceTheme(
  doc: Document | undefined = typeof document === 'undefined' ? undefined : document,
  storage: ThemeStorage | undefined = getThemeStorage(),
  themeWindow: ThemeWindow | undefined = getThemeWindow(),
) {
  if (!doc) {
    return null;
  }

  const storedSettings = getStoredAppearanceSettings(storage);
  const resolvedTheme = resolveThemePreference(storedSettings?.theme, getSystemTheme(themeWindow));
  applyResolvedTheme(resolvedTheme, 'normal', doc);
  return resolvedTheme;
}
