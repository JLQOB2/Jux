// Pure presentation of a board: cells in a CSS grid, marker badges
// absolutely positioned over the shared edges, violation highlights
// painted per the chosen mode. No game state lives here — everything
// arrives through props, and clicks are reported upward.

import type { Board, Marker, Position, Violation } from '../engine'
import { CellIcon } from './CellIcon'

export type HighlightMode = 'line' | 'cell'

interface BoardViewProps {
  board: Board
  /** Violations to display right now (already debounced by the caller). */
  violations: ReadonlyArray<Violation>
  highlightMode: HighlightMode
  /** reverse is true for right-click: cycle backwards (null goes straight to B). */
  onCellAction: (pos: Position, reverse: boolean) => void
}

export function BoardView({
  board,
  violations,
  highlightMode,
  onCellAction,
}: BoardViewProps) {
  const flagged = flaggedCells(board, violations, highlightMode)
  // Marker violations carry the same Marker object the board holds, so
  // reference identity is enough to match them.
  const broken = new Set(
    violations.flatMap((violation) =>
      violation.rule === 'marker' ? [violation.marker] : [],
    ),
  )

  return (
    <div
      className="board"
      style={{ gridTemplateColumns: `repeat(${board.size}, var(--cell))` }}
    >
      {board.cells.map((rowCells, row) =>
        rowCells.map((cell, col) => (
          <button
            key={`${row},${col}`}
            className={[
              'cell',
              cell.given ? 'cell-given' : '',
              flagged.has(`${row},${col}`) ? 'cell-error' : '',
            ].join(' ')}
            onClick={() => onCellAction({ row, col }, false)}
            onContextMenu={(event) => {
              event.preventDefault()
              onCellAction({ row, col }, true)
            }}
          >
            {cell.value !== null && <CellIcon icon={cell.value} />}
          </button>
        )),
      )}
      {board.markers.map((marker, index) => (
        <MarkerBadge key={index} marker={marker} broken={broken.has(marker)} />
      ))}
    </div>
  )
}

/**
 * The set of "row,col" keys to paint red. Line mode expands run and
 * balance violations to their whole line (Tango-style ambiguity); cell
 * mode paints exactly the offending cells. Marker violations have no
 * line, so both modes paint the marker's two cells.
 */
function flaggedCells(
  board: Board,
  violations: ReadonlyArray<Violation>,
  mode: HighlightMode,
): Set<string> {
  const keys = new Set<string>()
  for (const violation of violations) {
    if (mode === 'line' && violation.rule !== 'marker') {
      for (let i = 0; i < board.size; i++) {
        keys.add(
          violation.line.kind === 'row'
            ? `${violation.line.index},${i}`
            : `${i},${violation.line.index}`,
        )
      }
    } else {
      for (const pos of violation.cells) {
        keys.add(`${pos.row},${pos.col}`)
      }
    }
  }
  return keys
}

// A marker badge sits centered on the edge its two cells share: the
// midpoint of the two cell centers, in cell-size units. The pitch from
// one cell to the next is the cell PLUS the 1px grid-line gap, and the
// board's 1px padding shifts everything by half a line — multiplying by
// the cell size alone drifts the badge further off per row/column.
function MarkerBadge({ marker, broken }: { marker: Marker; broken: boolean }) {
  const row = (marker.a.row + marker.b.row) / 2 + 0.5
  const col = (marker.a.col + marker.b.col) / 2 + 0.5
  return (
    <span
      className={broken ? 'marker marker-broken' : 'marker'}
      style={{
        top: `calc((var(--cell) + 1px) * ${row} + 0.5px)`,
        left: `calc((var(--cell) + 1px) * ${col} + 0.5px)`,
      }}
    >
      {marker.kind === 'equal' ? '=' : '×'}
    </span>
  )
}
