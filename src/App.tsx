import { useState } from 'react'
import { findViolations, firstEmpty } from './engine'
import { BoardView, type HighlightMode } from './ui/BoardView'
import { useGame } from './ui/useGame'
import { useSettledViolations } from './ui/useSettledViolations'

export default function App() {
  const game = useGame(1)
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('line')
  const [delayMs, setDelayMs] = useState(750)
  const [seedInput, setSeedInput] = useState('1')

  // Display-only debounce; the win check below reads the engine directly
  // so "Solved!" appears the instant the last cell lands.
  const settled = useSettledViolations(game.board, delayMs)
  const solved =
    firstEmpty(game.board) === null && findViolations(game.board).length === 0

  function loadSeed(seed: number): void {
    setSeedInput(String(seed))
    game.newPuzzle(seed)
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
        {solved ? 'Solved!' : `seed ${game.puzzle.seed}`}
      </p>
      <div className="controls">
        <button onClick={game.undo} disabled={!game.canUndo}>
          Undo
        </button>
        <button onClick={() => loadSeed(Math.floor(Math.random() * 1_000_000))}>
          New puzzle
        </button>
      </div>
      <details className="dev-panel" open>
        <summary>Playtest knobs</summary>
        <label>
          Seed
          <input
            value={seedInput}
            onChange={(event) => setSeedInput(event.target.value)}
          />
          <button onClick={() => game.newPuzzle(Number(seedInput) || 0)}>
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
