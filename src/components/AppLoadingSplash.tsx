import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { AppIcon } from './AppIcon';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

interface AppLoadingSplashProps {
  subtitle?: string;
  isLoading?: boolean;
  onProceed?: () => void;
}

export function AppLoadingSplash({
  subtitle,
  isLoading = true,
  onProceed,
}: AppLoadingSplashProps) {
  const { t } = useI18n();

  const effectiveSubtitle = isLoading
    ? subtitle || t.loadingSubtitle
    : t.loadingReadySubtitle;

  return (
    <div
      data-testid="app-loading-splash"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--dz-bg)] px-4 py-8 text-[var(--dz-ink)]"
    >
      {/* Subtle architectural blue backdrop accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--dz-primary)]/[0.06] blur-3xl"
      />

      <div className="dz-card-enter relative w-full max-w-md rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-7 text-center shadow-[var(--dz-shadow-card)] sm:p-9">
        {onProceed && (
          <div className="mb-6 flex items-center justify-between gap-2 border-b border-[var(--dz-border)] pb-4 text-left">
            <span className="whitespace-nowrap text-xs font-medium text-[var(--dz-ink-muted)]">
              {t.open24h}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle compact />
              <LanguageSelector compact />
            </div>
          </div>
        )}

        <div className="flex flex-col items-center">
          <div className="dz-icon-float">
            <AppIcon
              size="xl"
              className="shadow-lg shadow-[#0B57D0]/20 ring-4 ring-[var(--dz-surface-tint)]"
            />
          </div>

          <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-[var(--dz-ink)]">
            {t.loadingTitle}
          </h1>

          <p
            data-testid="splash-status-text"
            className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--dz-ink-secondary)]"
          >
            {effectiveSubtitle}
          </p>

          {/* Progress bar: sliding animation while loading, crisp 100% fill when ready */}
          <div
            aria-label={isLoading ? t.loadingWaitBtn : t.loadingReadySubtitle}
            className="mt-6 h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-[var(--dz-surface-tint)]"
          >
            {isLoading ? (
              <div className="dz-loading-bar h-full rounded-full bg-[var(--dz-primary)]" />
            ) : (
              <div className="h-full w-full rounded-full bg-[var(--dz-primary)] transition-all duration-300" />
            )}
          </div>

          {!isLoading && onProceed && (
            <div className="dz-panel-enter mt-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--dz-success)]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.splashFooterMeta}</span>
            </div>
          )}

          {onProceed && (
            <button
              type="button"
              data-testid="enter-app-btn"
              disabled={isLoading}
              onClick={onProceed}
              className="dz-focus group mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--dz-primary)] px-6 text-sm font-bold text-white shadow-sm hover:bg-[var(--dz-primary-hover)] hover:shadow-md hover:shadow-[var(--dz-primary)]/20 disabled:cursor-wait disabled:opacity-65"
            >
              <span>{isLoading ? t.loadingWaitBtn : t.enterAppBtn}</span>
              {!isLoading && (
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
