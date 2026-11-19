import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { formatDezagamizCardGroups, PERSONAL_CARD_CASHBACK_RATE } from '../lib/dezagamiz';
import { useI18n } from '../lib/i18n';
import type { PersonalCardStyle, PersonalCardTier } from '../types/dezagamiz';
import { AppIcon } from './AppIcon';

interface DezagamizPersonalCardVisualProps {
  cardNumber: string;
  holderName: string;
  expiry: string;
  tier: PersonalCardTier;
  style: PersonalCardStyle;
  balanceUzs: number;
  bonusUzs?: number;
  carModel?: string;
  plateNumber?: string;
  isFrozen?: boolean;
  isPreview?: boolean;
  compact?: boolean;
}

const STYLE_CONFIG: Record<
  PersonalCardStyle,
  {
    background: string;
    border: string;
    primaryText: string;
    mutedText: string;
    chipBg: string;
    chipBorder: string;
    ringStroke: string;
    buttonBg: string;
  }
> = {
  cobalt: {
    background: 'linear-gradient(135deg, #092C63 0%, #0B57D0 58%, #1E88E5 100%)',
    border: 'border-[#0B57D0]/30',
    primaryText: 'text-white',
    mutedText: 'text-blue-100/85',
    chipBg: 'bg-gradient-to-br from-[#F7E7B4] via-[#E5C773] to-[#C89F42]',
    chipBorder: 'border-[#FBEEC8]/50',
    ringStroke: 'rgba(255, 255, 255, 0.14)',
    buttonBg: 'bg-white/15 hover:bg-white/25 text-white',
  },
  arctic: {
    background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF4FD 58%, #D9E8FC 100%)',
    border: 'border-[#BFD6FA]',
    primaryText: 'text-[#092C63]',
    mutedText: 'text-[#3F5F94]',
    chipBg: 'bg-gradient-to-br from-[#D8E5F8] via-[#B4CCF2] to-[#7AA5EA]',
    chipBorder: 'border-[#0B57D0]/25',
    ringStroke: 'rgba(11, 87, 208, 0.12)',
    buttonBg: 'bg-[#0B57D0]/10 hover:bg-[#0B57D0]/18 text-[#092C63]',
  },
  night: {
    background: 'linear-gradient(135deg, #051633 0%, #092C63 55%, #0F408E 100%)',
    border: 'border-[#1E4F9E]',
    primaryText: 'text-white',
    mutedText: 'text-sky-200/80',
    chipBg: 'bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8]',
    chipBorder: 'border-white/30',
    ringStroke: 'rgba(125, 211, 252, 0.16)',
    buttonBg: 'bg-white/12 hover:bg-white/22 text-white',
  },
};

