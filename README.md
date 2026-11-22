# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/shieui/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/shieui/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Velvet Vault** — a top-down stealth heist at the Marlowe Gallery. You are Wren, a thief with one night, three rooms and three jewels. Cross each gallery past the guards' vision cones and the sweeping cameras, grab the jewel from its case, and slip out the green exit before the alarm meter hits 100. Sneak to stay unseen, dash to cross open floor, and throw a coin to pull a guard away from his post.

## Run it

```sh
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080 in desktop Chrome. No network request, no build step — the game is plain static files.

## Controls

- **WASD / arrows** — move
- **Shift** — sneak (slower, harder to spot)
- **Space** — dash (fast, but noisy)
- **Mouse click** — throw a coin to distract a guard
- **E** (hold) — grab the jewel from its case
- **M** — mute

## How it is built

Vanilla JavaScript and canvas, no libraries: `game/src/config.js` lays out the three rooms, `world.js` simulates guards, cameras, sight and the alarm, `render.js` draws it all, `audio.js` synthesizes every sound with WebAudio, `shots.js` stages the deterministic screenshot scenes, and `main.js` runs the loop. `main.ts` hands the game in with the kit's `vendor/makefun-game.ts` dossier library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=6vamqe3w&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
