import type { MouseEvent } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { useTheme } from '../lib/theme';

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useI18n();

  const label = isDark ? t.themeLight : t.themeDark;

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x =
      e.clientX && e.clientX > 0 ? e.clientX : rect.left + rect.width / 2;
    const y =
      e.clientY && e.clientY > 0 ? e.clientY : rect.top + rect.height / 2;
    toggleTheme({ x, y });
  }

  return (
    <button
      type="button"
      data-testid="theme-toggle-btn"
      data-theme={theme}
      aria-pressed={isDark}
      aria-label={t.themeSwitchAria}
      title={label}
      onClick={handleClick}
      className={`dz-focus inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border bg-[var(--dz-surface)] text-xs font-semibold text-[var(--dz-ink)] transition-all duration-200 hover:bg-[var(--dz-surface-subtle)] whitespace-nowrap ${
        isDark
          ? 'border-[#3B82F6]/45 shadow-[0_0_12px_-3px_rgba(59,130,246,0.4)] hover:border-[#60A5FA]/70'
          : 'border-[var(--dz-border)] hover:border-[var(--dz-border-strong)]'
      } ${compact ? 'px-2 sm:px-3' : 'px-3'}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-300 ${
          isDark
            ? 'border-[#3B82F6] bg-[#163264] shadow-inner'
            : 'border-[#B8CBE6] bg-[#E3EEFF]'
        }`}
      >
        <span
          className={`dz-toggle-thumb flex h-4 w-4 items-center justify-center rounded-full shadow-sm ${
            isDark
              ? 'translate-x-[17px] bg-[#0B1830] ring-1 ring-[#60A5FA]/50'
              : 'translate-x-[2px] bg-white'
          }`}
        >
          {isDark ? (
            <Sun
              key="sun"
              className="dz-icon-pop h-2.5 w-2.5 text-amber-400"
              aria-hidden="true"
            />
          ) : (
            <Moon
              key="moon"
              className="dz-icon-pop h-2.5 w-2.5 text-[#0B57D0]"
              aria-hidden="true"
            />
          )}
        </span>
      </span>
      <span className={compact ? 'hidden sm:inline' : 'inline'}>{label}</span>
    </button>
  );
}
