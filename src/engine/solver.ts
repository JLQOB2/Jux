// Depth-first backtracking solver: fill the first empty cell with each
// icon in turn, prune any branch that creates a violation, recurse.
// Pruning is sound because validation only flags unfixable states — a
// violated branch can never reach a solution.

import type { Board } from './board'
import { firstEmpty, ICONS, setCellValue } from './board'
import { findViolations } from './validate'

/** The first solution found, or null if the board cannot be completed. */
export function solve(board: Board): Board | null {
  if (findViolations(board).length > 0) return null
  const empty = firstEmpty(board)
  if (empty === null) return board
  for (const icon of ICONS) {
    const solved = solve(setCellValue(board, empty, icon))
    if (solved !== null) return solved
  }
  return null
}

/**
 * How many distinct completions the board has, capped at limit
 * (default 2 — enough to distinguish none / unique / multiple without
 * paying for a full count).
 */
export function countSolutions(board: Board, limit = 2): number {
  if (findViolations(board).length > 0) return 0
  const empty = firstEmpty(board)
  if (empty === null) return 1
  let count = 0
  for (const icon of ICONS) {
    count += countSolutions(setCellValue(board, empty, icon), limit - count)
    if (count >= limit) return count
  }
  return count
}
