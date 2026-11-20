import {
  Bot,
  Car,
  CreditCard,
  Fuel,
  History,
  KeyRound,
  LogOut,
  MapPin,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import type { AccessRole, AppView } from '../types/dezagamiz';
import { BrandLogo } from './BrandLogo';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

interface TopNavProps {
  activeView: AppView;
  isCreator: boolean;
  creatorRole: AccessRole | null;
  onSelectView: (view: AppView) => void;
  onSwitchCreatorRole: (role: AccessRole) => void;
  onLogout: () => void;
  onLogoTap?: () => void;
}

export function TopNav({
  activeView,
  isCreator,
  creatorRole,
  onSelectView,
  onSwitchCreatorRole,
  onLogout,
  onLogoTap,
}: TopNavProps) {
  const { t } = useI18n();
  const isAdminView = isCreator && creatorRole === 'admin';

  const driverNavItems: { id: AppView; label: string; mobileLabel: string }[] = [
    { id: 'fuel', label: t.navFuel, mobileLabel: t.navFuel },
    { id: 'stations', label: t.navStations, mobileLabel: t.navStations },
    { id: 'assistant', label: t.navAssistant, mobileLabel: t.navAssistant },
    { id: 'history', label: t.navHistory, mobileLabel: t.navHistory },
    { id: 'profile', label: t.navCards, mobileLabel: t.navCardsShort },
  ];

  const adminNavItems: { id: AppView; label: string; mobileLabel: string }[] = [
    { id: 'creator', label: t.navAdminPanel, mobileLabel: t.navAdminShort },
    { id: 'stations', label: t.navStations, mobileLabel: t.navStations },
  ];

  const navItems = isAdminView ? adminNavItems : driverNavItems;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--dz-border)] bg-[var(--dz-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-8">
          {/* Zone 1: Brand wordmark + app icon (3 clicks open Showcase, 5 clicks arm hidden Admin entry) */}
          <a
            href={isAdminView ? '#creator' : '#fuel'}
            data-testid="brand-logo-trigger"
            onClick={(e) => {
              e.preventDefault();
              onLogoTap?.();
            }}
            className="dz-focus select-none rounded-lg whitespace-nowrap shrink-0"
          >
            <BrandLogo />
          </a>

          {/* Zone 2: Clean single-line nav links */}
          <nav
            aria-label={t.primaryNavAria}
            className="hidden md:flex items-center gap-4 lg:gap-6"
          >
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectView(item.id)}
                  className={`dz-focus relative py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-[var(--dz-primary)]'
                      : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="dz-nav-indicator absolute inset-x-0 -bottom-[17px] h-0.5 rounded-full bg-[var(--dz-primary)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Theme toggle + Language selector + Role switch (when Creator) + Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle compact />
            <LanguageSelector compact />

            {isCreator && (
              <button
                type="button"
                onClick={() =>
                  onSwitchCreatorRole(isAdminView ? 'driver' : 'admin')
                }
                className="dz-focus hidden sm:inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-primary)] transition-colors hover:bg-[#DDEAFF] dark:hover:bg-[#1E3B6B] whitespace-nowrap shrink-0"
              >
                {isAdminView ? (
                  <>
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.switchToDriver}</span>
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.switchToAdmin}</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="dz-focus inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-ink)] transition-colors hover:bg-[var(--dz-surface-subtle)] whitespace-nowrap shrink-0"
            >
              <LogOut
                className="h-3.5 w-3.5 text-[var(--dz-primary)]"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label={t.mobileNavAria}
        className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch overflow-x-auto border-t border-[var(--dz-border)] bg-[var(--dz-surface)]/95 backdrop-blur-md md:hidden"
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon =
            item.id === 'fuel'
              ? Fuel
              : item.id === 'stations'
                ? MapPin
                : item.id === 'assistant'
                  ? Bot
                  : item.id === 'history'
                    ? History
                    : item.id === 'creator'
                      ? KeyRound
                      : CreditCard;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`dz-focus relative flex min-w-[58px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold transition-colors ${
                isActive
                  ? 'text-[var(--dz-primary)]'
                  : 'text-[var(--dz-ink-muted)] hover:text-[var(--dz-ink)]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="dz-nav-indicator absolute top-0 h-0.5 w-8 rounded-full bg-[var(--dz-primary)]"
                />
              )}
              <Icon
                className={`h-5 w-5 transition-transform duration-150 ${
                  isActive ? 'scale-110' : ''
                }`}
                aria-hidden="true"
              />
              <span className="truncate max-w-full px-1">{item.mobileLabel}</span>
            </button>
          );
        })}
        {isCreator && (
          <button
            type="button"
            onClick={() =>
              onSwitchCreatorRole(isAdminView ? 'driver' : 'admin')
            }
            className="dz-focus flex min-w-[58px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold text-[var(--dz-primary)] transition-colors"
          >
            {isAdminView ? (
              <>
                <User className="h-5 w-5" aria-hidden="true" />
                <span className="truncate max-w-full px-1">{t.navDriverShort}</span>
              </>
            ) : (
              <>
                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                <span className="truncate max-w-full px-1">{t.navAdminShort}</span>
              </>
            )}
          </button>
        )}
      </nav>
    </>
  );
}

export { Car };
