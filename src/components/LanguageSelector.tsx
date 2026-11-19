import { Globe } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  useI18n,
  type AppLanguage,
} from '../lib/i18n';

interface LanguageSelectorProps {
  compact?: boolean;
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="relative inline-flex items-center shrink-0">
      <Globe
        className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--dz-primary)]"
        aria-hidden="true"
      />
      <select
        aria-label={t.languageSelectorAria}
        value={lang}
        onChange={(e) => setLang(e.target.value as AppLanguage)}
        className="dz-focus h-9 cursor-pointer appearance-none rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] pl-8 pr-6 text-xs font-semibold text-[var(--dz-ink)] transition-colors hover:border-[var(--dz-border-strong)]"
      >
        {SUPPORTED_LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {compact ? item.shortLabel : item.nativeLabel}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 text-[10px] text-[var(--dz-ink-muted)]"
      >
        ▾
      </span>
    </div>
  );
}
