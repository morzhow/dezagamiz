import { useI18n } from '../lib/i18n';
import type { CardNetwork } from '../types/dezagamiz';

interface BankCardPreviewProps {
  cardNumber: string;
  holderName: string;
  expiry: string;
  network: CardNetwork | null;
  compact?: boolean;
}

export function BankCardPreview({
  cardNumber,
  holderName,
  expiry,
  network,
  compact = false,
}: BankCardPreviewProps) {
  const { t, localizePersonName } = useI18n();
  const cleanChars = cardNumber.replace(/[^0-9•]/g, '');
  const displayGroups = [0, 4, 8, 12].map((start) => {
    const chunk = cleanChars.slice(start, start + 4);
    if (!chunk) return '••••';
    return chunk.padEnd(4, '•');
  });

  return (
    <div
      className={`relative overflow-hidden rounded-2xl text-white shadow-lg ${
        compact ? 'p-5' : 'p-6'
      }`}
      style={{
        background:
          'linear-gradient(135deg, #092C63 0%, #0B57D0 58%, #1A73E8 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/15 bg-white/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 right-8 h-36 w-36 rounded-full border border-white/10 bg-white/5"
      />

      <div className="relative flex items-center justify-between gap-4">
        <span className="text-xs font-medium tracking-wide text-blue-100">
          {t.cardPreviewLabel}
        </span>
        <span className="font-display text-base font-bold tracking-tight text-white">
          {network || 'Uzcard / Humo'}
        </span>
      </div>

      <div
        className={`relative font-mono-tabular text-xl sm:text-2xl font-semibold tracking-wider text-white ${
          compact ? 'mt-4' : 'mt-7'
        }`}
      >
        {displayGroups.join(' ')}
      </div>

      <div
        className={`relative flex items-end justify-between gap-4 ${
          compact ? 'mt-4' : 'mt-7'
        }`}
      >
        <div className="min-w-0">
          <div className="text-[11px] text-blue-100/80">{t.cardHolderLabel}</div>
          <div className="mt-0.5 truncate font-mono-tabular text-sm font-medium uppercase text-white">
            {holderName.trim()
              ? localizePersonName(holderName)
              : t.sampleCardHolderPlaceholder}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] text-blue-100/80">{t.cardPreviewExpiryLabel}</div>
          <div className="mt-0.5 font-mono-tabular text-sm font-medium text-white">
            {expiry.trim() || t.cardExpiryLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
