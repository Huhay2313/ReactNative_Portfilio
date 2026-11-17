/**
 * ThemeContext: the single source of truth for appearance.
 *
 * Responsibilities, and nothing else:
 *   - hold the current mode (light or dark)
 *   - load the saved preference on start
 *   - persist it whenever it changes
 *   - expose the resolved token bundle
 *
 * Screens never read a raw colour. They call `useTheme()` and use the semantic
 * tokens, so switching modes repaints everything without a single screen
 * knowing that a switch happened.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { themes, type Theme, type ThemeMode } from './tokens';

const STORAGE_KEY = 'labfolio.theme.mode';

/** What the user picked. `system` follows the device. */
export type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  /** The resolved theme bundle. Always defined. */
  theme: Theme;
  /** The mode actually in use, after resolving `system`. */
  mode: ThemeMode;
  /** What the user chose, which may be `system`. */
  preference: ThemePreference;
  /** True until the saved preference has been read. */
  isLoading: boolean;
  /** Sets the preference and persists it immediately. */
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Overrides the stored preference. Used by tests and previews so a screen can
   * be rendered in a known mode without touching storage.
   */
  initialPreference?: ThemePreference;
}

export function ThemeProvider({ children, initialPreference }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(
    initialPreference ?? 'system',
  );
  const [isLoading, setIsLoading] = useState(initialPreference === undefined);

  // Load the saved preference once on mount.
  useEffect(() => {
    if (initialPreference !== undefined) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setPreferenceState(stored);
        }
      } catch {
        // A failed read is not worth interrupting the user for: the app simply
        // starts on the system default.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialPreference]);

  const setPreference = useCallback((next: ThemePreference) => {
    // Update state first so the UI repaints immediately, then persist. A slow
    // disk write must never make the switch feel laggy.
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Persistence failing only means the choice is not remembered next launch.
    });
  }, []);

  const mode: ThemeMode = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[mode],
      mode,
      preference,
      isLoading,
      setPreference,
    }),
    [mode, preference, isLoading, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The theme bundle. Throws when used outside the provider, which is a bug. */
export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return context.theme;
}

/** The full context, for Settings, which needs the preference and the setter. */
export function useThemeControl(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeControl must be used inside a ThemeProvider');
  }
  return context;
}
