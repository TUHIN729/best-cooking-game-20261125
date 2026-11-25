# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/TUHIN729/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/TUHIN729/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Ember Kitchen — Midnight Ramen Rush** is a complete, original timed cooking game that runs offline in a desktop browser from static files. You are the only chef in a tiny lantern-lit kitchen on the busiest night of the year: tickets land on the order board, patience drains, and only you can turn raw ingredients into dishes worth serving. Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## How to play

- **Move** with WASD or the arrow keys — or click anywhere to walk there.
- **Grab ingredients** from the pantry on the left wall: click one, or press keys 1–6 near the pantry.
- **Chop** eggs and greens on the chop board; **cook** noodles and rice on the stove and mackerel on the grill. Food left on the heat too long burns — bin it and start over.
- **Plate** finished items on the plating counter. When the plate matches a ticket exactly, it glows green: **READY TO SERVE**.
- **Ring the bell** at the serve window (or press E there) to serve the dish. Serve while patience is high for a tip, and chain serves for a combo bonus.
- **Win the shift** by earning 120 coins in 3 minutes. Three walked-out customers end the shift early.

Six original recipes — Lantern Ramen, Grilled Mackerel Set, Ember Stir-Fry, Chili Noodles, Golden Omelette, Midnight Rice Bowl — combine the same six ingredients in different ways, so every ticket pushes a different route through the kitchen. Orders arrive faster as the shift goes on, and the last 30 seconds are a full rush.

All art is drawn in code and all sound is synthesized with WebAudio — the game loads no network resources at all.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Or serve `game/` with any static file server and open `game/index.html`.

## Files

- `game/` — the playable game (vanilla JS, no libraries): `index.html` plus `src/config.js`, `src/input.js`, `src/world.js`, `src/render.js`, `src/audio.js`, `src/shots.js`, `src/main.js`
- `screenshots/` — real renders of the game taken in headless Chromium
- `main.ts` — the make.fun hand-in program (Node 22, standard library only)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

---

<sub>Entered on [make.fun](https://make.fun/?ref=ecdsgx0z&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
