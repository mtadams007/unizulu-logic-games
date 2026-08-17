# Unizulu Logic Games — context for Claude Code

This project was started in a different Claude session (chat, not this
editor). This file hands off that context so a Claude Code session in
VS Code can pick up development without re-deriving the decisions below.

## What this app does

A desktop app bundling several simple two-player logic/strategy games.
Each game can be played two ways: **local hotseat** (two people sharing
one keyboard/screen — no networking, no accounts, nothing online at all)
or **against a computer opponent** with a selectable difficulty (Easy /
Medium / Hard). Explicitly desktop-only, not mobile — no responsive/touch
design work has been done and none is planned.

Games so far: **Tic-Tac-Toe** and **Order and Chaos**. **Nim** is the
planned third game (see "What's left" below).

## Stack

- **Tauri 2** (Rust) wrapping a **Vite + React + TypeScript** SPA — chosen
  over Electron specifically to avoid bundling a full Chromium; it uses
  the OS's native webview instead. This means a real (if small) Rust
  toolchain is part of the build.
- Scaffolded via `create-tauri-app` with the `react-ts` template.
- No backend, no database, no auth — everything is local, in-memory
  component state. There is no persistence between app launches yet
  (closing the app forgets the current game).

## Local development

```bash
npm install
npm run dev          # Vite only, opens in a browser at localhost:1420
npm run tauri dev    # full native app window (first run compiles Rust,
                      # ~3-4 min; subsequent runs are much faster/cached)
```

Rust/Cargo must be installed (`rustup`) for `tauri dev` or `tauri build`
to work — it was installed fresh on this machine during initial
development. If working on a different machine, install via
https://rustup.rs first.

```bash
npm run build         # tsc + vite build, output to dist/
npm run tauri build    # produces an actual installable desktop app bundle
```

## Repo

- GitHub: `github.com/mtadams007/unizulu-logic-games`, branch `main`.
- Pushed via SSH (`git@github.com:...`), not HTTPS.
- **As of this handoff, the Order and Chaos game (see below) is built,
  type-checked, and manually verified in the app, but not yet committed
  or pushed** — only the original shell + Tic-Tac-Toe scaffold commit is
  on `main`. Check `git status` before assuming the working tree matches
  GitHub.

## Architecture pattern (established, follow it for new games)

```
src/
  App.tsx                     # shell: game picker <-> selected game view,
                                # plain useState, no router
  games/
    types.ts                   # GameDefinition interface (id, name,
                                 # description, Component)
    registry.ts                 # array of GameDefinition — add new games
                                  # here to make them appear in the picker
    tic-tac-toe/
      logic.ts                    # pure game rules: board type, win
                                    # detection, no React/UI code
      ai.ts                        # pure AI move selection, one function
                                     # per difficulty tier
      TicTacToe.tsx                 # component: mode/difficulty setup
                                      # screen -> board -> game-over state
      TicTacToe.css
    order-and-chaos/
      logic.ts / ai.ts / OrderAndChaos.tsx / OrderAndChaos.css
        # same shape as tic-tac-toe
```

**No shared base class or inheritance between games.** The old 2018
reference project (see below) chained `Game` → `XOGame` →
`TicTacToeGame`/`OrderAndChaosGame` via class inheritance, which made it
hard to follow and hard to change one game without risking another. This
rewrite deliberately keeps each game's folder self-contained — some
duplication between games (e.g. the setup-screen JSX shape) is accepted
as the cost of that isolation, not something to abstract away
prematurely. Only extract a shared helper if a third game makes the
duplication actually painful, not preemptively.

**AI difficulty pattern**, reused per game:
- **Easy** — a fully random legal move.
- **Medium** — a simple heuristic (e.g. "block an immediate win, else
  random").
- **Hard** — the strongest heuristic that's actually feasible for that
  game's search space. For small solved games (Tic-Tac-Toe) this is
  exhaustive minimax and is genuinely unbeatable — verified by simulating
  500 games where Hard never lost, and Hard-vs-Hard always drew (the
  mathematically correct result). For bigger boards where exhaustive
  search isn't practical (Order and Chaos's 6x6 board), Hard is a
  heuristic scoring function instead (minimize/maximize a "danger score"
  across all win-lines) — strong, but not literally unbeatable. **Be
  upfront about this distinction if it comes up** — a human was
  explicitly told Hard means "strong" not "perfect" for the
  non-exhaustive games, and that promise should hold for future games
  too (Nim, unlike Order and Chaos, actually *is* small enough to solve
  exactly — it has a closed-form perfect-play rule via the nim-sum/XOR of
  pile sizes, so Nim's Hard mode should be genuinely unbeatable like
  Tic-Tac-Toe's).

**Verifying new game logic:** for each game built so far, correctness was
checked two ways before calling it done: (1) manually playing it in the
running app (browser preview and/or the native Tauri window), and (2) a
throwaway simulation script (`<game>/verify-ai.scratch.ts`, run via
`npx tsx path/to/script.ts`, then deleted — never committed) that plays
hundreds of AI-vs-AI or AI-vs-random games and checks win rates / invalid
moves. Follow the same pattern for Nim: a script computing the nim-sum
rule can be checked against known correct Nim strategy easily.

## Order and Chaos rules (for reference — this is a real published game,
not invented for this project)

- 6x6 board. Two roles: **Order** and **Chaos** (not tied to X/O).
- Every turn, **whichever player's turn it is chooses to place either an
  X or an O** in any empty cell — the marks are not owned by a side.
- **Order** wins immediately if five matching marks ever line up in a row
  (horizontal, vertical, or diagonal), by either player, at any point in
  the game.
- **Chaos** wins if the board fills completely (all 36 cells) without
  that ever happening.
- Order always moves first. In "vs computer" mode, the human is always
  Order and the computer is always Chaos (matches the original reference
  app's design — there's no "computer plays Order" mode).

## Reference material: the old 2018 repo

`github.com/mtadams007/UnizuluGames` — a Create React App project from
2018 (class components, pre-hooks React, deprecated CRA tooling) built
for a different purpose (a South African science-outreach program, hence
bilingual English/Zulu rules text). **Explicitly not reused as code** —
its inheritance-heavy architecture and direct-DOM-manipulation win
highlighting were judged more expensive to untangle than to rewrite. But
it's a source of:
- The **game roster** — it had Tic-Tac-Toe, Order and Chaos, and **Nim**,
  which is why Nim is next.
- **AI heuristic logic** worth reading before reimplementing Nim's AI
  (`src/Games/NimGame/NimGame.js` in that repo) — though note its README
  admits the Nim AI was unfinished/imperfect, so treat it as a rough
  reference, not a spec to copy exactly.
- **Bilingual rules text** (`src/Utils/Descriptions.js` in that repo) —
  not yet ported into this project; this app currently has no
  localization at all. Whether to port the Zulu text hasn't been decided
  — ask before assuming it should carry over, since this app's audience
  isn't necessarily the same as the original's.

## What's left / not yet done

- **Nim** — third game, not started.
- **No app icon/branding** beyond the Tauri template defaults.
- **No persistence** — game state resets on app restart; no "resume last
  game" or stats tracking.
- **No packaged build tested** — only `tauri dev` has been run, never
  `tauri build` (the actual installable app bundle). Worth doing before
  considering this shareable with anyone else.
- Order and Chaos is uncommitted (see "Repo" above) — check with the user
  before assuming it's safe to build on top of without committing first,
  since they've asked to approve commits explicitly each time so far
  rather than have them happen automatically.
