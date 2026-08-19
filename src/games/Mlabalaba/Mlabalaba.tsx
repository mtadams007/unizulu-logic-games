import { useEffect, useState } from "react";
import {
  POINTS,
  GameState,
  captureCow,
  emptyGameState,
  getCaptureTargets,
  getLegalMoves,
  getWinner,
  isDraw,
  isPlacementTurn,
  moveCow,
  placeCow,
} from "./logic";
import { Difficulty, getAiAction } from "./ai";
import { MILLS } from "./logic";
import "./Mlabalaba.css";

type Mode = "friend" | "computer";

const AI_PLAYER = "O" as const;
const AI_MOVE_DELAY_MS = 450;

const BOARD_LINES = MILLS.flatMap(([a, b, c]) => [
  [a, b],
  [b, c],
]);

export function Mlabalaba() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameState, setGameState] = useState<GameState>(emptyGameState());
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);

  const winner = getWinner(gameState);
  const draw = isDraw(gameState);
  const gameOver = winner !== null || draw;
  const isHumanTurn = mode === "friend" || gameState.currentPlayer !== AI_PLAYER;

  function startGame(nextMode: Mode) {
    setMode(nextMode);
    setGameState(emptyGameState());
    setSelectedFrom(null);
  }

  function handlePoint(point: number) {
    if (gameOver || !isHumanTurn) return;

    if (gameState.pendingCapture !== null) {
      const next = captureCow(gameState, point);
      if (next) setGameState(next);
      return;
    }

    if (isPlacementTurn(gameState)) {
      const next = placeCow(gameState, point);
      if (next) setGameState(next);
      return;
    }

    if (selectedFrom === null) {
      if (gameState.board[point] === gameState.currentPlayer) {
        setSelectedFrom(point);
      }
      return;
    }

    if (point === selectedFrom) {
      setSelectedFrom(null);
      return;
    }

    const next = moveCow(gameState, { from: selectedFrom, to: point });
    if (next) {
      setGameState(next);
      setSelectedFrom(null);
    } else if (gameState.board[point] === gameState.currentPlayer) {
      setSelectedFrom(point);
    }
  }

  useEffect(() => {
    if (mode !== "computer" || gameOver || gameState.currentPlayer !== AI_PLAYER) {
      return;
    }

    const timer = window.setTimeout(() => {
      const action = getAiAction(gameState, difficulty);
      if (!action) return;

      const next = action.type === "place"
        ? placeCow(gameState, action.point)
        : action.type === "move"
          ? moveCow(gameState, action.move)
          : captureCow(gameState, action.point);
      if (next) setGameState(next);
    }, AI_MOVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [difficulty, gameOver, gameState, mode]);

  function reset() {
    setGameState(emptyGameState());
    setSelectedFrom(null);
  }

  function isPointTarget(point: number): boolean {
    if (gameOver || !isHumanTurn) return false;
    if (gameState.pendingCapture !== null) {
      return getCaptureTargets(gameState.board, gameState.pendingCapture).includes(point);
    }
    if (isPlacementTurn(gameState)) return gameState.board[point] === null;
    if (selectedFrom === null) return gameState.board[point] === gameState.currentPlayer;
    return getLegalMoves(gameState).some(
      (move) => move.from === selectedFrom && move.to === point,
    );
  }

  function statusText(): string {
    if (winner) return `${winner} wins!`;
    if (draw) return "Draw: no capture in ten moves";
    if (gameState.pendingCapture !== null) {
      return `${gameState.currentPlayer}, choose a cow to shoot`;
    }
    if (isPlacementTurn(gameState)) {
      return `${gameState.currentPlayer}'s turn: place a cow`;
    }
    if (selectedFrom !== null) return "Choose an empty destination";
    return `${gameState.currentPlayer}'s turn: select a cow`;
  }

  if (mode === null) {
    return (
      <div className="Mlabalaba-setup">
        <h2>Mlabalaba</h2>
        <p className="Mlabalaba-blurb">
          Place and move your twelve cows to form mills of three. A mill lets
          you shoot an opponent's cow.
        </p>
        <button onClick={() => startGame("friend")}>Play a Friend</button>
        <div className="Mlabalaba-computer-setup">
          <button onClick={() => startGame("computer")}>Play the Computer</button>
          <div className="Mlabalaba-difficulty">
            {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
              <label key={level}>
                <input
                  type="radio"
                  name="Mlabalaba-difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={() => setDifficulty(level)}
                />
                {level}
              </label>
            ))}
          </div>
        </div>
        <p className="Mlabalaba-note">X moves first. Three cows can fly to any empty point.</p>
      </div>
    );
  }

  return (
    <div className="Mlabalaba-game">
      <div className="Mlabalaba-header">
        <h2>Mlabalaba</h2>
        <p className="Mlabalaba-status">{statusText()}</p>
        {mode === "computer" && gameState.currentPlayer === AI_PLAYER && !gameOver && (
          <p className="Mlabalaba-thinking">Computer is thinking...</p>
        )}
      </div>

      <div className="Mlabalaba-scoreboard">
        <span className="Mlabalaba-player mark-x">
          X: {gameState.piecesToPlace.X} to place, {gameState.board.filter((cell) => cell === "X").length} on board
        </span>
        <span className="Mlabalaba-player mark-o">
          O: {gameState.piecesToPlace.O} to place, {gameState.board.filter((cell) => cell === "O").length} on board
        </span>
      </div>

      <div className="Mlabalaba-board" role="grid" aria-label="Mlabalaba board">
        <svg className="Mlabalaba-lines" viewBox="0 0 100 100" aria-hidden="true">
          {BOARD_LINES.map(([from, to], index) => (
            <line
              key={index}
              x1={POINTS[from].x}
              y1={POINTS[from].y}
              x2={POINTS[to].x}
              y2={POINTS[to].y}
            />
          ))}
        </svg>
        {POINTS.map((point, index) => {
          const cell = gameState.board[index];
          return (
            <button
              key={index}
              className={`Mlabalaba-point ${
                cell === "X" ? "mark-x" : cell === "O" ? "mark-o" : ""
              } ${selectedFrom === index ? "selected" : ""} ${
                isPointTarget(index) ? "target" : ""
              }`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => handlePoint(index)}
              disabled={!isPointTarget(index) && cell === null}
              aria-label={cell ? `${cell} cow at point ${index + 1}` : `Empty point ${index + 1}`}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <div className="Mlabalaba-controls">
        <button onClick={reset}>Play Again</button>
        <button onClick={() => setMode(null)}>Change Mode</button>
      </div>
    </div>
  );
}
