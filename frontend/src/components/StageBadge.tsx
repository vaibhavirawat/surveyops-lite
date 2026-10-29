import { STAGE_META } from '../lib/stages'
import type { Stage } from '../types'

// A "component" is a function that returns a piece of UI. Props are its inputs.
export function StageBadge({ stage }: { stage: Stage }) {
  const { label, badge } = STAGE_META[stage]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge}`}>
      {label}
    </span>
  )
}
