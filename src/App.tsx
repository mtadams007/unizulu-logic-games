import { useState } from "react";
import { games } from "./games/registry";
import "./App.css";

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = games.find((game) => game.id === selectedId) ?? null;

  if (selected) {
    const GameComponent = selected.Component;
    return (
      <main className="container">
        <button className="home-button" onClick={() => setSelectedId(null)}>
          ← Games
        </button>
        <GameComponent />
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Unizulu Logic Games</h1>
      <div className="game-list">
        {games.map((game) => (
          <button
            key={game.id}
            className="game-card"
            onClick={() => setSelectedId(game.id)}
          >
            <h2>{game.name}</h2>
            <p>{game.description}</p>
          </button>
        ))}
      </div>
    </main>
  );
}

export default App;
