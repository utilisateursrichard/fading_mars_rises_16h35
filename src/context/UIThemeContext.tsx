import React, { createContext, useContext, useState, useEffect } from 'react';

export type UIThemeId =
  | 'pulse'
  | 'google_m3e'
  | 'nova'
  | 'apple_pro'
  | 'horizon'
  | 'obsidian';

export interface UIThemeMeta {
  id: UIThemeId;
  label: string;
  shortTag: string;
  previewBg: string;
  previewAccent: string;
  isDark?: boolean;
}

export const UI_THEMES: UIThemeMeta[] = [
  {
    id: 'pulse',
    label: 'Pulse',
    shortTag: 'Signature BetterSchool',
    previewBg: '#F7F6F2',
    previewAccent: '#121318',
  },
  {
    id: 'google_m3e',
    label: 'Google M3E',
    shortTag: 'Android 16/17 Pixel',
    previewBg: '#F2F6FC',
    previewAccent: '#00639B',
  },
  {
    id: 'nova',
    label: 'Nova',
    shortTag: 'Dynamic Island Sombre',
    previewBg: '#0C0E14',
    previewAccent: '#F59E0B',
    isDark: true,
  },
  {
    id: 'apple_pro',
    label: 'Apple Pro',
    shortTag: 'macOS / iPadOS',
    previewBg: '#F2F2F7',
    previewAccent: '#007AFF',
  },
  {
    id: 'horizon',
    label: 'Horizon',
    shortTag: 'Dock & Focus',
    previewBg: '#ECEFF4',
    previewAccent: '#0A66FF',
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    shortTag: 'Studio Sombre',
    previewBg: '#0B0C10',
    previewAccent: '#38BDF8',
    isDark: true,
  },
];

const STORAGE_KEY = 'betterschool_ui_theme_v1';
const COOKIE_NAME = 'betterschool_ui_theme';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 an

function readThemeCookie(): UIThemeId | null {
  if (typeof document === 'undefined') return null;
  try {
    const pairs = document.cookie ? document.cookie.split('; ') : [];
    for (const pair of pairs) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const name = decodeURIComponent(pair.slice(0, eqIdx));
      if (name === COOKIE_NAME) {
        const value = decodeURIComponent(pair.slice(eqIdx + 1)) as UIThemeId;
        if (VALID_THEME_IDS.has(value)) return value;
      }
    }
  } catch {}
  return null;
}

function writeThemeCookie(theme: UIThemeId): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${encodeURIComponent(COOKIE_NAME)}=${encodeURIComponent(theme)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch {}
}

interface UIThemeContextType {
  uiTheme: UIThemeId;
  setUiTheme: (theme: UIThemeId) => void;
}

const UIThemeContext = createContext<UIThemeContextType | undefined>(undefined);

const VALID_THEME_IDS = new Set<UIThemeId>(UI_THEMES.map((t) => t.id));

export const UIThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiTheme, setUiThemeState] = useState<UIThemeId>(() => {
    try {
      const fromCookie = readThemeCookie();
      if (fromCookie) return fromCookie;

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY) as UIThemeId | null;
        if (stored && VALID_THEME_IDS.has(stored)) {
          writeThemeCookie(stored);
          return stored;
        }
      }
    } catch {}
    return 'pulse';
  });

  const setUiTheme = (theme: UIThemeId) => {
    setUiThemeState(theme);
    writeThemeCookie(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  };

  useEffect(() => {
    writeThemeCookie(uiTheme);
    document.documentElement.dataset.uiTheme = uiTheme;
    const isDark = uiTheme === 'obsidian' || uiTheme === 'nova';
    document.documentElement.classList.toggle('dark', isDark);
  }, [uiTheme]);

  return (
    <UIThemeContext.Provider value={{ uiTheme, setUiTheme }}>
      {children}
    </UIThemeContext.Provider>
  );
};

export const useUITheme = () => {
  const ctx = useContext(UIThemeContext);
  if (!ctx) {
    throw new Error('useUITheme must be used inside UIThemeProvider');
  }
  return ctx;
};
