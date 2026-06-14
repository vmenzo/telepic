import { cn } from '../../lib/utils';

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium',
        tone === 'neutral' && 'border-border bg-muted text-muted-foreground',
        tone === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-700',
        tone === 'danger' && 'border-rose-200 bg-rose-50 text-rose-700',
        tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-700',
        className
      )}
      {...props}
    />
  );
}
