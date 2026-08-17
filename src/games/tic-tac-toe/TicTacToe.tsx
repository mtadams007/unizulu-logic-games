import { useEffect, useState } from "react";
import {
  Board,
  Player,
  calculateWinner,
  emptyBoard,
  isDraw,
  otherPlayer,
} from "./logic";
import { Difficulty, getAiMove } from "./ai";
import "./TicTacToe.css";

type Mode = "friend" | "computer";

const AI_PLAYER: Player = "O";
const AI_MOVE_DELAY_MS = 300;

export function TicTacToe() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [board, setBoard] = useState<Board>(emptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");

  const result = calculateWinner(board);
  const draw = isDraw(board);
  const gameOver = result !== null || draw;

  function startGame(nextMode: Mode) {
    setMode(nextMode);
    setBoard(emptyBoard());
    setCurrentPlayer("X");
  }

  function playAt(index: number) {
    if (gameOver || board[index] !== null) return;
    if (mode === "computer" && currentPlayer === AI_PLAYER) return;

    const next = [...board];
    next[index] = currentPlayer;
    setBoard(next);
    setCurrentPlayer(otherPlayer(currentPlayer));
  }

  useEffect(() => {
    if (mode !== "computer" || gameOver || currentPlayer !== AI_PLAYER) return;

    const timer = window.setTimeout(() => {
      const move = getAiMove(board, AI_PLAYER, difficulty);
      const next = [...board];
      next[move] = AI_PLAYER;
      setBoard(next);
      setCurrentPlayer(otherPlayer(AI_PLAYER));
    }, AI_MOVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [board, currentPlayer, mode, gameOver, difficulty]);

  function reset() {
    setBoard(emptyBoard());
    setCurrentPlayer("X");
  }

  if (mode === null) {
    return (
      <div className="ttt-setup">
        <h2>Tic-Tac-Toe</h2>
        <button onClick={() => startGame("friend")}>Play a Friend</button>
        <div className="ttt-computer-setup">
          <button onClick={() => startGame("computer")}>
            Play the Computer
          </button>
          <div className="ttt-difficulty">
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
    <div className="ttt-game">
      <h2>Tic-Tac-Toe</h2>
      <p className="ttt-status">
        {result
          ? `${result.winner} wins!`
          : draw
            ? "Tie game"
            : `${currentPlayer}'s turn`}
      </p>
      <div className="ttt-board">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${result?.line.includes(i) ? "ttt-cell-win" : ""}`}
            style={{
              color:
                cell === "X" ? "#e74c3c" : cell === "O" ? "#3498db" : "inherit",
            }}
            onClick={() => playAt(i)}
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="ttt-controls">
        <button onClick={reset}>Play Again</button>
        <button onClick={() => setMode(null)}>Change Mode</button>
      </div>
    </div>
  );
}
