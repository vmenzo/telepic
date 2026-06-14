import { cn } from '../lib/utils';

export function TelepicMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn(
        'h-11 w-11 shrink-0 rounded-lg shadow-sm',
        compact && 'h-9 w-9',
        className
      )}
    >
      <rect width="48" height="48" rx="11" fill="#101820" />
      <rect x="7.5" y="7.5" width="33" height="33" rx="8" fill="none" stroke="#FFFFFF" strokeOpacity="0.12" />
      <path d="M13 14.5h22v6h-8v17h-6v-17h-8v-6Z" fill="#FFFFFF" />
      <path d="M31 31h7v7h-7v-7Z" fill="#277568" />
    </svg>
  );
}
