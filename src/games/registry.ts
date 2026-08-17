import type { GameDefinition } from "./types";
import { TicTacToe } from "./tic-tac-toe/TicTacToe";

export const games: GameDefinition[] = [
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "Get three in a row before your opponent does.",
    Component: TicTacToe,
  },
];
