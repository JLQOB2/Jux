import { describe, expect, test } from 'vitest'
import type { Board } from './board'
import { createEmptyBoard } from './board'
import { boardFrom, markerAt } from './test-helpers'
import {
  findBalanceViolations,
  findMarkerViolations,
  findRunViolations,
  findViolations,
} from './validate'

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

describe('findMarkerViolations', () => {
  test('a board without markers has no violations', () => {
    expect(findMarkerViolations(boardFrom('AB..', '....', '....', '....'))).toEqual([])
  })

  test('satisfied markers are not violations', () => {
    const board: Board = {
      ...boardFrom(
        'AA..',
        'B...',
        '....',
        '....',
      ),
      markers: [
        markerAt('equal', [0, 0], [0, 1]),
        markerAt('differ', [0, 0], [1, 0]),
      ],
    }
    expect(findMarkerViolations(board)).toEqual([])
  })

  test('a broken equal marker reports the marker and both cells', () => {
    const marker = markerAt('equal', [0, 0], [0, 1])
    const board: Board = { ...boardFrom('AB..', '....', '....', '....'), markers: [marker] }
    expect(findMarkerViolations(board)).toEqual([
      {
        rule: 'marker',
        marker,
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ])
  })

  test('a broken differ marker reports the marker and both cells', () => {
    const marker = markerAt('differ', [0, 0], [1, 0])
    const board: Board = { ...boardFrom('B...', 'B...', '....', '....'), markers: [marker] }
    expect(findMarkerViolations(board)).toEqual([
      {
        rule: 'marker',
        marker,
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
        ],
      },
    ])
  })

  test('a marker with an empty cell is never judged', () => {
    const board: Board = {
      ...boardFrom('A...', '....', '....', '....'),
      markers: [
        markerAt('equal', [0, 0], [0, 1]),
        markerAt('differ', [0, 0], [1, 0]),
        markerAt('equal', [2, 2], [2, 3]),
      ],
    }
    expect(findMarkerViolations(board)).toEqual([])
  })

  test('only broken markers are reported', () => {
    const good = markerAt('differ', [0, 0], [0, 1])
    const bad = markerAt('equal', [0, 0], [1, 0])
    const board: Board = { ...boardFrom('AB..', 'B...', '....', '....'), markers: [good, bad] }
    const violations = findMarkerViolations(board)
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({ rule: 'marker', marker: bad })
  })
})

describe('findViolations', () => {
  test('an empty board is fully clean', () => {
    expect(findViolations(createEmptyBoard(6))).toEqual([])
  })

  test('collects violations from every rule', () => {
    const board: Board = {
      ...boardFrom(
        'AAA.',
        '....',
        '....',
        '....',
      ),
      markers: [markerAt('differ', [0, 0], [0, 1])],
    }
    const rules = findViolations(board).map((violation) => violation.rule)
    expect(rules).toEqual(['run', 'balance', 'marker'])
  })
})
