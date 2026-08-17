import { Board, Mark, WIN_LINES, getEmptyCells } from "./logic";

export type Difficulty = "easy" | "medium" | "hard";

export interface Move {
  index: number;
  mark: Mark;
}

interface LineInfo {
  mark: Mark;
  filled: number;
  empty: number;
}

// Returns null for a "dead" line that already contains both marks
function readLine(board: Board, line: number[]): LineInfo | null {
  let mark: Mark | null = null;
  let filled = 0;
  let empty = 0;
  for (const i of line) {
    const cell = board[i];
    if (cell === null) {
      empty++;
    } else if (mark === null || cell === mark) {
      mark = cell;
      filled++;
    } else {
      return null;
    }
  }
  return mark ? { mark, filled, empty } : null;
}

function randomMove(board: Board): Move {
  const empty = getEmptyCells(board);
  const index = empty[Math.floor(Math.random() * empty.length)];
  const mark: Mark = Math.random() < 0.5 ? "X" : "O";
  return { index, mark };
}

// A line with 4 matching marks and 1 empty cell completes to a win on the
// very next move, by either player — Chaos must occupy it now with the
// opposite mark to kill the line for good.
function findUrgentBlock(board: Board): Move | null {
  for (const line of WIN_LINES) {
    const info = readLine(board, line);
    if (info && info.filled === 4 && info.empty === 1) {
      const index = line.find((i) => board[i] === null)!;
      const mark: Mark = info.mark === "X" ? "O" : "X";
      return { index, mark };
    }
  }
  return null;
}

// Lower is safer: penalizes live lines by how many matching cells they
// already have, so filling near-complete lines counts far more than
// lightly-filled ones.
function boardDangerScore(board: Board): number {
  let score = 0;
  for (const line of WIN_LINES) {
    const info = readLine(board, line);
    if (info) score += info.filled * info.filled;
  }
  return score;
}

// Medium difficulty: prioritizes blocking high-risk lines (3+ matching marks)
// over random moves, but doesn't do full exhaustive search like hard mode.
function mediumChaosMove(board: Board): Move {
  const empty = getEmptyCells(board);
  const riskMoves: Move[] = [];

  // First, identify all moves that block or reduce dangerous lines
  for (const index of empty) {
    for (const mark of ["X", "O"] as Mark[]) {
      const next = [...board];
      next[index] = mark;

      // Check if this move improves the board (reduces danger)
      let isRisky = false;
      for (const line of WIN_LINES) {
        const info = readLine(next, line);
        if (info && info.filled >= 3) {
          isRisky = true;
          break;
        }
      }

      if (!isRisky) {
        riskMoves.push({ index, mark });
      }
    }
  }

  // If we found moves that avoid creating 3+ mark lines, prefer those
  if (riskMoves.length > 0) {
    return riskMoves[Math.floor(Math.random() * riskMoves.length)];
  }

  // Otherwise, pick the move that minimizes board danger
  let bestScore = Infinity;
  let bestMoves: Move[] = [];

  for (const index of empty) {
    for (const mark of ["X", "O"] as Mark[]) {
      const next = [...board];
      next[index] = mark;
      const score = boardDangerScore(next);
      if (score < bestScore) {
        bestScore = score;
        bestMoves = [{ index, mark }];
      } else if (score === bestScore) {
        bestMoves.push({ index, mark });
      }
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function bestChaosMove(board: Board): Move {
  const empty = getEmptyCells(board);
  let bestScore = Infinity;
  let bestMoves: Move[] = [];

  for (const index of empty) {
    for (const mark of ["X", "O"] as Mark[]) {
      const next = [...board];
      next[index] = mark;
      const score = boardDangerScore(next);
      if (score < bestScore) {
        bestScore = score;
        bestMoves = [{ index, mark }];
      } else if (score === bestScore) {
        bestMoves.push({ index, mark });
      }
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export function getChaosMove(board: Board, difficulty: Difficulty): Move {
  const urgent = findUrgentBlock(board);
  if (urgent) return urgent;

  if (difficulty === "easy") {
    return randomMove(board);
  }

  if (difficulty === "medium") {
    return mediumChaosMove(board);
  }

  return bestChaosMove(board);
}

// Order AI: tries to build 5-in-a-row (aggressive/building strategy)

// Scores a move for Order based on how many lines it helps build
// Higher score = better move for Order
function boardOrderScore(board: Board): number {
  let score = 0;
  for (const line of WIN_LINES) {
    const info = readLine(board, line);
    if (info) {
      // Reward building lines of our mark; penalize opponent's lines slightly less
      score += info.filled * info.filled;
    }
  }
  return score;
}

// Check for Order's winning move (3+ marks that can extend to 5)
function findOrderOpportunity(board: Board): Move | null {
  for (const line of WIN_LINES) {
    const info = readLine(board, line);
    // Look for 4 of the same mark with 1 empty — Order can win next turn
    if (info && info.filled === 4 && info.empty === 1) {
      const index = line.find((i) => board[i] === null)!;
      return { index, mark: info.mark };
    }
  }
  return null;
}

function mediumOrderMove(board: Board): Move {
  const empty = getEmptyCells(board);
  const buildMoves: Move[] = [];

  // Prefer moves that build our own lines (3+ in a row on any line)
  for (const index of empty) {
    for (const mark of ["X", "O"] as Mark[]) {
      const next = [...board];
      next[index] = mark;

      // Count how many lines we're building with this mark
      let buildCount = 0;
      for (const line of WIN_LINES) {
        const info = readLine(next, line);
        if (info && info.mark === mark && info.filled >= 3) {
          buildCount++;
        }
      }

      if (buildCount > 0) {
        // Add multiple times based on build count for weighted randomness
        for (let i = 0; i < buildCount; i++) {
          buildMoves.push({ index, mark });
        }
      }
    }
  }

  // If we found good building moves, use them; otherwise random
  if (buildMoves.length > 0) {
    return buildMoves[Math.floor(Math.random() * buildMoves.length)];
  }

  return randomMove(board);
}

function bestOrderMove(board: Board): Move {
  const empty = getEmptyCells(board);
  let bestScore = -Infinity;
  let bestMoves: Move[] = [];

  for (const index of empty) {
    for (const mark of ["X", "O"] as Mark[]) {
      const next = [...board];
      next[index] = mark;
      const score = boardOrderScore(next);
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [{ index, mark }];
      } else if (score === bestScore) {
        bestMoves.push({ index, mark });
      }
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export function getOrderMove(board: Board, difficulty: Difficulty): Move {
  // Check for immediate winning opportunity
  const opportunity = findOrderOpportunity(board);
  if (opportunity) return opportunity;

  if (difficulty === "easy") {
    return randomMove(board);
  }

  if (difficulty === "medium") {
    return mediumOrderMove(board);
  }

  return bestOrderMove(board);
}
