import { useEffect, useState } from "react";
import { Board, Mark, calculateResult, emptyBoard } from "./logic";
import { Difficulty, getChaosMove } from "./ai";
import "./OrderAndChaos.css";

type Mode = "friend" | "computer";
type Role = "order" | "chaos";

const COMPUTER_ROLE: Role = "chaos";
const AI_MOVE_DELAY_MS = 400;

export function OrderAndChaos() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [role, setRole] = useState<Role>("order");
  const [selectedMark, setSelectedMark] = useState<Mark>("X");

  const result = calculateResult(board);
  const gameOver = result !== null;
  const isHumanTurn = mode === "friend" || role !== COMPUTER_ROLE;

  function startGame(nextMode: Mode) {
    setMode(nextMode);
    setBoard(emptyBoard());
    setRole("order");
    setSelectedMark("X");
  }

  function placeAt(index: number) {
    if (gameOver || board[index] !== null || !isHumanTurn) return;

    const next = [...board];
    next[index] = selectedMark;
    setBoard(next);
    setRole(role === "order" ? "chaos" : "order");
  }

  useEffect(() => {
    if (mode !== "computer" || gameOver || role !== COMPUTER_ROLE) return;

    const timer = window.setTimeout(() => {
      const move = getChaosMove(board, difficulty);
      const next = [...board];
      next[move.index] = move.mark;
      setBoard(next);
      setRole("order");
    }, AI_MOVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [board, role, mode, gameOver, difficulty]);

  function reset() {
    setBoard(emptyBoard());
    setRole("order");
    setSelectedMark("X");
  }

  if (mode === null) {
    return (
      <div className="oac-setup">
        <h2>Order and Chaos</h2>
        <p className="oac-blurb">
          Order wants five matching marks in a row, anywhere on the board.
          Chaos wins by filling the board without that happening. Every
          turn, either player may place an X or an O in any empty square —
          the marks aren't tied to a side.
        </p>
        <button onClick={() => startGame("friend")}>Play a Friend</button>
        <div className="oac-computer-setup">
          <button onClick={() => startGame("computer")}>
            Play the Computer
          </button>
          <p className="oac-computer-note">You play Order, going first.</p>
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
          : `${role === "order" ? "Order" : "Chaos"}'s turn`}
      </p>
      {isHumanTurn && !gameOver && (
        <div className="oac-mark-picker">
          <span>Place:</span>
          {(["X", "O"] as Mark[]).map((mark) => (
            <label key={mark}>
              <input
                type="radio"
                name="mark"
                value={mark}
                checked={selectedMark === mark}
                onChange={() => setSelectedMark(mark)}
              />
              {mark}
            </label>
          ))}
        </div>
      )}
      <div className="oac-board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`oac-cell ${result?.line?.includes(i) ? "oac-cell-win" : ""}`}
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
