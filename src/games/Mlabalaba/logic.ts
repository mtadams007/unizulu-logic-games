export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[];

export interface GameState {
  board: Board;
  currentPlayer: Player;
  piecesToPlace: Record<Player, number>;
  pendingCapture: Player | null;
  noCaptureMoves: number;
}

export interface Move {
  from: number;
  to: number;
}

export const POINTS = [
  { x: 0, y: 0 },
  { x: 50, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
  { x: 100, y: 100 },
  { x: 50, y: 100 },
  { x: 0, y: 100 },
  { x: 0, y: 50 },
  { x: 16.67, y: 16.67 },
  { x: 50, y: 16.67 },
  { x: 83.33, y: 16.67 },
  { x: 83.33, y: 50 },
  { x: 83.33, y: 83.33 },
  { x: 50, y: 83.33 },
  { x: 16.67, y: 83.33 },
  { x: 16.67, y: 50 },
  { x: 33.33, y: 33.33 },
  { x: 50, y: 33.33 },
  { x: 66.67, y: 33.33 },
  { x: 66.67, y: 50 },
  { x: 66.67, y: 66.67 },
  { x: 50, y: 66.67 },
  { x: 33.33, y: 66.67 },
  { x: 33.33, y: 50 },
] as const;

export const MILLS: number[][] = [
  [0, 1, 2],
  [2, 3, 4],
  [4, 5, 6],
  [6, 7, 0],
  [8, 9, 10],
  [10, 11, 12],
  [12, 13, 14],
  [14, 15, 8],
  [16, 17, 18],
  [18, 19, 20],
  [20, 21, 22],
  [22, 23, 16],
  [1, 9, 17],
  [3, 11, 19],
  [5, 13, 21],
  [7, 15, 23],
  [0, 8, 16],
  [2, 10, 18],
  [4, 12, 20],
  [6, 14, 22],
];

const ADJACENCY: number[][] = [
  [1, 7, 8],
  [0, 2, 9],
  [1, 3, 10],
  [2, 4, 11],
  [3, 5, 12],
  [4, 6, 13],
  [5, 7, 14],
  [6, 0, 15],
  [9, 15, 0, 16],
  [8, 10, 1, 17],
  [9, 11, 2, 18],
  [10, 12, 3, 19],
  [11, 13, 4, 20],
  [12, 14, 5, 21],
  [13, 15, 6, 22],
  [14, 8, 7, 23],
  [17, 23, 8],
  [16, 18, 9],
  [17, 19, 10],
  [18, 20, 11],
  [19, 21, 12],
  [20, 22, 13],
  [21, 23, 14],
  [22, 16, 15],
];

export function emptyGameState(): GameState {
  return {
    board: Array(24).fill(null),
    currentPlayer: "X",
    piecesToPlace: { X: 12, O: 12 },
    pendingCapture: null,
    noCaptureMoves: 0,
  };
}

export function otherPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}

export function getPiecesOnBoard(board: Board, player: Player): number[] {
  return board.reduce<number[]>((pieces, cell, index) => {
    if (cell === player) pieces.push(index);
    return pieces;
  }, []);
}

export function getEmptyPoints(board: Board): number[] {
  return board.reduce<number[]>((points, cell, index) => {
    if (cell === null) points.push(index);
    return points;
  }, []);
}

export function isInMill(board: Board, point: number, player: Player): boolean {
  return MILLS.some((mill) =>
    mill.includes(point) && mill.every((index) => board[index] === player),
  );
}

export function formsMill(board: Board, point: number, player: Player): boolean {
  return isInMill(board, point, player);
}

export function getCaptureTargets(board: Board, player: Player): number[] {
  const opponent = otherPlayer(player);
  const opponentPieces = getPiecesOnBoard(board, opponent);
  const outsideMills = opponentPieces.filter(
    (point) => !isInMill(board, point, opponent),
  );
  return outsideMills.length > 0 ? outsideMills : opponentPieces;
}

export function getLegalMoves(state: GameState, player = state.currentPlayer): Move[] {
  const pieces = getPiecesOnBoard(state.board, player);
  const canFly = pieces.length === 3;
  const destinations = getEmptyPoints(state.board);
  const moves: Move[] = [];

  for (const from of pieces) {
    const reachable = canFly ? destinations : ADJACENCY[from];
    for (const to of reachable) {
      if (state.board[to] === null) moves.push({ from, to });
    }
  }
  return moves;
}

export function getWinner(state: GameState): Player | null {
  if (state.pendingCapture !== null) return null;
  const xPieces = getPiecesOnBoard(state.board, "X").length;
  const oPieces = getPiecesOnBoard(state.board, "O").length;

  if (xPieces <= 2 && state.piecesToPlace.X === 0) return "O";
  if (oPieces <= 2 && state.piecesToPlace.O === 0) return "X";

  if (state.piecesToPlace[state.currentPlayer] === 0 && getLegalMoves(state).length === 0) {
    return otherPlayer(state.currentPlayer);
  }
  return null;
}

export function isDraw(state: GameState): boolean {
  return getWinner(state) === null &&
    state.noCaptureMoves >= 10 &&
    (getPiecesOnBoard(state.board, "X").length === 3 ||
      getPiecesOnBoard(state.board, "O").length === 3);
}

export function isPlacementTurn(state: GameState): boolean {
  return state.piecesToPlace[state.currentPlayer] > 0;
}

function finishTurn(state: GameState, captured: boolean): GameState {
  return {
    ...state,
    currentPlayer: otherPlayer(state.currentPlayer),
    pendingCapture: null,
    noCaptureMoves: captured ? 0 : state.noCaptureMoves + 1,
  };
}

export function placeCow(state: GameState, point: number): GameState | null {
  if (state.pendingCapture !== null || !isPlacementTurn(state)) return null;
  if (state.board[point] !== null) return null;

  const board = [...state.board];
  board[point] = state.currentPlayer;
  const piecesToPlace = { ...state.piecesToPlace };
  piecesToPlace[state.currentPlayer] -= 1;

  const next: GameState = { ...state, board, piecesToPlace };
  if (formsMill(board, point, state.currentPlayer)) {
    return { ...next, pendingCapture: state.currentPlayer };
  }
  return finishTurn(next, false);
}

export function moveCow(state: GameState, move: Move): GameState | null {
  if (state.pendingCapture !== null || isPlacementTurn(state)) return null;
  if (state.board[move.from] !== state.currentPlayer || state.board[move.to] !== null) {
    return null;
  }

  const legal = getLegalMoves(state).some(
    (candidate) => candidate.from === move.from && candidate.to === move.to,
  );
  if (!legal) return null;

  const board = [...state.board];
  board[move.from] = null;
  board[move.to] = state.currentPlayer;
  const next: GameState = { ...state, board };
  if (formsMill(board, move.to, state.currentPlayer)) {
    return { ...next, pendingCapture: state.currentPlayer };
  }
  return finishTurn(next, false);
}

export function captureCow(state: GameState, point: number): GameState | null {
  if (state.pendingCapture === null) return null;
  if (!getCaptureTargets(state.board, state.pendingCapture).includes(point)) return null;

  const board = [...state.board];
  board[point] = null;
  return finishTurn({ ...state, board }, true);
}
