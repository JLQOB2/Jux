import { describe, expect, test } from 'vitest'
import { mulberry32, randomInt, shuffled } from './random'

describe('mulberry32', () => {
  test('the same seed produces the same sequence', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b())
    }
  })

  test('different seeds produce different sequences', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const drawsA = Array.from({ length: 10 }, () => a())
    const drawsB = Array.from({ length: 10 }, () => b())
    expect(drawsA).not.toEqual(drawsB)
  })

  test('every value lies in [0, 1)', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('randomInt', () => {
  test('every value lies in [0, bound)', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const value = randomInt(rng, 6)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(6)
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})

describe('shuffled', () => {
  test('returns a permutation of the input', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const result = shuffled(mulberry32(3), items)
    expect([...result].sort((a, b) => a - b)).toEqual(items)
  })

  test('leaves the original array untouched', () => {
    const items = [1, 2, 3, 4, 5]
    shuffled(mulberry32(3), items)
    expect(items).toEqual([1, 2, 3, 4, 5])
  })

  test('the same seed produces the same order', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    expect(shuffled(mulberry32(9), items)).toEqual(shuffled(mulberry32(9), items))
  })
})
