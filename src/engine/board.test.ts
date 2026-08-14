import { describe, expect, test } from 'vitest'
import { createEmptyBoard, opposite } from './board'

describe('opposite', () => {
  test('flips A to B and B to A', () => {
    expect(opposite('A')).toBe('B')
    expect(opposite('B')).toBe('A')
  })
})

describe('createEmptyBoard', () => {
  test('creates an n×n grid of empty, non-given cells', () => {
    const board = createEmptyBoard(6)
    expect(board.size).toBe(6)
    expect(board.cells).toHaveLength(6)
    for (const row of board.cells) {
      expect(row).toHaveLength(6)
      for (const cell of row) {
        expect(cell).toEqual({ value: null, given: false })
      }
    }
    expect(board.markers).toEqual([])
  })

  test.each([0, -2])('rejects too-small size %i', (size) => {
    expect(() => createEmptyBoard(size)).toThrow(/at least 2/)
  })

  test.each([3, 7])('rejects odd size %i', (size) => {
    expect(() => createEmptyBoard(size)).toThrow(/even/)
  })

  test('rows are independent arrays, not shared references', () => {
    const board = createEmptyBoard(4)
    expect(board.cells[0]).not.toBe(board.cells[1])
  })
})
