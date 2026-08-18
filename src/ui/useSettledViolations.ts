// The violation-display debounce. The engine validates instantly on every
// board change; this hook only decides WHEN the result becomes visible:
// red is hidden the moment the board changes and revealed once the board
// has sat unchanged for delayMs — so cycling through values never flashes.
// Fixing a violation clears the red immediately, with no delay.

import { useEffect, useState } from 'react'
import type { Board, Violation } from '../engine'
import { findViolations } from '../engine'

export function useSettledViolations(
  board: Board,
  delayMs: number,
): ReadonlyArray<Violation> {
  const [settled, setSettled] = useState<ReadonlyArray<Violation>>([])

  useEffect(() => {
    const violations = findViolations(board)
    setSettled([])
    if (violations.length === 0) return
    const timer = setTimeout(() => setSettled(violations), delayMs)
    // The cleanup cancels the pending timer on every board change — that
    // cancellation is the entire debounce.
    return () => clearTimeout(timer)
  }, [board, delayMs])

  return settled
}
