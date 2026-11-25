# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/bro-jack/taco-fiesta-rush/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/bro-jack/taco-fiesta-rush/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Taco Fiesta Rush** — a 3D cooking game set in a colourful Mexican taqueria at desert sunset. 16 Mexican dishes across 3 levels in one 3-minute shift: Buka Taqueria, Jam Makan Siang, Fiesta Rush — with VIP customers, burning food, combos and tips. Cook Tacos al Pastor, Burrito Carne Asada, Quesadilla, Nachos Supreme, Elote, Churros, Tamales, Enchiladas Rojas, Guacamole, Tacos Pescado, Sopa de Tortilla, Flan, Agua Fresca, Margarita Mocktail, Salsa Verde and Fajitas before your customers walk out. Rendered in real-time 3D (Three.js, vendored locally) with papel picado, cacti, fireworks, a desert sunset and four customers who walk in from the street, eat at the counter and leave.

What makes it wilder: a **Fiesta Rush** wave every 45 seconds (orders spawn 2x fast for 15 s), a once-per-shift boss VIP **El Jefe** who orders the 4-ingredient Fiesta Grande and pays 3x, a **combo multiplier up to x5** with a fire meter, ingredients that go **stale** in your hand after 12 seconds, and a **tip jar** that fills up on perfect serves. Screenshots are ultra HD (3x supersampled at 1280×720).

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Click ingredients on the counter (or press 1–9, 0, Q, E, R, A, S, D, F), use the stations (talenan to slice, panci to cook, comal to grill tortillas, piring to assemble), then serve the ready plate to the matching order. In Fiesta Rush a panci/comal job left too long burns — trash it. VIP customers pay 1.5x but run out of patience faster. Keyboard: 1–9, 0, Q, E, R, A, S, D, F ingredients, C chop, W panci, G comal, P plate, T trash, Space start, Esc pause, M mute.

## What is in here

- `main.ts` — Node 22, standard library only. Copies `game/` and `screenshots/` to `/output`, writes `/output/dossier.json`.
- `game/` — static 3D game, no network at runtime: `index.html` + ES modules under `game/src/` (config, world, render, input, audio, shots, main) and Three.js r160 vendored under `game/vendor/three.module.min.js`.
- `vendor/makefun-game.ts` — kit vendored file, used by `main.ts` for the dossier.
- `screenshots/` — 1-play.jpg, 2-serve.jpg, 3-start.jpg, 4-end.jpg (1280×720, real renders of the game's own code, ultra HD 3x supersampled).

---

<sub>Entered on [make.fun](https://make.fun/?ref=7xkxffzs&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
