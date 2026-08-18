// Seeded pseudo-random numbers. Math.random() cannot be seeded in
// JavaScript, so the generator carries its own PRNG: the same seed yields
// the same sequence on every machine, which makes every generated puzzle
// reproducible from its seed alone.

/** Returns a pseudo-random number in [0, 1), like Math.random. */
export type Rng = () => number

/**
 * mulberry32 — a tiny, fast 32-bit PRNG with good statistical quality
 * for game purposes (not cryptography).
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}

/** A random integer in [0, bound). */
export function randomInt(rng: Rng, bound: number): number {
  return Math.floor(rng() * bound)
}

/** A shuffled copy of the array (Fisher–Yates); the original is untouched. */
export function shuffled<T>(rng: Rng, items: ReadonlyArray<T>): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
