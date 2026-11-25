// Taco Fiesta Rush — boot and the one loop.
// Screens: title, play, paused, game over. Input is read every frame, the
// world advances in fixed 1/60 s steps, the 3D renderer paints what is there.
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, INGREDIENTS, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld, EVENT_SERVED, EVENT_EXPIRED, EVENT_OVER, EVENT_WRONG,
  EVENT_COOKED, EVENT_CHOPPED, EVENT_PLATED, EVENT_LEVELUP, EVENT_BURNT,
  EVENT_FIESTA, EVENT_BOSS, EVENT_PERFECT, EVENT_STALE, EVENT_TIMING, EVENT_SLOW,
  STATION_CHOP, STATION_WOK, STATION_GRILL, STATION_PLATE, STATION_TRASH,
} from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_MUTE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { createAudio } from './audio.js';

const MAX_FRAME = 0.25;

/** Bin keyboard index: Digit1-9 -> 0-8, Digit0 -> 9, Q -> 10, E -> 11, R -> 12,
 *  A -> 13, S -> 14, D -> 15, F -> 16. */
function binIndex(code) {
  const digit = /^Digit([1-9])$/.exec(code);
  if (digit) return Number(digit[1]) - 1;
  if (code === 'Digit0') return 9;
  if (code === 'KeyQ') return 10;
  if (code === 'KeyE') return 11;
  if (code === 'KeyR') return 12;
  if (code === 'KeyA') return 13;
  if (code === 'KeyS') return 14;
  if (code === 'KeyD') return 15;
  if (code === 'KeyF') return 16;
  return -1;
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
let lastCombo = 0;
// Ultra HD split: staged screenshots render at 3x supersampling with soft
// shadows for maximum sharpness; live play uses 1x so software GL stays smooth.
const renderer = createRenderer(canvas, shot ? { ss: 3 } : { ss: 1 });
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}

function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode */ }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  let t = 0.6;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, t);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let time = 0;

  function announce(message) { status.textContent = message; }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Main! Ambil bahan, masak, sajikan sebelum pelanggan kabur.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    audio.stopSizzle();
    if (world.state.score > best) { best = world.state.score; saveBest(best); }
    announce(`Selesai. Skor ${world.state.score}. Terbaik ${best}.`);
  }

  function react(events) {
    if (events & EVENT_SERVED) { audio.ding(); }
    else if (events & EVENT_WRONG) { audio.buzz(); }
    else if (events & EVENT_COOKED) { audio.stopSizzle(); audio.plate(); }
    else if (events & EVENT_CHOPPED) { audio.chop(); }
    else if (events & EVENT_PLATED) { audio.plate(); }
    if (events & EVENT_LEVELUP) { audio.levelup(); }
    if (events & EVENT_BURNT) { audio.stopSizzle(); audio.buzz(); }
    if (events & EVENT_EXPIRED) { audio.buzz(); }
    if (events & EVENT_FIESTA) { audio.taiko(); }
    if (events & EVENT_BOSS) { audio.fanfare(); }
    if (events & EVENT_PERFECT) { audio.perfect(); }
    if (events & EVENT_STALE) { audio.buzz(); }
    if (events & EVENT_SLOW) { audio.slow(); }
    if (events & EVENT_OVER) endGame();
  }

  /** Use a station: a finished job is collected, otherwise the hand is used. */
  function useStation(kind) {
    const s = world.state;
    if (s.station.kind === kind && s.station.progress >= s.station.total) {
      react(world.collectStation());
      return;
    }
    const ev = world.useStation(kind);
    if (ev === 0) {
      if (kind === STATION_WOK || kind === STATION_GRILL) audio.startSizzle();
      else audio.pop();
    } else if (ev & EVENT_TIMING) {
      // Perfect Cook timing attempt: PERFECT plays the golden arpeggio via
      // react(); a MISS buzzes; GOOD just pops.
      if (world.state.timing.last === 'MISS') audio.buzz();
      else if (world.state.timing.last === 'GOOD') audio.plate();
      react(ev);
      return;
    } else if (ev !== EVENT_PLATED) {
      audio.buzz();
    }
    react(ev);
  }

  /** One click in normalised device coordinates, raycast by the renderer. */
  function handleClick(ndc) {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) { startGame(); return; }
    if (screen !== SCREEN_PLAY) return;
    const action = renderer.pick(ndc.x, ndc.y);
    if (!action) return;
    if (action.type === 'bin') {
      const ev = world.pickIngredient(action.id);
      if (ev === 0) audio.pop(); else audio.buzz();
      return;
    }
    if (action.type === 'station') useStation(action.kind);
  }

  function handleKeys() {
    for (const code of input.takeKeys()) {
      if (screen !== SCREEN_PLAY) continue;
      // Slow Time power-up (X): earned by perfect serves.
      if (code === 'KeyX') {
        const ev = world.useSlowTime();
        if (ev === 0 || (ev & EVENT_WRONG)) audio.buzz();
        else react(ev);
        continue;
      }
      const idx = binIndex(code);
      if (idx >= 0 && idx < INGREDIENTS.length) {
        const ev = world.pickIngredient(INGREDIENTS[idx].id);
        if (ev === 0) audio.pop(); else audio.buzz();
        continue;
      }
      const station = { KeyC: STATION_CHOP, KeyW: STATION_WOK, KeyG: STATION_GRILL, KeyP: STATION_PLATE, KeyT: STATION_TRASH }[code];
      if (!station) continue;
      useStation(station);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      audio.setMuted(!audio.isMuted());
      announce(audio.isMuted() ? 'Suara mati.' : 'Suara hidup.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED; audio.stopSizzle(); announce('Jeda.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY; announce('Lanjut main.');
    }
  }

  // Order tickets are DOM: clicking one serves the ready plate to it.
  document.getElementById('orders').addEventListener('click', (event) => {
    const ticket = event.target.closest('.ticket[data-order]');
    if (!ticket || screen !== SCREEN_PLAY) return;
    react(world.serveOrder(Number(ticket.dataset.order)));
  });
  // Overlays: click to start / resume.
  for (const id of ['ov-title', 'ov-pause', 'ov-over']) {
    document.getElementById(id).addEventListener('click', () => {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else if (screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Lanjut main.'); }
    });
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    time += dt;
    handleActions();
    handleKeys();
    for (const click of input.takeClicks()) handleClick(click);
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        react(world.step(STEP));
        accumulator -= STEP;
        if (screen !== SCREEN_PLAY) break;
      }
      // Combo tension sting: once per combo step at x4 and above.
      if (world.state.combo >= 4 && world.state.combo !== lastCombo) {
        lastCombo = world.state.combo;
        audio.tension();
      } else if (world.state.combo < 4) lastCombo = world.state.combo;
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, time);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopSizzle();
      announce('Jeda.');
    }
  });

  announce('Taco Fiesta Rush. Klik atau tekan Spasi untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
