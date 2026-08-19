import {
  Board,
  GameState,
  Move,
  Player,
  MILLS,
  captureCow,
  formsMill,
  getCaptureTargets,
  getEmptyPoints,
  getLegalMoves,
  getPiecesOnBoard,
  isPlacementTurn,
  moveCow,
  otherPlayer,
  placeCow,
} from "./logic";

export type Difficulty = "easy" | "medium" | "hard";

export type AiAction =
  | { type: "place"; point: number }
  | { type: "move"; move: Move }
  | { type: "capture"; point: number };

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function getMoveActions(state: GameState): AiAction[] {
  if (state.pendingCapture !== null) {
    return getCaptureTargets(state.board, state.pendingCapture).map((point) => ({
      type: "capture",
      point,
    }));
  }

  if (isPlacementTurn(state)) {
    return getEmptyPoints(state.board).map((point) => ({ type: "place", point }));
  }

  return getLegalMoves(state).map((move) => ({ type: "move", move }));
}

function applyAction(state: GameState, action: AiAction): GameState | null {
  if (action.type === "place") return placeCow(state, action.point);
  if (action.type === "move") return moveCow(state, action.move);
  return captureCow(state, action.point);
}

function actionCreatesMill(state: GameState, action: AiAction, player: Player): boolean {
  if (action.type === "place") return formsMill(state.board, action.point, player);
  if (action.type === "move") {
    const board = [...state.board];
    board[action.move.from] = null;
    board[action.move.to] = player;
    return formsMill(board, action.move.to, player);
  }
  return false;
}

function captureValue(state: GameState, point: number): number {
  const opponent = otherPlayer(state.currentPlayer);
  const board = [...state.board];
  board[point] = null;
  return getPiecesOnBoard(board, opponent).reduce((score, piece) => {
    return score + (isInPotentialMill(board, piece, opponent) ? 2 : 1);
  }, 0);
}

function isInPotentialMill(board: Board, point: number, player: Player): boolean {
  return MILLS.some((mill) => {
    if (!mill.includes(point)) return false;
    const marks = mill.map((index) => board[index]);
    return marks.filter((mark) => mark === player).length === 2 &&
      marks.filter((mark) => mark === null).length === 1;
  });
}

function chooseMedium(state: GameState, actions: AiAction[]): AiAction {
  if (state.pendingCapture !== null) {
    return actions.reduce((best, action) =>
      action.type === "capture" && best.type === "capture" &&
      captureValue(state, action.point) > captureValue(state, best.point)
        ? action
        : best,
    actions[0]);
  }

  const mill = actions.filter((action) =>
    actionCreatesMill(state, action, state.currentPlayer),
  );
  if (mill.length > 0) return randomItem(mill);

  const opponent = otherPlayer(state.currentPlayer);
  const opponentActions = getMoveActions({ ...state, currentPlayer: opponent });
  const threats = opponentActions.filter((action) =>
    actionCreatesMill(state, action, opponent),
  );
  if (threats.length > 0) {
    const threatPoints = new Set(
      threats.flatMap((action) => {
        if (action.type === "place") return [action.point];
        if (action.type === "move") return [action.move.to];
        return [];
      }),
    );
    const blocks = actions.filter((action) => {
      if (action.type === "place") return threatPoints.has(action.point);
      if (action.type === "move") return threatPoints.has(action.move.to);
      return false;
    });
    if (blocks.length > 0) return randomItem(blocks);
  }

  return randomItem(actions);
}

function boardScore(state: GameState, player: Player): number {
  const opponent = otherPlayer(player);
  let score =
    getPiecesOnBoard(state.board, player).length * 4 -
    getPiecesOnBoard(state.board, opponent).length * 5;

  for (const mill of MILLS) {
    const cells = mill.map((index) => state.board[index]);
    const own = cells.filter((cell) => cell === player).length;
    const enemy = cells.filter((cell) => cell === opponent).length;
    const empty = cells.filter((cell) => cell === null).length;
    if (enemy === 0) score += own === 3 ? 40 : own === 2 && empty === 1 ? 8 : own;
    if (own === 0) score -= enemy === 3 ? 40 : enemy === 2 && empty === 1 ? 8 : enemy;
  }

  score += getLegalMoves(state, player).length;
  score -= getLegalMoves(state, opponent).length;
  return score;
}

function chooseHard(state: GameState, actions: AiAction[]): AiAction {
  let bestScore = -Infinity;
  let bestActions: AiAction[] = [];

  for (const action of actions) {
    const next = applyAction(state, action);
    if (!next) continue;
    const score = action.type === "capture"
      ? captureValue(state, action.point) * 20
      : boardScore(next, state.currentPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestActions = [action];
    } else if (score === bestScore) {
      bestActions.push(action);
    }
  }

  return randomItem(bestActions.length > 0 ? bestActions : actions);
}

export function getAiAction(state: GameState, difficulty: Difficulty): AiAction | null {
  const actions = getMoveActions(state);
  if (actions.length === 0) return null;

  if (difficulty === "easy") return randomItem(actions);
  if (difficulty === "medium") return chooseMedium(state, actions);
  return chooseHard(state, actions);
}
