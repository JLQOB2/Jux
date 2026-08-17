import { describe, expect, test } from 'vitest'
import type { Board, CellValue } from './board'
import { createEmptyBoard } from './board'
import { findBalanceViolations, findRunViolations } from './validate'

/** Build a board from row strings: 'A', 'B', or '.' for empty. */
function boardFrom(...rows: string[]): Board {
  const base = createEmptyBoard(rows.length)
  return {
    ...base,
    cells: rows.map((row) =>
      [...row].map((ch) => ({ value: toValue(ch), given: false })),
    ),
  }
}

function toValue(ch: string): CellValue {
  if (ch === '.') return null
  if (ch === 'A' || ch === 'B') return ch
  throw new Error(`Unexpected board character: ${ch}`)
}

describe('findRunViolations', () => {
  test('empty board has no violations', () => {
    expect(findRunViolations(createEmptyBoard(6))).toEqual([])
  })

  test('a legal partial board has no violations', () => {
    const board = boardFrom(
      'AAB.',
      'B.A.',
      '.BB.',
      'A..B',
    )
    expect(findRunViolations(board)).toEqual([])
  })

  test('two identical icons with an empty gap are not a run', () => {
    const board = boardFrom(
      'A.AA',
      '....',
      '....',
      '....',
    )
    expect(findRunViolations(board)).toEqual([])
  })

  test('flags a horizontal triple with its row and cells', () => {
    const board = boardFrom(
      '....',
      'BBB.',
      '....',
      '....',
    )
    expect(findRunViolations(board)).toEqual([
      {
        rule: 'run',
        line: { kind: 'row', index: 1 },
        cells: [
          { row: 1, col: 0 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
        ],
      },
    ])
  })

  test('flags a vertical triple with its column and cells', () => {
    const board = boardFrom(
      '.A..',
      '.A..',
      '.A..',
      '....',
    )
    expect(findRunViolations(board)).toEqual([
      {
        rule: 'run',
        line: { kind: 'col', index: 1 },
        cells: [
          { row: 0, col: 1 },
          { row: 1, col: 1 },
          { row: 2, col: 1 },
        ],
      },
    ])
  })

  test('four in a row is one violation covering all four cells', () => {
    const board = boardFrom(
      'AAAA',
      '....',
      '....',
      '....',
    )
    expect(findRunViolations(board)).toEqual([
      {
        rule: 'run',
        line: { kind: 'row', index: 0 },
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      },
    ])
  })

  test('crossing runs report one violation per line', () => {
    const board = boardFrom(
      '.B..',
      'BBB.',
      '.B..',
      '....',
    )
    expect(findRunViolations(board)).toEqual([
      {
        rule: 'run',
        line: { kind: 'row', index: 1 },
        cells: [
          { row: 1, col: 0 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
        ],
      },
      {
        rule: 'run',
        line: { kind: 'col', index: 1 },
        cells: [
          { row: 0, col: 1 },
          { row: 1, col: 1 },
          { row: 2, col: 1 },
        ],
      },
    ])
  })
})

describe('findBalanceViolations', () => {
  test('empty board has no violations', () => {
    expect(findBalanceViolations(createEmptyBoard(6))).toEqual([])
  })

  test('a line at exactly the quota is legal', () => {
    const board = boardFrom(
      'AA..',
      'B..B',
      '....',
      '....',
    )
    expect(findBalanceViolations(board)).toEqual([])
  })

  test('a fully valid board has no violations', () => {
    const board = boardFrom(
      'AABB',
      'BBAA',
      'AABB',
      'BBAA',
    )
    expect(findBalanceViolations(board)).toEqual([])
  })

  test('a row with three of one icon reports that line and those cells', () => {
    const board = boardFrom(
      'AA.A',
      '....',
      '....',
      '....',
    )
    expect(findBalanceViolations(board)).toEqual([
      {
        rule: 'balance',
        line: { kind: 'row', index: 0 },
        icon: 'A',
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 3 },
        ],
      },
    ])
  })

  test('a column with three of one icon reports that line and those cells', () => {
    const board = boardFrom(
      'B...',
      'B...',
      '....',
      'B...',
    )
    expect(findBalanceViolations(board)).toEqual([
      {
        rule: 'balance',
        line: { kind: 'col', index: 0 },
        icon: 'B',
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 3, col: 0 },
        ],
      },
    ])
  })

  test('an over-full row and column report separate violations', () => {
    const board = boardFrom(
      'AA.A',
      'A...',
      '....',
      'A...',
    )
    expect(findBalanceViolations(board)).toEqual([
      {
        rule: 'balance',
        line: { kind: 'row', index: 0 },
        icon: 'A',
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 3 },
        ],
      },
      {
        rule: 'balance',
        line: { kind: 'col', index: 0 },
        icon: 'A',
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 3, col: 0 },
        ],
      },
    ])
  })

  test('only the over-represented icon is reported, not its opposite', () => {
    const board = boardFrom(
      'ABAA',
      '....',
      '....',
      '....',
    )
    expect(findBalanceViolations(board)).toEqual([
      {
        rule: 'balance',
        line: { kind: 'row', index: 0 },
        icon: 'A',
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
      },
    ])
  })
})
