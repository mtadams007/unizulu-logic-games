export type Mark = "X" | "O";
export type Cell = Mark | null;
export type Board = Cell[];
export type Winner = "order" | "chaos";

export const BOARD_SIZE = 6;
export const WIN_LENGTH = 5;

export function emptyBoard(): Board {
  return Array(BOARD_SIZE * BOARD_SIZE).fill(null);
}

export function indexOf(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

const LINE_DIRECTIONS: [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export const WIN_LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (const [dr, dc] of LINE_DIRECTIONS) {
        const endRow = row + dr * (WIN_LENGTH - 1);
        const endCol = col + dc * (WIN_LENGTH - 1);
        if (
          endRow >= 0 &&
          endRow < BOARD_SIZE &&
          endCol >= 0 &&
          endCol < BOARD_SIZE
        ) {
          lines.push(
            Array.from({ length: WIN_LENGTH }, (_, k) =>
              indexOf(row + dr * k, col + dc * k),
            ),
          );
        }
      }
    }
  }
  return lines;
})();

export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((cells, cell, i) => {
    if (cell === null) cells.push(i);
    return cells;
  }, []);
}

export function isBoardFull(board: Board): boolean {
  return getEmptyCells(board).length === 0;
}

export function findCompletedLine(board: Board): number[] | null {
  for (const line of WIN_LINES) {
    const first = board[line[0]];
    if (first !== null && line.every((i) => board[i] === first)) {
      return line;
    }
  }
  return null;
}

export function calculateResult(
  board: Board,
): { winner: Winner; line: number[] | null } | null {
  const line = findCompletedLine(board);
  if (line) return { winner: "order", line };
  if (isBoardFull(board)) return { winner: "chaos", line: null };
  return null;
}
