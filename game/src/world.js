// Taco Fiesta Rush — rules and state, no drawing and no browser in it.
// Orders arrive on the board, the chef picks ingredients from the counter,
// chops / fries / grills them at stations, assembles a dish on the plate and
// serves the matching order before its patience runs out.
// v3 adds: Fiesta Rush waves (2x spawn every 45 s), a once-per-shift boss
// VIP (El Jefe, Fiesta Grande, 4 ingredients, 3x pay), a combo multiplier up
// to x5, ingredients going stale in the hand after 12 s, and a tip jar for
// perfect serves. step() advances one fixed step and returns what happened
// as bit flags.
import {
  CHOP, COOK, GRILL, DISHES, DISH_BY_ID, BOSS_DISH, FIELD, HEARTS,
  LEVELS, LEVEL_AT, BURN_SECONDS, VIP_CHANCE, SHIFT_SECONDS,
  CHOP_SECONDS, COOK_SECONDS, GRILL_SECONDS, ITEM_LABEL,
  FIESTA_EVERY, FIESTA_SECONDS, BOSS_AT, BOSS_PAY, FRESH_SECONDS,
  COMBO_CAP, TIP_RATE, TIMING_SPEED, TIMING_GREEN, TIMING_YELLOW,
  SLOW_SECONDS, SLOW_PERFECTS, SLOW_MAX, LAST_SECOND_FRAC, LAST_SECOND_BONUS,
} from './config.js';

export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_WRONG = 8;
export const EVENT_COOKED = 16;
export const EVENT_CHOPPED = 32;
export const EVENT_PLATED = 64;
export const EVENT_LEVELUP = 128;
export const EVENT_BURNT = 256;
export const EVENT_FIESTA = 512;
export const EVENT_BOSS = 1024;
export const EVENT_PERFECT = 2048;
export const EVENT_STALE = 4096;
export const EVENT_TIMING = 8192;
export const EVENT_SLOW = 16384;

export const STATION_CHOP = 'chop';
export const STATION_WOK = 'wok';
export const STATION_GRILL = 'grill';
export const STATION_PLATE = 'plate';
export const STATION_TRASH = 'trash';

// Rectangles (logical 1280x720) the renderer draws and input hit-tests.
export const STATIONS = {
  [STATION_CHOP]: { x: 330, y: 300, w: 180, h: 120, label: 'TALENAN', sub: 'iris' },
  [STATION_WOK]: { x: 530, y: 300, w: 180, h: 120, label: 'PANCI', sub: 'rebus · masak' },
  [STATION_GRILL]: { x: 730, y: 300, w: 180, h: 120, label: 'COMAL', sub: 'tortilla · fajitas' },
  [STATION_PLATE]: { x: 930, y: 300, w: 180, h: 120, label: 'PIRING', sub: 'rakit hidangan' },
  [STATION_TRASH]: { x: 1130, y: 300, w: 110, h: 120, label: 'SAMPAH', sub: 'buang' },
};

export const ING_BIN = { x: 16, y: 592, w: 92, h: 112, gap: 4 };
export const ORDER_BOARD = { x: 16, y: 76, w: 296, h: 224 };
/** Order ticket geometry inside the board: first ticket offset, row step, height. */
export const ORDER_TICKET = { dy: 36, step: 46, h: 42 };
export const PLATE_SLOT = { x: 930, y: 440, w: 310, h: 90 };

/** Level from elapsed seconds: 1 before 60 s, 2 before 120 s, 3 after. */
export function levelFor(elapsed) {
  if (elapsed >= LEVEL_AT[2]) return 3;
  if (elapsed >= LEVEL_AT[1]) return 2;
  return 1;
}

let orderSeq = 0;

function pickDish(random, level) {
  const pool = LEVELS[level - 1].dishes;
  return DISH_BY_ID[pool[Math.floor(random() * pool.length)]];
}

