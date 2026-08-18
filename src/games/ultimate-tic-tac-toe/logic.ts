export type Player = "X" | "O";
export type Cell = Player | null;
export type SmallBoard = Cell[]; // 9 cells
export type MetaCell = Player | null; // Winner of a small board
export type MetaBoard = MetaCell[]; // 9 cells, one per small board

export interface GameState {
  boards: SmallBoard[]; // 9 small boards, each with 9 cells
  metaBoard: MetaBoard; // Tracks winners of each small board
  validBoardIndices: number[] | null; // null = can play anywhere, array = specific boards
}

// Winning lines for both small boards and meta board
const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyGameState(): GameState {
  return {
    boards: Array(9)
      .fill(null)
      .map(() => Array(9).fill(null)),
    metaBoard: Array(9).fill(null),
    validBoardIndices: null, // X starts and can play anywhere
  };
}

function getSmallBoardWinner(board: SmallBoard): Player | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Player;
    }
  }
  return null;
}

function isSmallBoardFull(board: SmallBoard): boolean {
  return board.every((cell) => cell !== null);
}

function updateMetaBoard(
  boards: SmallBoard[],
  metaBoard: MetaBoard,
): MetaBoard {
  const updated = [...metaBoard];
  for (let i = 0; i < 9; i++) {
    if (updated[i] === null) {
      updated[i] = getSmallBoardWinner(boards[i]);
    }
  }
  return updated;
}

function calculateMetaWinner(metaBoard: MetaBoard): Player | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (metaBoard[a] && metaBoard[a] === metaBoard[b] && metaBoard[a] === metaBoard[c]) {
      return metaBoard[a] as Player;
    }
  }
  return null;
}

export function makeMove(
  state: GameState,
  boardIndex: number,
  cellIndex: number,
  player: Player,
): GameState | null {
  // Check if board index is valid
  if (state.validBoardIndices !== null && !state.validBoardIndices.includes(boardIndex)) {
    return null; // Invalid board for this turn
  }

  // Check if board is already won
  if (state.metaBoard[boardIndex] !== null) {
    return null; // Board already won
  }

  const board = state.boards[boardIndex];

  // Check if cell is empty
  if (board[cellIndex] !== null) {
    return null; // Cell already occupied
  }

  // Make the move
  const newBoards = state.boards.map((b) => [...b]);
  newBoards[boardIndex][cellIndex] = player;

  // Update meta board
  let newMetaBoard = updateMetaBoard(newBoards, state.metaBoard);

  // Determine next valid board(s)
  let nextValidBoardIndices: number[] | null = null;
  const nextBoard = newBoards[cellIndex];

  // If next board is full or won, player can play anywhere
  if (isSmallBoardFull(nextBoard) || newMetaBoard[cellIndex] !== null) {
    nextValidBoardIndices = null;
  } else {
    nextValidBoardIndices = [cellIndex];
  }

  return {
    boards: newBoards,
    metaBoard: newMetaBoard,
    validBoardIndices: nextValidBoardIndices,
  };
}

export function getEmptyCells(board: SmallBoard): number[] {
  return board.reduce<number[]>((cells, cell, i) => {
    if (cell === null) cells.push(i);
    return cells;
  }, []);
}

export function isGameOver(state: GameState): boolean {
  const metaWinner = calculateMetaWinner(state.metaBoard);
  if (metaWinner !== null) return true;

  // Check if all boards are full or won
  for (let i = 0; i < 9; i++) {
    if (state.metaBoard[i] === null && getEmptyCells(state.boards[i]).length > 0) {
      return false; // Found an empty cell in a non-won board
    }
  }
  return true; // No empty moves possible
}

export function getGameWinner(state: GameState): Player | null {
  return calculateMetaWinner(state.metaBoard);
}

export function isDraw(state: GameState): boolean {
  return isGameOver(state) && getGameWinner(state) === null;
}

export function otherPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}

export function getLegalMoves(state: GameState): Array<{ boardIndex: number; cellIndex: number }> {
  const moves: Array<{ boardIndex: number; cellIndex: number }> = [];

  const boardsToCheck = state.validBoardIndices === null 
    ? Array.from({ length: 9 }, (_, i) => i)
    : state.validBoardIndices;

  for (const boardIndex of boardsToCheck) {
    // Skip if board is already won
    if (state.metaBoard[boardIndex] !== null) continue;

    const board = state.boards[boardIndex];
    const emptyCells = getEmptyCells(board);

    for (const cellIndex of emptyCells) {
      moves.push({ boardIndex, cellIndex });
    }
  }

  return moves;
}
