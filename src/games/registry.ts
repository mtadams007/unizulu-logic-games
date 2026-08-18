import type { GameDefinition } from "./types";
import { TicTacToe } from "./tic-tac-toe/TicTacToe";
import { OrderAndChaos } from "./order-and-chaos/OrderAndChaos";
import { UltimateTicTacToe } from "./ultimate-tic-tac-toe/UltimateTicTacToe";

export const games: GameDefinition[] = [
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "Get three in a row before your opponent does.",
    Component: TicTacToe,
  },
  {
    id: "ultimate-tic-tac-toe",
    name: "Ultimate Tic-Tac-Toe",
    description: "A 9x9 nested grid—win three small boards in a row to win.",
    Component: UltimateTicTacToe,
  },
  {
    id: "order-and-chaos",
    name: "Order and Chaos",
    description: "A 6x6 battle to make (or prevent) five in a row.",
    Component: OrderAndChaos,
  },
];
