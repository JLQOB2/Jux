// Game state: the current puzzle and the full history of board states.
// Undo is just "drop the last board" — immutability means every previous
// state still exists untouched, so there is no undo logic to write.
//
// The hook does not create puzzles; the caller hands one in — from the
// catalog, or freshly generated in the dev panel. Where a puzzle comes
// from is not this hook's business.

import { useState } from 'react'
import type { Board, CellValue, Position, Puzzle } from '../engine'
import { setCellValue } from '../engine'

interface GameState {
  readonly puzzle: Puzzle
  /** Every board state so far; the last entry is the live board. */
  readonly boards: ReadonlyArray<Board>
}

function freshGame(puzzle: Puzzle): GameState {
  return { puzzle, boards: [puzzle.board] }
}

const CYCLE: ReadonlyArray<CellValue> = [null, 'A', 'B']

// Reverse steps +2 rather than -1: (-1 % 3) is -1 in JS, not 2.

function cycled(value: CellValue, reverse: boolean): CellValue {
  const step = reverse ? CYCLE.length - 1 : 1
  return CYCLE[(CYCLE.indexOf(value) + step) % CYCLE.length]
}

export function useGame(initialPuzzle: Puzzle) {
  const [state, setState] = useState(() => freshGame(initialPuzzle))
  const board = state.boards[state.boards.length - 1]

  function cycleCell(pos: Position, reverse: boolean): void {
    setState((current) => {
      const live = current.boards[current.boards.length - 1]
      const cell = live.cells[pos.row][pos.col]
      if (cell.given) return current
      const next = setCellValue(live, pos, cycled(cell.value, reverse))
      return { ...current, boards: [...current.boards, next] }
    })
  }

  function undo(): void {
    setState((current) =>
      current.boards.length > 1
        ? { ...current, boards: current.boards.slice(0, -1) }
        : current,
    )
  }

  function newPuzzle(puzzle: Puzzle): void {
    setState(freshGame(puzzle))
  }

  return {
    puzzle: state.puzzle,
    board,
    canUndo: state.boards.length > 1,
    cycleCell,
    undo,
    newPuzzle,
  }
}
