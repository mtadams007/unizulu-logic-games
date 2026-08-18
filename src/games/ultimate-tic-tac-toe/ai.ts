import {
  GameState,
  Player,
  SmallBoard,
  makeMove,
  getLegalMoves,
  getGameWinner,
  isDraw,
  otherPlayer,
} from "./logic";

export type Difficulty = "easy" | "medium" | "hard";

export function getAiMove(
  state: GameState,
  player: Player,
  difficulty: Difficulty,
): { boardIndex: number; cellIndex: number } | null {
  switch (difficulty) {
    case "easy":
      return getEasyMove(state);
    case "medium":
      return getMediumMove(state, player);
    case "hard":
      return getHardMove(state, player);
  }
}

function getEasyMove(
  state: GameState,
): { boardIndex: number; cellIndex: number } | null {
  const moves = getLegalMoves(state);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

function getMediumMove(
  state: GameState,
  player: Player,
): { boardIndex: number; cellIndex: number } | null {
  const moves = getLegalMoves(state);
  if (moves.length === 0) return null;

  const opponent = otherPlayer(player);

  // Check for winning moves
  for (const move of moves) {
    const result = makeMove(state, move.boardIndex, move.cellIndex, player);
    if (result && getGameWinner(result) === player) {
      return move;
    }
  }

  // Check for blocking opponent wins
  for (const move of moves) {
    const result = makeMove(state, move.boardIndex, move.cellIndex, opponent);
    if (result && getGameWinner(result) === opponent) {
      return move;
    }
  }

  // Prefer center board and center positions
  const centerBoardIndices = [4]; // Center of 3x3
  const centerCellIndices = [4]; // Center of 3x3

  const centerBoardMoves = moves.filter((m) => centerBoardIndices.includes(m.boardIndex));
  if (centerBoardMoves.length > 0) {
    const centerMoves = centerBoardMoves.filter((m) =>
      centerCellIndices.includes(m.cellIndex),
    );
    if (centerMoves.length > 0) {
      return centerMoves[Math.floor(Math.random() * centerMoves.length)];
    }
    return centerBoardMoves[Math.floor(Math.random() * centerBoardMoves.length)];
  }

  // Random
  return moves[Math.floor(Math.random() * moves.length)];
}

function getHardMove(
  state: GameState,
  player: Player,
): { boardIndex: number; cellIndex: number } | null {
  const moves = getLegalMoves(state);
  if (moves.length === 0) return null;

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const result = makeMove(state, move.boardIndex, move.cellIndex, player);
    if (!result) continue;

    const score = minimax(result, otherPlayer(player), player, 4);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(
  state: GameState,
  currentPlayer: Player,
  aiPlayer: Player,
  depth: number,
): number {
  const winner = getGameWinner(state);
  if (winner === aiPlayer) return 100 + depth; // Prefer faster wins
  if (winner !== null) return -100 - depth; // Prefer slower losses
  if (isDraw(state)) return 0;
  if (depth === 0) return evaluateState(state, aiPlayer);

  const moves = getLegalMoves(state);
  if (moves.length === 0) return 0;

  let bestScore = currentPlayer === aiPlayer ? -Infinity : Infinity;

  for (const move of moves) {
    const result = makeMove(state, move.boardIndex, move.cellIndex, currentPlayer);
    if (!result) continue;

    const score = minimax(result, otherPlayer(currentPlayer), aiPlayer, depth - 1);
    if (currentPlayer === aiPlayer) {
      bestScore = Math.max(bestScore, score);
    } else {
      bestScore = Math.min(bestScore, score);
    }
  }

  return bestScore;
}

function evaluateState(state: GameState, aiPlayer: Player): number {
  const opponent = otherPlayer(aiPlayer);
  let score = 0;

  // Score meta board lines
  const WINNING_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const cells = [state.metaBoard[a], state.metaBoard[b], state.metaBoard[c]];
    const aiCount = cells.filter((cell) => cell === aiPlayer).length;
    const oppCount = cells.filter((cell) => cell === opponent).length;

    if (aiCount === 3) score += 1000;
    if (oppCount === 3) score -= 1000;
    if (aiCount === 2 && oppCount === 0) score += 100;
    if (oppCount === 2 && aiCount === 0) score -= 100;
    if (aiCount === 1 && oppCount === 0) score += 10;
    if (oppCount === 1 && aiCount === 0) score -= 10;
  }

  // Bonus for center board control
  if (state.metaBoard[4] === aiPlayer) score += 50;
  if (state.metaBoard[4] === opponent) score -= 50;

  return score;
}
