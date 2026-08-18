import { useEffect, useState } from "react";
import {
  GameState,
  Player,
  emptyGameState,
  makeMove,
  getLegalMoves,
  getGameWinner,
  isDraw,
  otherPlayer,
} from "./logic";
import { Difficulty, getAiMove } from "./ai";
import "./UltimateTicTacToe.css";

type Mode = "friend" | "computer";

const AI_PLAYER: Player = "O";
const AI_MOVE_DELAY_MS = 300;

export function UltimateTicTacToe() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameState, setGameState] = useState<GameState>(emptyGameState());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");

  const winner = getGameWinner(gameState);
  const draw = isDraw(gameState);
  const gameOver = winner !== null || draw;

  function startGame(nextMode: Mode) {
    setMode(nextMode);
    setGameState(emptyGameState());
    setCurrentPlayer("X");
  }

  function playAt(boardIndex: number, cellIndex: number) {
    if (gameOver) return;
    if (mode === "computer" && currentPlayer === AI_PLAYER) return;

    const result = makeMove(gameState, boardIndex, cellIndex, currentPlayer);
    if (result === null) return; // Invalid move

    setGameState(result);
    setCurrentPlayer(otherPlayer(currentPlayer));
  }

  useEffect(() => {
    if (mode !== "computer" || gameOver || currentPlayer !== AI_PLAYER) return;

    const timer = window.setTimeout(() => {
      const move = getAiMove(gameState, AI_PLAYER, difficulty);
      if (move === null) return;

      const result = makeMove(
        gameState,
        move.boardIndex,
        move.cellIndex,
        AI_PLAYER,
      );
      if (result === null) return;

      setGameState(result);
      setCurrentPlayer(otherPlayer(AI_PLAYER));
    }, AI_MOVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [gameState, currentPlayer, mode, gameOver, difficulty]);

  function reset() {
    setGameState(emptyGameState());
    setCurrentPlayer("X");
  }

  if (mode === null) {
    return (
      <div className="uttt-setup">
        <h2>Ultimate Tic-Tac-Toe</h2>
        <button onClick={() => startGame("friend")}>Play a Friend</button>
        <div className="uttt-computer-setup">
          <button onClick={() => startGame("computer")}>
            Play the Computer
          </button>
          <div className="uttt-difficulty">
            {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
              <label key={level}>
                <input
                  type="radio"
                  name="difficulty"
                  value={level}
                  checked={difficulty === level}
                  onChange={() => setDifficulty(level)}
                />
                <span className="capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="uttt-game">
      <div className="uttt-status">
        {gameOver ? (
          winner ? (
            <>
              <h2>🎉 {winner} Wins!</h2>
              <button onClick={reset}>Play Again</button>
            </>
          ) : (
            <>
              <h2>It's a Draw!</h2>
              <button onClick={reset}>Play Again</button>
            </>
          )
        ) : (
          <>
            <h2>Current Player: {currentPlayer}</h2>
            {mode === "computer" && currentPlayer === AI_PLAYER && (
              <p className="ai-thinking">Computer is thinking...</p>
            )}
            <button onClick={() => setMode(null)}>Back to Menu</button>
          </>
        )}
      </div>

      <div className="uttt-meta-board">
        {gameState.boards.map((board, boardIndex) => (
          <div
            key={boardIndex}
            className={`uttt-board ${
              gameState.metaBoard[boardIndex] ? "won" : ""
            } ${
              gameState.validBoardIndices === null ||
              gameState.validBoardIndices.includes(boardIndex)
                ? "active"
                : "inactive"
            }`}
          >
            {gameState.metaBoard[boardIndex] ? (
              <div className="board-winner">
                {gameState.metaBoard[boardIndex]}
              </div>
            ) : (
              <SmallBoard
                board={board}
                boardIndex={boardIndex}
                onPlay={playAt}
                isActive={
                  gameState.validBoardIndices === null ||
                  gameState.validBoardIndices.includes(boardIndex)
                }
                gameOver={gameOver}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface SmallBoardProps {
  board: (string | null)[];
  boardIndex: number;
  onPlay: (boardIndex: number, cellIndex: number) => void;
  isActive: boolean;
  gameOver: boolean;
}

function SmallBoard({
  board,
  boardIndex,
  onPlay,
  isActive,
  gameOver,
}: SmallBoardProps) {
  return (
    <div className="uttt-small-board">
      {board.map((cell, cellIndex) => (
        <button
          key={cellIndex}
          className={`uttt-cell ${cell ? "filled" : ""}`}
          onClick={() => onPlay(boardIndex, cellIndex)}
          disabled={cell !== null || !isActive || gameOver}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}
