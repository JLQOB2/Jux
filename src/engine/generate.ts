// Puzzle generation: solution-first construction.
//
// A full valid board is generated first, and every clue — given or marker —
// is read off that solution. Because the solution satisfies every clue by
// construction, the puzzle can never have zero solutions; the only job left
// is uniqueness. Clues are added until exactly one solution remains, then
// redundant clues are removed — givens before markers, and only partially
// when slack is in play — to control difficulty.

import type { Board, Icon, Marker, Position } from './board'
import { createEmptyBoard, firstEmpty, ICONS, setCellValue } from './board'
import { mulberry32, shuffled, type Rng } from './random'
import { countSolutions } from './solver'
import { findViolations } from './validate'

export interface Puzzle {
  /** The playable board: given cells locked, markers attached. */
  readonly board: Board
  /** The unique completion of `board`. */
  readonly solution: Board
  /** The seed that generated this puzzle — regenerates it exactly. */
  readonly seed: number
}

export interface GenerateOptions {
  /**
   * How many markers the clue pool may draw from. Difficulty knob:
   * marker-heavy puzzles solve by tracing, so fewer markers means the
   * player must reason about balance and runs instead.
   * Defaults to the board size.
   */
  readonly markerCount?: number
  /**
   * Chance in [0, 1) that a redundant clue is kept anyway during
   * minimization. 0 produces a fully minimal (hardest) puzzle; higher
   * values leave helper clues in place. Defaults to a seed-drawn value,
   * so a generated catalog naturally mixes tough grinds with quick solves.
   */
  readonly slack?: number
}

/** One atom of puzzle information: a pre-filled cell or an adjacency marker. */
type Clue =
  | { readonly kind: 'given'; readonly pos: Position; readonly icon: Icon }
  | { readonly kind: 'marker'; readonly marker: Marker }

/** A puzzle with exactly one solution, fully determined by the seed. */
export function generatePuzzle(
  size: number,
  seed: number,
  options: GenerateOptions = {},
): Puzzle {
  const rng = mulberry32(seed)

  const solution = fillRandomly(createEmptyBoard(size), rng)
  if (solution === null) {
    // Unreachable for legal (even, >= 2) sizes; createEmptyBoard guards those.
    throw new Error(`No valid board of size ${size} exists`)
  }

  // Markers lead the pool so every puzzle gets its marker identity dealt
  // in before givens finish the job; minimization prunes redundant ones.
  const markerCount = options.markerCount ?? size
  const pool = [
    ...shuffled(rng, markerClues(solution)).slice(0, markerCount),
    ...shuffled(rng, givenClues(solution)),
  ]

  // Additive pass: deal clues until the puzzle is unique. Terminates
  // because the pool contains every cell as a given — all of them together
  // pin the board to exactly the solution.
  let clues: ReadonlyArray<Clue> = []
  let index = 0
  while (countSolutions(toBoard(size, clues)) !== 1) {
    clues = [...clues, pool[index++]]
  }

  // Subtractive pass: drop clues the puzzle stays unique without.
  // Givens are tried first so that wherever a marker could carry the same
  // information, the given is the one removed — load-bearing markers
  // survive and the puzzle keeps its marker identity. `slack` randomly
  // skips removal attempts, leaving helper clues in place for variety.
  const slack = options.slack ?? rng() * 0.5
  const removalOrder = [
    ...shuffled(rng, clues.filter((clue) => clue.kind === 'given')),
    ...shuffled(rng, clues.filter((clue) => clue.kind === 'marker')),
  ]
  for (const clue of removalOrder) {
    if (rng() < slack) continue
    const without = clues.filter((kept) => kept !== clue)
    if (countSolutions(toBoard(size, without)) === 1) {
      clues = without
    }
  }

  return { board: toBoard(size, clues), solution, seed }
}

/**
 * Backtracking fill, like solve(), but trying the icons in random order
 * at every step — so each run walks to a different valid full board.
 */
function fillRandomly(board: Board, rng: Rng): Board | null {
  if (findViolations(board).length > 0) return null
  const empty = firstEmpty(board)
  if (empty === null) return board
  for (const icon of shuffled(rng, ICONS)) {
    const filled = fillRandomly(setCellValue(board, empty, icon), rng)
    if (filled !== null) return filled
  }
  return null
}

/** Every cell of the solution as a potential given. */
function givenClues(solution: Board): Clue[] {
  const clues: Clue[] = []
  for (let row = 0; row < solution.size; row++) {
    for (let col = 0; col < solution.size; col++) {
      clues.push({
        kind: 'given',
        pos: { row, col },
        icon: solution.cells[row][col].value!,
      })
    }
  }
  return clues
}

/**
 * Every orthogonally adjacent pair as a potential marker, its kind read
 * off the solution: equal cells get '=', differing cells get '×'.
 */
function markerClues(solution: Board): Clue[] {
  const clues: Clue[] = []
  for (let row = 0; row < solution.size; row++) {
    for (let col = 0; col < solution.size; col++) {
      if (col + 1 < solution.size) {
        clues.push(markerClue(solution, { row, col }, { row, col: col + 1 }))
      }
      if (row + 1 < solution.size) {
        clues.push(markerClue(solution, { row, col }, { row: row + 1, col }))
      }
    }
  }
  return clues
}

function markerClue(solution: Board, a: Position, b: Position): Clue {
  const same =
    solution.cells[a.row][a.col].value === solution.cells[b.row][b.col].value
  return { kind: 'marker', marker: { kind: same ? 'equal' : 'differ', a, b } }
}

/** Materialize a clue list into a playable board. */
function toBoard(size: number, clues: ReadonlyArray<Clue>): Board {
  let board = createEmptyBoard(size)
  const markers: Marker[] = []
  for (const clue of clues) {
    if (clue.kind === 'given') {
      board = withGiven(board, clue.pos, clue.icon)
    } else {
      markers.push(clue.marker)
    }
  }
  return { ...board, markers }
}

// Not setCellValue: a given is locked, so the cell is rebuilt with
// given: true rather than copying the unlocked flag.
function withGiven(board: Board, pos: Position, icon: Icon): Board {
  const cells = board.cells.map((rowCells, row) =>
    row === pos.row
      ? rowCells.map((cell, col) =>
          col === pos.col ? { value: icon, given: true } : cell,
        )
      : rowCells,
  )
  return { ...board, cells }
}
