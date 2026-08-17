// The board model: the data vocabulary the whole engine speaks.
// Types only, plus the board constructor — no game logic lives here.

/** The two abstract cell values. The UI decides what they look like. */
export type Icon = 'A' | 'B'

export type CellValue = Icon | null

export const ICONS: ReadonlyArray<Icon> = ['A', 'B']

export interface Cell {
  readonly value: CellValue
  /** Givens are the pre-filled starting cells; the player can never change them. */
  readonly given: boolean
}

export interface Position {
  readonly row: number
  readonly col: number
}

export type MarkerKind = 'equal' | 'differ'

/**
 * A constraint between two orthogonally adjacent cells:
 * 'equal' forces them to hold the same icon, 'differ' opposite icons.
 */
export interface Marker {
  readonly kind: MarkerKind
  readonly a: Position
  readonly b: Position
}

export interface Board {
  /** Side length. Always even: the balance rule needs n/2 of each icon per line. */
  readonly size: number
  /** Row-major grid: cells[row][col]. */
  readonly cells: ReadonlyArray<ReadonlyArray<Cell>>
  readonly markers: ReadonlyArray<Marker>
}

export function opposite(icon: Icon): Icon {
  return icon === 'A' ? 'B' : 'A'
}

export function createEmptyBoard(size: number): Board {
  if (size < 2) {
    throw new Error(`Board size must be at least 2, got ${size}`)
  }
  if (size % 2 !== 0) {
    throw new Error(`Board size must be even, got ${size}`)
  }
  const cells = Array.from({ length: size }, () =>
    Array.from({ length: size }, (): Cell => ({ value: null, given: false })),
  )
  return { size, cells, markers: [] }
}
