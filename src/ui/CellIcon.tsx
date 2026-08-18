import type { Icon } from '../engine'

// The two icons are the two vertical halves of one circle: A is the left
// half (outlined, paper fill), B is the right half (solid ink). Same size,
// same shape, only inverted — equal-but-opposite by design.
//
// SVG arc: "A 34 34 0 0 <sweep> ..." draws a 34-radius arc from the top of
// the diameter (50,16) to the bottom (50,84); sweep 0 curves left
// (counterclockwise), sweep 1 curves right. Z closes along the diameter.
export function CellIcon({ icon }: { icon: Icon }) {
  return (
    <svg className="cell-icon" viewBox="0 0 100 100" aria-label={`icon ${icon}`}>
      {icon === 'A' ? (
        <path
          d="M 50 16 A 34 34 0 0 0 50 84 Z"
          fill="var(--icon-fill)"
          stroke="var(--ink)"
          strokeWidth="5"
        />
      ) : (
        <path
          d="M 50 16 A 34 34 0 0 1 50 84 Z"
          fill="var(--ink)"
          stroke="var(--ink)"
          strokeWidth="5"
        />
      )}
    </svg>
  )
}
