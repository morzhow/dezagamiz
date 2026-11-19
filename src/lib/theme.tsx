import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import {
  getNextThemeMode,
  normalizeThemeMode,
  THEME_SWITCH_DURATION_MS,
  type ThemeMode,
} from './dezagamiz';

export const THEME_STORAGE_KEY = 'dz_theme';

export interface ThemeTransitionOrigin {
  x: number;
  y: number;
}

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  isTransitioning: boolean;
  setTheme: (next: ThemeMode, origin?: ThemeTransitionOrigin) => void;
  toggleTheme: (origin?: ThemeTransitionOrigin) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDark: false,
  isTransitioning: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

function readStoredTheme(): ThemeMode {
  try {
    return normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'light';
  }
}

function applyRootThemeDom(next: ThemeMode) {
  const root = document.documentElement;
  const isDark = next === 'dark';
  root.classList.toggle('dark', isDark);
  root.dataset.theme = next;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#071122' : '#0B57D0');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const switchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (switchTimerRef.current !== null) {
        window.clearTimeout(switchTimerRef.current);
      }
      document.documentElement.classList.remove('dz-theme-switching', 'dz-theme-vt');
      delete document.documentElement.dataset.themeSwitching;
    };
  }, []);

  function setTheme(next: ThemeMode, origin?: ThemeTransitionOrigin) {
    const normalized = normalizeThemeMode(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // Ignore storage quota or private-mode restrictions
    }

    if (normalized === theme) {
      setThemeState(normalized);
      return;
    }

    const root = document.documentElement;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    const x =
      origin && Number.isFinite(origin.x) ? origin.x : vw - 140;
    const y =
      origin && Number.isFinite(origin.y) ? origin.y : 28;
    const endRadius = Math.hypot(Math.max(x, vw - x), Math.max(y, vh - y));

    root.style.setProperty('--dz-theme-x', `${Math.round(x)}px`);
    root.style.setProperty('--dz-theme-y', `${Math.round(y)}px`);
    root.style.setProperty('--dz-theme-r', `${Math.ceil(endRadius)}px`);

    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const docAny = document as Document & {
      startViewTransition?: (cb: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    if (switchTimerRef.current !== null) {
      window.clearTimeout(switchTimerRef.current);
    }

    setIsTransitioning(true);
    root.dataset.themeSwitching = normalized === 'dark' ? 'to-dark' : 'to-light';

    if (!prefersReduced && typeof docAny.startViewTransition === 'function') {
      root.classList.add('dz-theme-vt');
      const transition = docAny.startViewTransition(() => {
        flushSync(() => {
          setThemeState(normalized);
        });
        applyRootThemeDom(normalized);
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${Math.ceil(endRadius)}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: THEME_SWITCH_DURATION_MS,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            },
          );
        })
        .catch(() => {
          // Graceful fallback if View Transition animation is interrupted
        });

      transition.finished
        .finally(() => {
          root.classList.remove('dz-theme-vt');
          delete root.dataset.themeSwitching;
          setIsTransitioning(false);
        })
        .catch(() => {});
      return;
    }

    // Fallback smooth surface crossfade + radial wash overlay
    root.classList.add('dz-theme-switching');
    setThemeState(normalized);
    applyRootThemeDom(normalized);

    switchTimerRef.current = window.setTimeout(() => {
      root.classList.remove('dz-theme-switching');
      delete root.dataset.themeSwitching;
      setIsTransitioning(false);
      switchTimerRef.current = null;
    }, THEME_SWITCH_DURATION_MS);
  }

  function toggleTheme(origin?: ThemeTransitionOrigin) {
    setTheme(getNextThemeMode(theme), origin);
  }

  useEffect(() => {
    applyRootThemeDom(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        isTransitioning,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
      {isTransitioning && (
        <div
          aria-hidden="true"
          data-testid="theme-transition-overlay"
          className="dz-theme-wave-overlay pointer-events-none fixed inset-0 z-[9999]"
        />
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
