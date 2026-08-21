import { describe, expect, it } from 'vitest'
import { generatePuzzle } from './generate'
import {
  boardFromText,
  boardToText,
  puzzleFromRecord,
  puzzleToRecord,
} from './serialize'
import { boardFrom, markerAt } from './test-helpers'

// The interleaved format: cells at even (row, col), markers at the odd
// position between their two cells, everything else blank.
const SAMPLE_LINES = [
  'A . .=B',
  '    x',
  '. .xA .',
  '',
  'B A . .',
  '',
  '. . . .',
]

const sampleBoard = {
  ...boardFrom('A..B', '..A.', 'BA..', '....'),
  markers: [
    markerAt('equal', [0, 2], [0, 3]),
    markerAt('differ', [0, 2], [1, 2]),
    markerAt('differ', [1, 1], [1, 2]),
  ],
}

describe('boardToText', () => {
  it('writes cells at even positions and markers between their cells', () => {
    expect(boardToText(sampleBoard)).toEqual(SAMPLE_LINES)
  })
})

describe('boardFromText', () => {
  it('round-trips text through a board and back unchanged', () => {
    expect(boardToText(boardFromText(SAMPLE_LINES))).toEqual(SAMPLE_LINES)
  })

  it('reads cell values back correctly', () => {
    const board = boardFromText(SAMPLE_LINES)
    expect(board.size).toBe(4)
    expect(board.cells[0][0].value).toBe('A')
    expect(board.cells[0][3].value).toBe('B')
    expect(board.cells[1][2].value).toBe('A')
    expect(board.cells[3][0].value).toBeNull()
  })

  it('reads markers back correctly', () => {
    const board = boardFromText(SAMPLE_LINES)
    expect(board.markers).toHaveLength(3)
    expect(board.markers).toContainEqual(markerAt('equal', [0, 2], [0, 3]))
    expect(board.markers).toContainEqual(markerAt('differ', [0, 2], [1, 2]))
    expect(board.markers).toContainEqual(markerAt('differ', [1, 1], [1, 2]))
  })

  it('marks every filled cell as a given and empty cells as free', () => {
    const board = boardFromText(SAMPLE_LINES)
    for (const row of board.cells) {
      for (const cell of row) {
        expect(cell.given).toBe(cell.value !== null)
      }
    }
  })

  it('throws on an unexpected cell character', () => {
    expect(() => boardFromText(['C .', '', '. .'])).toThrow(/cell character/)
  })

  it('throws on an unexpected marker character', () => {
    expect(() => boardFromText(['A+.', '', '. .'])).toThrow(/marker character/)
  })

  it('throws on junk in an unused position', () => {
    expect(() => boardFromText(['A .', ' ! ', '. .'])).toThrow(/Unexpected/)
  })

  it('throws on an even line count', () => {
    expect(() => boardFromText(['A .', ''])).toThrow(/odd number of lines/)
  })
})

describe('puzzle records', () => {
  const puzzle = generatePuzzle(6, 42)
  const record = puzzleToRecord(puzzle, '06-0042')

  it('stores id, size, seed, and the board text', () => {
    expect(record.id).toBe('06-0042')
    expect(record.size).toBe(6)
    expect(record.seed).toBe(42)
    expect(record.board).toEqual(boardToText(puzzle.board))
  })

  it('round-trips a generated puzzle exactly', () => {
    const restored = puzzleFromRecord(record)
    // Text is the canonical form: markers land in fixed grid slots, so
    // comparing serializations ignores marker list ordering.
    expect(boardToText(restored.board)).toEqual(boardToText(puzzle.board))
    expect(restored.board.cells).toEqual(puzzle.board.cells)
    expect(restored.seed).toBe(puzzle.seed)
  })

  it('recomputes the same solution the generator produced', () => {
    // Compare values only: the restored solution flows through the clued
    // board, so its given flags differ from the generator's fill.
    const values = (cells: typeof puzzle.solution.cells) =>
      cells.map((row) => row.map((cell) => cell.value))
    expect(values(puzzleFromRecord(record).solution.cells)).toEqual(
      values(puzzle.solution.cells),
    )
  })

  it('throws when the record size disagrees with the board text', () => {
    expect(() => puzzleFromRecord({ ...record, size: 8 })).toThrow(/record says/)
  })

  it('throws on a record whose board has no solution', () => {
    const contradiction = { id: 'bad', size: 2, seed: 0, board: ['A=B', '', '. .'] }
    expect(() => puzzleFromRecord(contradiction)).toThrow(/no solution/)
  })
})