export function DezagamizPersonalCardVisual({
  cardNumber,
  holderName,
  expiry,
  tier,
  style,
  balanceUzs,
  bonusUzs = 0,
  carModel,
  plateNumber,
  isFrozen = false,
  isPreview = false,
  compact = false,
}: DezagamizPersonalCardVisualProps) {
  const { t, formatMoney, localizePersonName, localizeCarModel } = useI18n();
  const [revealNumber, setRevealNumber] = useState(false);

  const theme = STYLE_CONFIG[style] || STYLE_CONFIG.cobalt;
  const cashbackPct = Math.round((PERSONAL_CARD_CASHBACK_RATE[tier] ?? 0.03) * 100);
  const tierLabel = tier === 'prime' ? t.personalCardTierPrime : t.personalCardTierStandard;

  const digits = cardNumber.replace(/\D/g, '');
  const formattedNumber = isPreview
    ? '7788  ••••  ••••  ••••'
    : revealNumber && digits.length === 16
      ? formatDezagamizCardGroups(digits)
      : `7788  ••••  ••••  ${digits.slice(-4) || '••••'}`;

  return (
    <div
      data-testid="dezagamiz-personal-card-visual"
      data-card-style={style}
      data-card-tier={tier}
      className={`relative overflow-hidden rounded-3xl border shadow-[0_18px_40px_-14px_rgba(9,44,99,0.28)] transition-all duration-300 ${theme.border} ${theme.primaryText} ${
        compact ? 'p-5' : 'p-6'
      }`}
      style={{ background: theme.background }}
    >
      {/* Signature dezagamiz geometric arc motif */}
      <svg
        aria-hidden="true"
        viewBox="0 0 420 260"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
      >
        <circle
          cx="355"
          cy="40"
          r="110"
          fill="none"
          stroke={theme.ringStroke}
          strokeWidth="1.25"
        />
        <circle
          cx="355"
          cy="40"
          r="155"
          fill="none"
          stroke={theme.ringStroke}
          strokeWidth="1"
        />
        <circle
          cx="45"
          cy="245"
          r="95"
          fill="none"
          stroke={theme.ringStroke}
          strokeWidth="1"
        />
      </svg>

      {/* Frozen overlay tint */}
      {isFrozen && (
        <div
          aria-hidden="true"
          className="dz-modal-backdrop pointer-events-none absolute inset-0 bg-[#051633]/35 backdrop-blur-[1px]"
        />
      )}

      {/* Card header: Logo + Tier & Cashback */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AppIcon size="sm" className="ring-1 ring-white/25" />
          <div>
            <div className="font-display text-base font-extrabold tracking-tight leading-none">
              dezagamiz
            </div>
            <div className={`mt-0.5 text-[11px] font-medium ${theme.mutedText}`}>
              {tierLabel} · {t.personalCardCashbackLabel} {cashbackPct}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFrozen && (
            <span className="dz-panel-enter inline-flex items-center gap-1 rounded-lg bg-[#051633]/80 px-2 py-1 text-[11px] font-bold text-white">
              <Lock className="dz-icon-pop h-3 w-3" aria-hidden="true" />
              {t.personalCardFrozenBadge}
            </span>
          )}
          {/* Contactless NFC waves */}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`h-5 w-5 ${theme.mutedText}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          >
            <path d="M8.5 16.5a6.5 6.5 0 0 1 0-9" />
            <path d="M12 18.5a10 10 0 0 1 0-13" />
            <path d="M15.5 20.5a13.5 13.5 0 0 1 0-17" />
          </svg>
        </div>
      </div>

      {/* EMV chip + Live balance */}
      <div className={`relative flex items-center justify-between gap-4 ${compact ? 'mt-4' : 'mt-6'}`}>
        <div
          aria-hidden="true"
          className={`h-8 w-11 rounded-lg border shadow-inner ${theme.chipBg} ${theme.chipBorder} flex items-center justify-center`}
        >
          <div className="grid h-4 w-6 grid-cols-3 gap-0.5 opacity-45">
            <span className="border border-current/70 rounded-[1px]" />
            <span className="border border-current/70 rounded-[1px]" />
            <span className="border border-current/70 rounded-[1px]" />
          </div>
        </div>

        <div className="text-right">
          <div className={`text-[11px] font-medium ${theme.mutedText}`}>
            {t.personalCardBalanceLabel}
          </div>
          <div
            data-testid="personal-card-visual-balance"
            className="font-mono-tabular text-lg font-extrabold tracking-tight sm:text-xl"
          >
            {formatMoney(balanceUzs)}
          </div>
          {bonusUzs > 0 && (
            <div className={`font-mono-tabular text-[11px] font-semibold ${theme.mutedText}`}>
              {t.personalCardBonusLabel}: +{formatMoney(bonusUzs)}
            </div>
          )}
        </div>
      </div>

      {/* 16-digit PAN + Reveal toggle */}
      <div className={`relative flex items-center justify-between gap-2 ${compact ? 'mt-4' : 'mt-5'}`}>
        <div
          data-testid="personal-card-number-display"
          className="font-mono-tabular text-base font-bold tracking-[0.14em] sm:text-lg"
        >
          {formattedNumber}
        </div>

        {!isPreview && digits.length === 16 && (
          <button
            type="button"
            data-testid="toggle-personal-card-number"
            aria-label={revealNumber ? t.personalCardHideNumber : t.personalCardShowNumber}
            onClick={() => setRevealNumber((v) => !v)}
            className={`dz-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${theme.buttonBg}`}
          >
            {revealNumber ? (
              <EyeOff key="hide" className="dz-icon-pop h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye key="show" className="dz-icon-pop h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Card footer: Holder + Auto + Expiry */}
      <div className={`relative flex items-end justify-between gap-3 ${compact ? 'mt-4' : 'mt-5'}`}>
        <div className="min-w-0">
          <div className={`truncate font-mono-tabular text-xs font-bold uppercase ${theme.primaryText}`}>
            {holderName.trim()
              ? localizePersonName(holderName)
              : t.personalCardDriverFallback}
          </div>
          {(carModel || plateNumber) && (
            <div className={`mt-0.5 truncate font-mono-tabular text-[11px] ${theme.mutedText}`}>
              {[carModel ? localizeCarModel(carModel) : '', plateNumber]
                .filter(Boolean)
                .join(' · ')}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className={`text-[10px] uppercase ${theme.mutedText}`}>{t.cardPreviewExpiryLabel}</div>
          <div className="font-mono-tabular text-xs font-bold">{expiry}</div>
        </div>
      </div>
    </div>
  );
}
