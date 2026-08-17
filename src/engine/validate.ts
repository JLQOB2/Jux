// Rule validation. Violations are structured facts — which rule, which
// line, which cells — presentation is the UI's decision. A violation is
// only reported when no future placement could fix it, so partially
// filled lines are always legal.

import type { Board, CellValue, Icon, Position } from './board'
import { ICONS } from './board'

export interface Line {
  readonly kind: 'row' | 'col'
  readonly index: number
}

export type Violation =
  | {
      readonly rule: 'run'
      readonly line: Line
      /** Every cell that sits inside a window of three identical icons. */
      readonly cells: ReadonlyArray<Position>
    }
  | {
      readonly rule: 'balance'
      readonly line: Line
      /** The icon appearing more than size/2 times in the line. */
      readonly icon: Icon
      /** Every cell in the line holding that icon. */
      readonly cells: ReadonlyArray<Position>
    }

/** One violation per line containing three or more identical consecutive icons. */
export function findRunViolations(board: Board): Violation[] {
  const violations: Violation[] = []
  forEachLine(board, (line, values) => {
    const hits = runIndices(values)
    if (hits.length > 0) {
      violations.push({
        rule: 'run',
        line,
        cells: hits.map((i) => toPosition(line, i)),
      })
    }
  })
  return violations
}

/** One violation per line where an icon exceeds its quota of size/2. */
export function findBalanceViolations(board: Board): Violation[] {
  const violations: Violation[] = []
  forEachLine(board, (line, values) => {
    for (const icon of ICONS) {
      const count = values.filter((value) => value === icon).length
      if (count > values.length / 2) {
        violations.push({
          rule: 'balance',
          line,
          icon,
          cells: values.flatMap((value, i) =>
            value === icon ? [toPosition(line, i)] : [],
          ),
        })
      }
    }
  })
  return violations
}

/** Visit every row, then every column, as a position-blind list of values. */
function forEachLine(
  board: Board,
  visit: (line: Line, values: ReadonlyArray<CellValue>) => void,
): void {
  for (let index = 0; index < board.size; index++) {
    visit({ kind: 'row', index }, board.cells[index].map((cell) => cell.value))
  }
  for (let index = 0; index < board.size; index++) {
    visit({ kind: 'col', index }, board.cells.map((rowCells) => rowCells[index].value))
  }
}

function toPosition(line: Line, i: number): Position {
  return line.kind === 'row'
    ? { row: line.index, col: i }
    : { row: i, col: line.index }
}

/** Indices in one line that are part of a triple of identical icons. */
function runIndices(values: ReadonlyArray<CellValue>): number[] {
  const hits = new Set<number>()
  // Window [i, i+1, i+2]: the last window starts where its third cell
  // is the final cell of the line, so i stops at length - 3.
  for (let i = 0; i + 2 < values.length; i++) {
    const value = values[i]
    if (value !== null && value === values[i + 1] && value === values[i + 2]) {
      hits.add(i)
      hits.add(i + 1)
      hits.add(i + 2)
    }
  }
  return [...hits]
}
