import { useEffect, useState } from "react";
import { Board, Mark, calculateResult, emptyBoard } from "./logic";
import { Difficulty, getChaosMove, getOrderMove } from "./ai";
import "./OrderAndChaos.css";

type Mode = "friend" | "computer";
type Role = "order" | "chaos";

const AI_MOVE_DELAY_MS = 600;
const HIGHLIGHT_DURATION_MS = 1000;

export function OrderAndChaos() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [humanRole, setHumanRole] = useState<Role>("order");
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [currentRole, setCurrentRole] = useState<Role>("order");
  const [selectedMark, setSelectedMark] = useState<Mark>("X");
  const [highlightedCell, setHighlightedCell] = useState<number | null>(null);

  const result = calculateResult(board);
  const gameOver = result !== null;
  const isHumanTurn = mode === "friend" || currentRole === humanRole;

  function startGame(nextMode: Mode, role?: Role) {
    setMode(nextMode);
    setBoard(emptyBoard());
    setCurrentRole("order");
    setHumanRole(role || "order");
    setSelectedMark("X");
  }

  function placeAt(index: number) {
    if (gameOver || board[index] !== null || !isHumanTurn) return;

    const next = [...board];
    next[index] = selectedMark;
    setBoard(next);
    setCurrentRole(currentRole === "order" ? "chaos" : "order");
  }

  useEffect(() => {
    if (mode !== "computer" || gameOver || currentRole === humanRole) return;

    const timer = window.setTimeout(() => {
      const computerRole = humanRole === "order" ? "chaos" : "order";
      const move =
        computerRole === "chaos"
          ? getChaosMove(board, difficulty)
          : getOrderMove(board, difficulty);

      const next = [...board];
      next[move.index] = move.mark;
      setBoard(next);
      setHighlightedCell(move.index);
      setCurrentRole(currentRole === "order" ? "chaos" : "order");

      const highlightTimer = window.setTimeout(() => {
        setHighlightedCell(null);
      }, HIGHLIGHT_DURATION_MS);

      return () => window.clearTimeout(highlightTimer);
    }, AI_MOVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [board, currentRole, mode, gameOver, difficulty, humanRole]);

  function reset() {
    setBoard(emptyBoard());
    setCurrentRole("order");
    setSelectedMark("X");
  }

  if (mode === null) {
    return (
      <div className="oac-setup">
        <h2>Order and Chaos</h2>
        <p className="oac-blurb">
          Order wants five matching marks in a row, anywhere on the board. Chaos
          wins by filling the board without that happening. Every turn, either
          player may place an X or an O in any empty square — the marks aren't
          tied to a side.
        </p>
        <button onClick={() => startGame("friend")}>Play a Friend</button>
        <div className="oac-computer-setup">
          <div className="oac-role-picker">
            <p>Play the Computer as:</p>
            {(["order", "chaos"] as Role[]).map((role) => (
              <label key={role}>
                <input
                  type="radio"
                  name="playerRole"
                  value={role}
                  checked={humanRole === role}
                  onChange={() => setHumanRole(role)}
                />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </label>
            ))}
          </div>
          <button onClick={() => startGame("computer", humanRole)}>
            Start Game
          </button>
          <p className="oac-computer-note">
            {humanRole === "order" ? "You go first." : "Computer goes first."}
          </p>
          <div className="oac-difficulty">
            {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
              <label key={level}>
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={() => setDifficulty(level)}
                />
                {level}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="oac-game">
      <h2>Order and Chaos</h2>
      <p className="oac-status">
        {result
          ? result.winner === "order"
            ? "Order wins!"
            : "Chaos wins!"
          : `${currentRole === "order" ? "Order" : "Chaos"}'s turn`}
      </p>
      <div
        className="oac-mark-picker"
        style={{
          opacity: isHumanTurn && !gameOver ? 1 : 0.3,
          pointerEvents: isHumanTurn && !gameOver ? "auto" : "none",
        }}
      >
        <span>Place:</span>
        {(["X", "O"] as Mark[]).map((mark) => (
          <label key={mark}>
            <input
              type="radio"
              name="mark"
              value={mark}
              checked={selectedMark === mark}
              onChange={() => setSelectedMark(mark)}
              disabled={!isHumanTurn || gameOver}
            />
            {mark}
          </label>
        ))}
      </div>
      <div className="oac-board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`oac-cell ${result?.line?.includes(i) ? "oac-cell-win" : ""} ${highlightedCell === i ? "oac-cell-highlight" : ""}`}
            style={{
              color:
                cell === "X" ? "#e74c3c" : cell === "O" ? "#3498db" : "inherit",
            }}
            onClick={() => placeAt(i)}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="oac-controls">
        <button onClick={reset}>Play Again</button>
        <button onClick={() => setMode(null)}>Change Mode</button>
      </div>
    </div>
  );
}
