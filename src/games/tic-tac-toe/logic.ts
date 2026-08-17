export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];

export const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyBoard(): Board {
  return Array(9).fill(null);
}

export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((cells, cell, i) => {
    if (cell === null) cells.push(i);
    return cells;
  }, []);
}

export function calculateWinner(
  board: Board,
): { winner: Player; line: number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return getEmptyCells(board).length === 0 && calculateWinner(board) === null;
}

export function otherPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}
