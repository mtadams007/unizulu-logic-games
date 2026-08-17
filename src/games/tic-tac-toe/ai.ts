import {
  Board,
  Player,
  calculateWinner,
  getEmptyCells,
  otherPlayer,
} from "./logic";

export type Difficulty = "easy" | "medium" | "hard";

function randomMove(board: Board): number {
  const empty = getEmptyCells(board);
  return empty[Math.floor(Math.random() * empty.length)];
}

function findWinningMove(board: Board, player: Player): number | null {
  for (const cell of getEmptyCells(board)) {
    const next = [...board];
    next[cell] = player;
    if (calculateWinner(next)?.winner === player) return cell;
  }
  return null;
}

function heuristicMove(board: Board, player: Player): number {
  const winMove = findWinningMove(board, player);
  if (winMove !== null) return winMove;

  const blockMove = findWinningMove(board, otherPlayer(player));
  if (blockMove !== null) return blockMove;

  return randomMove(board);
}

function minimax(board: Board, player: Player, aiPlayer: Player): number {
  const result = calculateWinner(board);
  if (result) return result.winner === aiPlayer ? 1 : -1;

  const empty = getEmptyCells(board);
  if (empty.length === 0) return 0;

  const scores = empty.map((cell) => {
    const next = [...board];
    next[cell] = player;
    return minimax(next, otherPlayer(player), aiPlayer);
  });

  return player === aiPlayer ? Math.max(...scores) : Math.min(...scores);
}

function perfectMove(board: Board, player: Player): number {
  const empty = getEmptyCells(board);
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const cell of empty) {
    const next = [...board];
    next[cell] = player;
    const score = minimax(next, otherPlayer(player), player);
    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }
  return bestMove;
}

export function getAiMove(
  board: Board,
  player: Player,
  difficulty: Difficulty,
): number {
  switch (difficulty) {
    case "easy":
      return randomMove(board);
    case "medium":
      return heuristicMove(board, player);
    case "hard":
      return perfectMove(board, player);
  }
}
