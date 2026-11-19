import { AppIcon } from './AppIcon';

interface BrandLogoProps {
  inverted?: boolean;
}

export function BrandLogo({ inverted = false }: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <AppIcon
        size="sm"
        className={inverted ? 'ring-1 ring-white/40' : ''}
      />
      <span
        className={`font-display text-xl font-bold tracking-tight ${
          inverted ? 'text-white' : 'text-[var(--dz-ink)]'
        }`}
      >
        dezagamiz
      </span>
    </span>
  );
}
