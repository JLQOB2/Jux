import { useMemo, useState } from 'react'
import catalog06 from './catalog/size-06.json'
import catalog08 from './catalog/size-08.json'
import catalog10 from './catalog/size-10.json'
import type { PuzzleRecord } from './engine'
import {
  findViolations,
  firstEmpty,
  generatePuzzle,
  puzzleFromRecord,
} from './engine'
import { BoardView, type HighlightMode } from './ui/BoardView'
import { useGame } from './ui/useGame'
import { useSettledViolations } from './ui/useSettledViolations'

// Puzzles are data: the catalog JSON is bundled into the app and each
// record is inflated to a live Puzzle only when the player opens it.
const CATALOGS: Record<string, ReadonlyArray<PuzzleRecord>> = {
  '6': catalog06,
  '8': catalog08,
  '10': catalog10,
}

export default function App() {
  const [catalogSize, setCatalogSize] = useState('6')
  const [index, setIndex] = useState(0)
  const [label, setLabel] = useState(CATALOGS['6'][0].id)
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('line')
  const [delayMs, setDelayMs] = useState(750)
  const [seedInput, setSeedInput] = useState('1')

  const game = useGame(useMemo(() => puzzleFromRecord(CATALOGS['6'][0]), []))
  const puzzles = CATALOGS[catalogSize]

  // Display-only debounce; the win check below reads the engine directly
  // so "Solved!" appears the instant the last cell lands.
  const settled = useSettledViolations(game.board, delayMs)
  const solved =
    firstEmpty(game.board) === null && findViolations(game.board).length === 0

  function loadFromCatalog(sizeKey: string, i: number): void {
    const record = CATALOGS[sizeKey][i]
    setCatalogSize(sizeKey)
    setIndex(i)
    setLabel(record.id)
    game.newPuzzle(puzzleFromRecord(record))
  }

  /** Dev-panel escape hatch: generate live from a seed, bypassing the catalog. */
  function loadDevSeed(seed: number): void {
    setLabel(`dev seed ${seed}`)
    game.newPuzzle(generatePuzzle(Number(catalogSize), seed))
  }

  return (
    <main className="app">
      <h1>Jux</h1>
      <BoardView
        board={game.board}
        violations={settled}
        highlightMode={highlightMode}
        onCellAction={game.cycleCell}
      />
      <p className={solved ? 'status status-solved' : 'status'}>
        {solved ? 'Solved!' : label}
      </p>
      <div className="controls">
        <button onClick={game.undo} disabled={!game.canUndo}>
          Undo
        </button>
        <button
          onClick={() => loadFromCatalog(catalogSize, index - 1)}
          disabled={index === 0}
        >
          ◀ Prev
        </button>
        <button
          onClick={() => loadFromCatalog(catalogSize, index + 1)}
          disabled={index === puzzles.length - 1}
        >
          Next ▶
        </button>
      </div>
      <details className="dev-panel" open>
        <summary>Playtest knobs</summary>
        <label>
          Catalog
          <select
            value={catalogSize}
            onChange={(event) => loadFromCatalog(event.target.value, 0)}
          >
            <option value="6">6×6 ({CATALOGS['6'].length})</option>
            <option value="8">8×8 ({CATALOGS['8'].length})</option>
            <option value="10">10×10 ({CATALOGS['10'].length})</option>
          </select>
        </label>
        <label>
          Seed
          <input
            value={seedInput}
            onChange={(event) => setSeedInput(event.target.value)}
          />
          <button onClick={() => loadDevSeed(Number(seedInput) || 0)}>
            Load
          </button>
        </label>
        <label>
          Highlight
          <select
            value={highlightMode}
            onChange={(event) =>
              setHighlightMode(event.target.value as HighlightMode)
            }
          >
            <option value="line">line</option>
            <option value="cell">cell</option>
          </select>
        </label>
        <label>
          Error delay: {delayMs}ms
          <input
            type="range"
            min={0}
            max={3000}
            step={250}
            value={delayMs}
            onChange={(event) => setDelayMs(Number(event.target.value))}
          />
        </label>
      </details>
    </main>
  )
}
