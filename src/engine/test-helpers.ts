// Fixture builders shared by engine test files. Not part of the engine's
// public API — never export these from index.ts.

import type { Board, CellValue, Marker } from './board'
import { createEmptyBoard } from './board'

/** Build a board from row strings: 'A', 'B', or '.' for empty. */
export function boardFrom(...rows: string[]): Board {
  const base = createEmptyBoard(rows.length)
  return {
    ...base,
    cells: rows.map((row) =>
      [...row].map((ch) => ({ value: toValue(ch), given: false })),
    ),
  }
}

/** Shorthand for a marker between two [row, col] positions. */
export function markerAt(
  kind: Marker['kind'],
  [aRow, aCol]: [number, number],
  [bRow, bCol]: [number, number],
): Marker {
  return { kind, a: { row: aRow, col: aCol }, b: { row: bRow, col: bCol } }
}

function toValue(ch: string): CellValue {
  if (ch === '.') return null
  if (ch === 'A' || ch === 'B') return ch
  throw new Error(`Unexpected board character: ${ch}`)
}
