const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

// "2026-10-27T21:16:10Z" -> "2 days ago"
export function timeAgo(isoDate: string): string {
  const seconds = (new Date(isoDate).getTime() - Date.now()) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}
