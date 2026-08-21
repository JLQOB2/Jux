// Build-time catalog generator. Runs on the dev machine, never in the
// browser: the JSON it writes is the source of truth the app ships.
//
//   pnpm catalog <size> <count>     e.g.  pnpm catalog 6 50
//
// Appends <count> new puzzles to src/catalog/size-<size>.json. Records are
// append-only — ids and seeds continue from where the file left off, and
// existing entries are never touched, so released puzzle ids stay stable
// even if the generator's code changes between batches.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { generatePuzzle } from '../src/engine/generate'
import {
  boardToText,
  puzzleFromRecord,
  puzzleToRecord,
  type PuzzleRecord,
} from '../src/engine/serialize'
import { countSolutions } from '../src/engine/solver'

const size = Number(process.argv[2])
const count = Number(process.argv[3])
if (!Number.isInteger(size) || !Number.isInteger(count) || count < 1) {
  console.error('Usage: pnpm catalog <size> <count>   e.g. pnpm catalog 6 50')
  process.exit(1)
}

const catalogDir = fileURLToPath(new URL('../src/catalog/', import.meta.url))
const file = `${catalogDir}size-${pad(size, 2)}.json`

const records: PuzzleRecord[] = existsSync(file)
  ? JSON.parse(readFileSync(file, 'utf8'))
  : []
let seed = records.reduce((max, record) => Math.max(max, record.seed), 0) + 1

console.log(`${file}\n${records.length} existing puzzles; generating ${count} more\n`)

for (let i = 0; i < count; i++) {
  const started = performance.now()
  const puzzle = generatePuzzle(size, seed)
  const id = `${pad(size, 2)}-${pad(records.length + 1, 4)}`
  const record = puzzleToRecord(puzzle, id)

  // Safety nets before anything is written: the puzzle must be unique,
  // and the record must round-trip back to the exact board it describes.
  if (countSolutions(puzzle.board) !== 1) {
    throw new Error(`${id} (seed ${seed}) is not unique — generator bug`)
  }
  const restored = boardToText(puzzleFromRecord(record).board)
  if (restored.join('\n') !== record.board.join('\n')) {
    throw new Error(`${id} (seed ${seed}) does not round-trip — serializer bug`)
  }

  records.push(record)
  const givens = puzzle.board.cells.flat().filter((c) => c.value !== null).length
  const elapsed = Math.round(performance.now() - started)
  console.log(
    `${id}  seed ${pad(seed, 4)}  ${pad(givens, 2)} givens  ${puzzle.board.markers.length} markers  ${elapsed}ms`,
  )
  seed++
}

mkdirSync(catalogDir, { recursive: true })
writeFileSync(file, JSON.stringify(records, null, 2) + '\n')
console.log(`\nWrote ${records.length} puzzles to ${file}`)

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}
