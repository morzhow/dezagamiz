interface AppIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AppIconProps['size']>, string> = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
  xl: 'h-24 w-24 rounded-[26px]',
};

export function AppIcon({ size = 'sm', className = '' }: AppIconProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden bg-[var(--dz-primary)] shadow-sm ${SIZE_CLASSES[size]} ${className}`}
    >
      <img
        src="/dezagamiz-icon.jpg"
        alt="dezagamiz"
        className="h-full w-full scale-[1.34] object-cover select-none"
      />
    </span>
  );
}