export function createWorld(random) {
  const state = {
    score: 0,
    coins: 0,
    served: 0,
    wrong: 0,
    hearts: HEARTS,
    combo: 0,
    bestCombo: 0,
    multiplier: 1, // combo fire meter: 1 + floor(combo/3), capped at x5
    tips: 0, // yen earned as tips (perfect serves only)
    perfectServes: 0,
    festivalCount: 0,
    fiesta: { active: false, nextIn: FIESTA_EVERY, left: 0 },
    bossSpawned: false,
    bossServed: false,
    handAt: 0, // elapsed when the current hand item was picked
    handStale: false,
    eatAnim: null, // {face, until} — the customer eating after a serve
    // Perfect Cook timing bar: needle sweeps while a station job cooks.
    timing: { pos: 0, dir: 1, last: null, lastAt: 0 },
    perfectCooks: 0,
    // Slow Time power-up: charges earned by perfect serves, X to activate.
    slowCharges: 0,
    slowReady: 0, // perfect serves counted toward the next charge
    slowTime: 0, // seconds of slow time left
    lastSecondSaves: 0,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnTimer: 4,
    orders: [],
    hand: null, // ingredient/item id in the chef's hand
    plate: [], // item ids on the plate
    plateReady: null, // dish id when the plate matches a recipe
    station: { kind: null, progress: 0, total: 0, input: null, result: null },
    chefX: 640,
    chefTargetX: 640,
    floaters: [], // {x,y,text,color,life}
    over: false,
    overReason: '',
    muted: false,
    level: 1,
    levelName: LEVELS[0].name,
    levelBanner: 0,
    levelReached: 1,
    vipServed: 0,
    burnt: 0,
    servedDishes: [],
  };

  function addFloater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1.4 });
    if (state.floaters.length > 8) state.floaters.shift();
  }

  function spawnOrder() {
    const lv = LEVELS[state.level - 1];
    if (state.orders.length >= lv.maxOrders) return;
    const dish = pickDish(random, state.level);
    const vip = state.level === 3 && random() < VIP_CHANCE;
    const patience = lv.patience * (vip ? 0.7 : 1);
    orderSeq += 1;
    state.orders.push({
      id: orderSeq,
      dish: dish.id,
      name: dish.name,
      needs: [...dish.needs],
      patience,
      maxPatience: patience,
      face: Math.floor(random() * 4),
      vip,
      boss: false,
    });
  }

  /** Once per shift a gold El Jefe arrives and orders the 4-ingredient
   *  Fiesta Grande: 20 s patience, 3x pay. He takes a bonus board slot. */
  function spawnBoss() {
    state.bossSpawned = true;
    orderSeq += 1;
    state.orders.push({
      id: orderSeq,
      dish: BOSS_DISH.id,
      name: BOSS_DISH.name,
      needs: [...BOSS_DISH.needs],
      patience: 20,
      maxPatience: 20,
      face: Math.floor(random() * 4),
      vip: true,
      boss: true,
    });
    addFloater(640, 170, '★ BOSS VIP: EL JEFE! Fiesta Grande 3x! ★', '#f2c94c');
  }

  function reset() {
    state.score = 0;
    state.coins = 0;
    state.served = 0;
    state.wrong = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.bestCombo = 0;
    state.multiplier = 1;
    state.tips = 0;
    state.perfectServes = 0;
    state.festivalCount = 0;
    state.fiesta = { active: false, nextIn: FIESTA_EVERY, left: 0 };
    state.bossSpawned = false;
    state.bossServed = false;
    state.handAt = 0;
    state.handStale = false;
    state.eatAnim = null;
    state.timing = { pos: 0, dir: 1, last: null, lastAt: 0 };
    state.perfectCooks = 0;
    state.slowCharges = 0;
    state.slowReady = 0;
    state.slowTime = 0;
    state.lastSecondSaves = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.spawnTimer = 4;
    state.orders = [];
    state.hand = null;
    state.plate = [];
    state.plateReady = null;
    state.station = { kind: null, progress: 0, total: 0, input: null, result: null, doneAt: null, burnt: false };
    state.floaters = [];
    state.over = false;
    state.overReason = '';
    state.level = 1;
    state.levelName = LEVELS[0].name;
    state.levelBanner = 0;
    state.levelReached = 1;
    state.vipServed = 0;
    state.burnt = 0;
    state.servedDishes = [];
    spawnOrder();
    spawnOrder();
  }

  function checkPlate() {
    state.plateReady = null;
    const pool = state.plate.length === BOSS_DISH.needs.length ? [...DISHES, BOSS_DISH] : DISHES;
    for (const dish of pool) {
      if (dish.needs.length !== state.plate.length) continue;
      const sortedPlate = [...state.plate].sort();
      const sortedNeeds = [...dish.needs].sort();
      if (sortedPlate.every((v, i) => v === sortedNeeds[i])) {
        state.plateReady = dish.id;
        return;
      }
    }
  }

  /** Pick an ingredient from the counter into the hand. */
  function pickIngredient(id) {
    if (state.over) return 0;
    if (state.hand !== null) return EVENT_WRONG;
    if (state.station.kind !== null) return EVENT_WRONG;
    state.hand = id;
    state.handAt = state.elapsed;
    state.handStale = false;
    return 0;
  }

  /** Use a station with whatever is in the hand. Returns event flags. */
  function useStation(kind) {
    if (state.over) return 0;
    // Perfect Cook: hitting the SAME busy station again while its job cooks
    // resolves the timing bar — green = instant finish, yellow = +50%,
    // outside = -25% progress.
    if (state.station.kind === kind && state.station.progress < state.station.total) {
      const pos = state.timing.pos;
      const t = state.station;
      if (pos >= TIMING_GREEN[0] && pos <= TIMING_GREEN[1]) {
        t.progress = t.total;
        state.perfectCooks += 1;
        state.timing.last = 'PERFECT';
        state.timing.lastAt = state.elapsed;
        addFloater(640, 250, 'PERFECT! Masakan selesai instan!', '#f2c94c');
        return EVENT_TIMING | EVENT_PERFECT;
      }
      if (pos >= TIMING_YELLOW[0] && pos <= TIMING_YELLOW[1]) {
        t.progress = Math.min(t.total, t.progress + (t.total - t.progress) * 0.5);
        state.timing.last = 'GOOD';
        state.timing.lastAt = state.elapsed;
        addFloater(640, 250, 'Bagus! +50% cepat', '#4ade80');
        return EVENT_TIMING;
      }
      t.progress = Math.max(0, t.progress - t.total * 0.25);
      state.timing.last = 'MISS';
      state.timing.lastAt = state.elapsed;
      addFloater(640, 250, 'Melenceng! -25%', '#ff3b5c');
      return EVENT_TIMING;
    }
    if (state.station.kind !== null) return EVENT_WRONG; // busy: collect first
    const hand = state.hand;
    if (kind === STATION_TRASH) {
      state.hand = null;
      state.handStale = false;
      state.plate = [];
      state.plateReady = null;
      return 0;
    }
    if (kind === STATION_PLATE) {
      if (hand === null) return EVENT_WRONG;
      if (state.handStale) return EVENT_WRONG; // stale food can't be plated
      if (state.plate.length >= 4) return EVENT_WRONG; // boss dish needs 4
      state.plate.push(hand);
      state.hand = null;
      state.handStale = false;
      checkPlate();
      return EVENT_PLATED;
    }
    if (hand === null) return EVENT_WRONG;
    if (state.handStale) return EVENT_WRONG; // stale food can't be cooked
    if (kind === STATION_CHOP) {
      const result = CHOP[hand];
      if (!result) return EVENT_WRONG;
      state.station = { kind, progress: 0, total: CHOP_SECONDS, input: hand, result, doneAt: null, burnt: false };
      state.hand = null;
      return 0;
    }
    if (kind === STATION_WOK) {
      const result = COOK[hand];
      if (!result) return EVENT_WRONG;
      state.station = { kind, progress: 0, total: COOK_SECONDS, input: hand, result, doneAt: null, burnt: false };
      state.hand = null;
      return 0;
    }
    if (kind === STATION_GRILL) {
      const result = GRILL[hand];
      if (!result) return EVENT_WRONG;
      state.station = { kind, progress: 0, total: GRILL_SECONDS, input: hand, result, doneAt: null, burnt: false };
      state.hand = null;
      return 0;
    }
    return EVENT_WRONG;
  }

  /** Collect a finished station job into the hand. */
  function collectStation() {
    if (state.station.kind === null) return 0;
    if (state.station.progress < state.station.total) return EVENT_WRONG;
    if (state.hand !== null) return EVENT_WRONG;
    state.hand = state.station.result;
    state.handAt = state.elapsed;
    state.handStale = false;
    const ev = state.station.kind === STATION_CHOP ? EVENT_CHOPPED : EVENT_COOKED;
    state.station = { kind: null, progress: 0, total: 0, input: null, result: null, doneAt: null, burnt: false };
    return ev;
  }

  /** Activate Slow Time (key X): patience drains at half speed for
   *  SLOW_SECONDS. One charge per 5 perfect serves, max SLOW_MAX held. */
  function useSlowTime() {
    if (state.over) return 0;
    if (state.slowCharges <= 0 || state.slowTime > 0) return EVENT_WRONG;
    state.slowCharges -= 1;
    state.slowTime = SLOW_SECONDS;
    addFloater(640, 200, '⏱ SLOW TIME! Sabar pelanggan jalan setengah!', '#22d3ee');
    return EVENT_SLOW;
  }

  /** Serve the ready plate to an order ticket. */
  function serveOrder(orderId) {
    if (state.over) return 0;
    if (state.plateReady === null) return EVENT_WRONG;
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return EVENT_WRONG;
    if (order.dish !== state.plateReady) {
      state.wrong += 1;
      state.combo = 0;
      state.multiplier = 1;
      return EVENT_WRONG;
    }
    const dish = order.boss ? BOSS_DISH : DISH_BY_ID[order.dish];
    const timeBonus = Math.round((order.patience / order.maxPatience) * 500);
    const perfect = order.patience > order.maxPatience * 0.5;
    // Last Second Save: serving under 20% patience pays a flat bonus.
    const lastSecond = order.patience < order.maxPatience * LAST_SECOND_FRAC;
    let base = order.boss ? dish.price * BOSS_PAY : (order.vip ? Math.round(dish.price * 1.5) : dish.price);
    let earned = (base + timeBonus) * state.multiplier;
    if (lastSecond) {
      earned += LAST_SECOND_BONUS;
      state.lastSecondSaves += 1;
    }
    let tip = 0;
    if (perfect) {
      tip = Math.round(base * TIP_RATE);
      state.tips += tip;
      state.perfectServes += 1;
      earned += tip;
      // Every 5 perfect serves earns a Slow Time charge.
      state.slowReady += 1;
      if (state.slowReady >= SLOW_PERFECTS) {
        state.slowReady = 0;
        if (state.slowCharges < SLOW_MAX) {
          state.slowCharges += 1;
          addFloater(640, 170, 'SLOW TIME siap! Tekan X untuk pakai', '#22d3ee');
        }
      }
    }
    state.score += earned;
    state.coins += base;
    state.served += 1;
    if (order.vip) state.vipServed += 1;
    if (order.boss) state.bossServed = true;
    if (!state.servedDishes.includes(order.dish)) state.servedDishes.push(order.dish);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.multiplier = Math.min(COMBO_CAP, 1 + Math.floor(state.combo / 3));
    state.eatAnim = { face: order.face, until: state.elapsed + 2 };
    addFloater(640, 280, `+${earned.toLocaleString('en-US')}${order.boss ? ' ★EL JEFE 3x' : order.vip ? ' ★VIP' : ''}${perfect ? ' · TIP +' + tip : ''}${lastSecond ? ' · LAST SECOND SAVE +300' : ''}${state.multiplier > 1 ? ` · x${state.multiplier}` : ''}`, '#4e9b47');
    state.orders = state.orders.filter((o) => o.id !== orderId);
    state.plate = [];
    state.plateReady = null;
    return EVENT_SERVED | (perfect ? EVENT_PERFECT : 0) | (order.boss ? EVENT_BOSS : 0);
  }

  function step(dt) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

    // Level up: pressure grows for real at 60 s and 120 s.
    const lv = levelFor(state.elapsed);
    if (lv > state.level) {
      state.level = lv;
      state.levelName = LEVELS[lv - 1].name;
      state.levelReached = Math.max(state.levelReached, lv);
      state.levelBanner = 3;
      addFloater(640, 200, `LEVEL ${lv} — ${state.levelName}!`, '#f2c94c');
      events |= EVENT_LEVELUP;
    }
    if (state.levelBanner > 0) state.levelBanner = Math.max(0, state.levelBanner - dt);

    // Fiesta Rush: every 45 s a 15 s wave with 2x spawn rate.
    const f = state.fiesta;
    if (f.active) {
      f.left -= dt;
      if (f.left <= 0) {
        f.active = false;
        f.nextIn = FIESTA_EVERY;
        addFloater(640, 200, 'Fiesta Rush selesai!', '#f2c94c');
      }
    } else {
      f.nextIn -= dt;
      if (f.nextIn <= 0) {
        f.active = true;
        f.left = FIESTA_SECONDS;
        state.festivalCount += 1;
        addFloater(640, 200, '🎉 FIESTA RUSH! Pesanan 2x cepat! 🎉', '#ff6a2a');
        events |= EVENT_FIESTA;
      }
    }

    // El Jefe: once per shift, at 90 s, the boss VIP arrives.
    if (!state.bossSpawned && state.elapsed >= BOSS_AT) {
      spawnBoss();
      events |= EVENT_BOSS;
    }

    // Freshness: an ingredient held longer than 12 s goes stale and must be
    // trashed — it can't be plated or cooked.
    if (state.hand !== null && !state.handStale && state.elapsed - state.handAt > FRESH_SECONDS) {
      state.handStale = true;
      addFloater(640, 250, 'BASI! Buang ke sampah!', '#c0392b');
      events |= EVENT_STALE;
    }

    // Chef walks toward the busy station.
    const target = state.station.kind ? STATIONS[state.station.kind].x + 90 : 640;
    state.chefTargetX = target;
    state.chefX += (target - state.chefX) * Math.min(1, dt * 6);

    // Station progress; a finished wok/grill job burns in Fiesta Rush.
    if (state.station.kind !== null) {
      state.station.progress += dt;
      if (state.station.progress >= state.station.total) {
        state.station.progress = state.station.total;
        if (state.station.doneAt === null) state.station.doneAt = state.elapsed;
        if (!state.station.burnt && state.level === 3
          && (state.station.kind === STATION_WOK || state.station.kind === STATION_GRILL)
          && state.elapsed - state.station.doneAt > BURN_SECONDS) {
          state.station.burnt = true;
          state.station.result = 'gosong';
          state.burnt += 1;
          addFloater(640, 250, 'GOSONG! Cepat buang ke sampah!', '#c0392b');
          events |= EVENT_BURNT;
        }
      }
    }

    // Perfect Cook timing needle: sweeps while a station job cooks.
    if (state.station.kind !== null && state.station.progress < state.station.total) {
      const tm = state.timing;
      tm.pos += tm.dir * TIMING_SPEED * dt;
      if (tm.pos >= 1) { tm.pos = 1; tm.dir = -1; }
      if (tm.pos <= 0) { tm.pos = 0; tm.dir = 1; }
    }

    // Slow Time: patience drains at half speed while active.
    const drain = state.slowTime > 0 ? 0.5 : 1;
    if (state.slowTime > 0) state.slowTime = Math.max(0, state.slowTime - dt);

    // Orders spawn and lose patience (rates follow the current level;
    // Fiesta Rush doubles the spawn rate).
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnOrder();
      state.spawnTimer = LEVELS[state.level - 1].spawn * (state.fiesta.active ? 0.5 : 1);
    }
    for (const order of state.orders) order.patience -= dt * drain;
    const expired = state.orders.filter((o) => o.patience <= 0);
    if (expired.length > 0) {
      state.orders = state.orders.filter((o) => o.patience > 0);
      state.hearts -= expired.length;
      state.combo = 0;
      state.multiplier = 1;
      events |= EVENT_EXPIRED;
      if (state.hearts <= 0) {
        state.hearts = 0;
        state.over = true;
        state.overReason = 'Pelanggan kecewa semua — kedai tutup!';
        events |= EVENT_OVER;
      }
    }

    // Floaters fade.
    for (const f of state.floaters) f.life -= dt;
    state.floaters = state.floaters.filter((f) => f.life > 0);

    if (!state.over && state.timeLeft <= 0) {
      state.over = true;
      state.overReason = 'Shift selesai! Kedai tutup dengan bangga.';
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return {
    state, reset, step, pickIngredient, useStation, collectStation, serveOrder,
    useSlowTime,
    dishName: (id) => (id === BOSS_DISH.id ? BOSS_DISH.name : DISH_BY_ID[id]?.name ?? id),
    itemLabel: (id) => ITEM_LABEL[id] ?? id,
  };
}
