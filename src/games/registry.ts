import type { GameDefinition } from "./types";
import { TicTacToe } from "./tic-tac-toe/TicTacToe";
import { OrderAndChaos } from "./order-and-chaos/OrderAndChaos";

export const games: GameDefinition[] = [
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "Get three in a row before your opponent does.",
    Component: TicTacToe,
  },
  {
    id: "order-and-chaos",
    name: "Order and Chaos",
    description: "A 6x6 battle to make (or prevent) five in a row.",
    Component: OrderAndChaos,
  },
];
