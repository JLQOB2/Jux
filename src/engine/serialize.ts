// Puzzle serialization: how a puzzle becomes text and comes back.
//
// A board is written as an interleaved grid of 2n−1 lines × 2n−1 columns:
// cells sit at even (row, col) positions and the odd positions between
// them hold the markers, so a marker appears in the text exactly where it
// lives on the board — between its two cells. Example 4×4:
//
//   A . .=B
//       x
//   . .xA .
//
//   B A . .
//
// Catalog records store only what defines the puzzle: the starting board
// (every filled cell is a given), the size, an id, and the seed that
// produced it. The solution is NOT stored — a catalog puzzle is unique by
// construction, so its solution is recomputable on demand via solve().

import type { Board, Cell, CellValue, Marker, MarkerKind } from './board'
import { createEmptyBoard } from './board'
import type { Puzzle } from './generate'
import { solve } from './solver'

/** One puzzle as stored in a catalog file. */
export interface PuzzleRecord {
  /** Stable forever, e.g. "06-0001"; saved progress will be keyed by it. */
  readonly id: string
  readonly size: number
  /** Birth certificate: the seed that generated this puzzle. */
  readonly seed: number
  /** The starting board as interleaved-grid lines. */
  readonly board: ReadonlyArray<string>
}

/** The board as interleaved-grid lines (trailing spaces trimmed). */
export function boardToText(board: Board): string[] {
  const width = 2 * board.size - 1
  const grid = Array.from({ length: width }, () =>
    Array.from({ length: width }, () => ' '),
  )
  for (let row = 0; row < board.size; row++) {
    for (let col = 0; col < board.size; col++) {
      grid[2 * row][2 * col] = board.cells[row][col].value ?? '.'
    }
  }
  for (const marker of board.markers) {
    // The midpoint of cells at (2a, 2b) in grid coordinates is a + b.
    grid[marker.a.row + marker.b.row][marker.a.col + marker.b.col] =
      marker.kind === 'equal' ? '=' : 'x'
  }
  return grid.map((line) => line.join('').trimEnd())
}

/**
 * Parse interleaved-grid lines back into a board. Every filled cell is
 * marked as a given — this format describes starting boards, not
 * in-progress games. Throws on any malformed input rather than guessing.
 */
export function boardFromText(lines: ReadonlyArray<string>): Board {
  const size = (lines.length + 1) / 2
  if (!Number.isInteger(size)) {
    throw new Error(
      `Expected an odd number of lines (2·size − 1), got ${lines.length}`,
    )
  }
  const base = createEmptyBoard(size)

  // Positions that are neither cell nor marker must stay blank; anything
  // else is a hand-edit gone wrong and should fail loudly, not vanish.
  const width = 2 * size - 1
  for (let row = 0; row < lines.length; row++) {
    for (let col = 0; col < lines[row].length; col++) {
      const unused = (row % 2 === 1 && col % 2 === 1) || col >= width
      if (unused && lines[row][col] !== ' ') {
        throw new Error(
          `Unexpected character "${lines[row][col]}" at line ${row}, column ${col}`,
        )
      }
    }
  }

  const cells: Cell[][] = []
  for (let row = 0; row < size; row++) {
    const rowCells: Cell[] = []
    for (let col = 0; col < size; col++) {
      const value = parseCell(charAt(lines, 2 * row, 2 * col))
      rowCells.push({ value, given: value !== null })
    }
    cells.push(rowCells)
  }

  const markers: Marker[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const right = parseMarker(charAt(lines, 2 * row, 2 * col + 1))
      if (col + 1 < size && right !== null) {
        markers.push({ kind: right, a: { row, col }, b: { row, col: col + 1 } })
      }
      const below = parseMarker(charAt(lines, 2 * row + 1, 2 * col))
      if (row + 1 < size && below !== null) {
        markers.push({ kind: below, a: { row, col }, b: { row: row + 1, col } })
      }
    }
  }

  return { ...base, cells, markers }
}

export function puzzleToRecord(puzzle: Puzzle, id: string): PuzzleRecord {
  return {
    id,
    size: puzzle.board.size,
    seed: puzzle.seed,
    board: boardToText(puzzle.board),
  }
}

/**
 * Rebuild a playable Puzzle from its stored record. The solution is a
 * computed property: solve() re-derives it from the starting board.
 */
export function puzzleFromRecord(record: PuzzleRecord): Puzzle {
  const board = boardFromText(record.board)
  if (board.size !== record.size) {
    throw new Error(
      `Puzzle ${record.id}: board text is ${board.size}×${board.size} but the record says ${record.size}`,
    )
  }
  const solution = solve(board)
  if (solution === null) {
    throw new Error(`Puzzle ${record.id} has no solution — corrupt record?`)
  }
  return { board, solution, seed: record.seed }
}

// Trailing spaces are trimmed on write, so a missing character reads as a
// blank. Cell positions always hold a visible character ('.', 'A', 'B'),
// which means trimming can only ever shorten marker positions.
function charAt(lines: ReadonlyArray<string>, row: number, col: number): string {
  return lines[row]?.[col] ?? ' '
}

function parseCell(ch: string): CellValue {
  if (ch === '.') return null
  if (ch === 'A' || ch === 'B') return ch
  throw new Error(`Unexpected cell character: "${ch}"`)
}

function parseMarker(ch: string): MarkerKind | null {
  if (ch === ' ') return null
  if (ch === '=') return 'equal'
  if (ch === 'x') return 'differ'
  throw new Error(`Unexpected marker character: "${ch}"`)
}
