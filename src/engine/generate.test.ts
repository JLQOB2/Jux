import { describe, expect, test } from 'vitest'
import type { Board } from './board'
import { opposite, setCellValue } from './board'
import { generatePuzzle } from './generate'
import { countSolutions, solve } from './solver'
import { findViolations } from './validate'

function givenCount(board: Board): number {
  return board.cells.flat().filter((cell) => cell.value !== null).length
}

describe('generatePuzzle', () => {
  const puzzle = generatePuzzle(6, 42)

  test('the puzzle has exactly one solution', () => {
    expect(countSolutions(puzzle.board)).toBe(1)
  })

  test('the solution is complete and violation-free', () => {
    expect(findViolations(puzzle.solution)).toEqual([])
    for (const row of puzzle.solution.cells) {
      for (const cell of row) {
        expect(cell.value).not.toBeNull()
      }
    }
  })

  test('solving the puzzle reproduces the stored solution', () => {
    const solved = solve(puzzle.board)
    expect(solved).not.toBeNull()
    const values = (board: Board) =>
      board.cells.map((row) => row.map((cell) => cell.value))
    expect(values(solved!)).toEqual(values(puzzle.solution))
  })

  test('filled cells are locked givens and empty cells are not', () => {
    for (const row of puzzle.board.cells) {
      for (const cell of row) {
        expect(cell.given).toBe(cell.value !== null)
      }
    }
  })

  test('givens match the solution', () => {
    for (let row = 0; row < puzzle.board.size; row++) {
      for (let col = 0; col < puzzle.board.size; col++) {
        const value = puzzle.board.cells[row][col].value
        if (value !== null) {
          expect(value).toBe(puzzle.solution.cells[row][col].value)
        }
      }
    }
  })

  test('markers agree with the solution', () => {
    for (const marker of puzzle.board.markers) {
      const a = puzzle.solution.cells[marker.a.row][marker.a.col].value!
      const b = puzzle.solution.cells[marker.b.row][marker.b.col].value!
      expect(b).toBe(marker.kind === 'equal' ? a : opposite(a))
    }
  })

  test('markers survive minimization because givens are removed first', () => {
    expect(puzzle.board.markers.length).toBeGreaterThan(0)
  })

  test('the same seed reproduces the identical puzzle', () => {
    expect(generatePuzzle(6, 42)).toEqual(puzzle)
  })

  test('different seeds produce different puzzles', () => {
    const other = generatePuzzle(6, 43)
    expect(other.solution.cells).not.toEqual(puzzle.solution.cells)
  })

  test('markerCount 0 yields a puzzle of pure givens', () => {
    const givensOnly = generatePuzzle(4, 7, { markerCount: 0 })
    expect(givensOnly.board.markers).toEqual([])
    expect(countSolutions(givensOnly.board)).toBe(1)
  })
})

describe('generatePuzzle with slack 0 (fully minimal)', () => {
  const minimal = generatePuzzle(6, 42, { slack: 0 })

  test('removing any given breaks uniqueness', () => {
    for (let row = 0; row < minimal.board.size; row++) {
      for (let col = 0; col < minimal.board.size; col++) {
        if (minimal.board.cells[row][col].value === null) continue
        const weakened = setCellValue(minimal.board, { row, col }, null)
        expect(countSolutions(weakened)).toBeGreaterThan(1)
      }
    }
  })

  test('removing any marker breaks uniqueness', () => {
    for (const marker of minimal.board.markers) {
      const weakened = {
        ...minimal.board,
        markers: minimal.board.markers.filter((kept) => kept !== marker),
      }
      expect(countSolutions(weakened)).toBeGreaterThan(1)
    }
  })
})

describe('the slack difficulty dial', () => {
  test('high slack keeps more helper givens than slack 0', () => {
    const minimal = generatePuzzle(6, 42, { slack: 0 })
    const relaxed = generatePuzzle(6, 42, { slack: 0.9 })
    expect(givenCount(relaxed.board)).toBeGreaterThan(givenCount(minimal.board))
  })

  test('slack never costs uniqueness', () => {
    const relaxed = generatePuzzle(6, 42, { slack: 0.9 })
    expect(countSolutions(relaxed.board)).toBe(1)
  })
})
