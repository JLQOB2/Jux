import { describe, expect, test } from 'vitest'
import type { Board } from './board'
import { createEmptyBoard, setCellValue } from './board'
import { countSolutions, solve } from './solver'
import { boardFrom, markerAt } from './test-helpers'
import { findViolations } from './validate'

describe('setCellValue', () => {
  test('returns a new board with the value placed', () => {
    const board = createEmptyBoard(4)
    const next = setCellValue(board, { row: 1, col: 2 }, 'A')
    expect(next.cells[1][2].value).toBe('A')
  })

  test('leaves the original board untouched', () => {
    const board = createEmptyBoard(4)
    setCellValue(board, { row: 1, col: 2 }, 'A')
    expect(board.cells[1][2].value).toBeNull()
  })

  test('shares unmodified rows with the original', () => {
    const board = createEmptyBoard(4)
    const next = setCellValue(board, { row: 1, col: 2 }, 'A')
    expect(next.cells[0]).toBe(board.cells[0])
    expect(next.cells[1]).not.toBe(board.cells[1])
  })
})

describe('solve', () => {
  test('fills an empty board into a complete, violation-free solution', () => {
    const solved = solve(createEmptyBoard(4))
    expect(solved).not.toBeNull()
    expect(findViolations(solved!)).toEqual([])
    for (const row of solved!.cells) {
      for (const cell of row) {
        expect(cell.value).not.toBeNull()
      }
    }
  })

  test('preserves already-placed values', () => {
    const board = boardFrom(
      'AB..',
      '....',
      '....',
      '....',
    )
    const solved = solve(board)
    expect(solved).not.toBeNull()
    expect(solved!.cells[0][0].value).toBe('A')
    expect(solved!.cells[0][1].value).toBe('B')
  })

  test('respects markers', () => {
    const board: Board = {
      ...createEmptyBoard(4),
      markers: [markerAt('equal', [0, 0], [0, 1])],
    }
    const solved = solve(board)
    expect(solved).not.toBeNull()
    expect(solved!.cells[0][0].value).toBe(solved!.cells[0][1].value)
  })

  test('returns the board unchanged when it is already solved', () => {
    const board = boardFrom(
      'AABB',
      'BBAA',
      'AABB',
      'BBAA',
    )
    expect(solve(board)).toBe(board)
  })

  test('returns null when the board already violates a rule', () => {
    const board = boardFrom(
      'AAA.',
      '....',
      '....',
      '....',
    )
    expect(solve(board)).toBeNull()
  })

  test('returns null when constraints are unsatisfiable', () => {
    // An equal marker inside a 2×2 row: balance needs one of each icon,
    // so the two cells can never match.
    const board: Board = {
      ...createEmptyBoard(2),
      markers: [markerAt('equal', [0, 0], [0, 1])],
    }
    expect(solve(board)).toBeNull()
  })
})

describe('countSolutions', () => {
  test('an empty 2×2 board has exactly two solutions', () => {
    expect(countSolutions(createEmptyBoard(2))).toBe(2)
  })

  test('one given collapses the 2×2 board to a unique solution', () => {
    const board = setCellValue(createEmptyBoard(2), { row: 0, col: 0 }, 'A')
    expect(countSolutions(board)).toBe(1)
  })

  test('an unsatisfiable board has zero solutions', () => {
    const board: Board = {
      ...createEmptyBoard(2),
      markers: [markerAt('equal', [0, 0], [0, 1])],
    }
    expect(countSolutions(board)).toBe(0)
  })

  test('stops counting at the limit', () => {
    expect(countSolutions(createEmptyBoard(4))).toBe(2)
    expect(countSolutions(createEmptyBoard(4), 5)).toBe(5)
  })
})
