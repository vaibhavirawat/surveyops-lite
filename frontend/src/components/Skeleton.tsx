// A pulsing grey box shown while data loads, so the page does not jump around when it arrives.
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} aria-hidden="true" />
}
