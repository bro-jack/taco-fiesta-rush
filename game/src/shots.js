// Screenshot scenes behind ?shot=start|play|serve|end.
// Each stages a real game state (orders, plate, station progress, timer)
// through the world's own reset/serve path, so the frame is what a real
// game looks like at that moment, and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function setOrders(world, specs) {
  world.state.orders = specs.map((s, i) => ({
    id: i + 1,
    dish: s.dish,
    name: s.name,
    needs: [...s.needs],
    patience: s.patience,
    maxPatience: s.maxPatience ?? s.patience,
    face: s.face,
    vip: !!s.vip,
    boss: !!s.boss,
  }));
}

/** Stage `world` to the named scene and return the screen to draw and best. */
export function stageShot(name, world) {
  const s = world.state;
  if (name === 'play') {
    // Fiesta Rush (level 3) mid-wave: boss El Jefe + VIP + 2 more orders,
    // a taco mid-assembly, combo x3 with multiplier x2.
    world.reset();
    s.level = 3;
    s.levelName = 'FIESTA RUSH';
    s.levelReached = 3;
    s.timeLeft = 50;
    s.elapsed = 130;
    s.score = 8400;
    s.coins = 31200;
    s.tips = 650;
    s.combo = 3;
    s.multiplier = 2;
    s.bestCombo = 5;
    s.served = 11;
    s.festivalCount = 2;
    s.fiesta = { active: true, nextIn: 45, left: 9 };
    s.bossSpawned = true;
    setOrders(world, [
      { dish: 'fiesta-grande', name: 'Fiesta Grande', needs: ['tortilla-panggang', 'pastor-masak', 'ayam-panggang', 'salsa'], patience: 16, maxPatience: 20, face: 1, vip: true, boss: true },
      { dish: 'tacos-pastor', name: 'Tacos al Pastor', needs: ['tortilla-panggang', 'pastor-masak', 'bawang-iris'], patience: 18, maxPatience: 25, face: 2, vip: true },
      { dish: 'fajitas', name: 'Fajitas', needs: ['ayam-panggang', 'bawang-iris', 'cabai-iris'], patience: 15, maxPatience: 25, face: 0 },
      { dish: 'churros', name: 'Churros', needs: ['cokelat', 'gula'], patience: 20, maxPatience: 25, face: 3 },
    ]);
    // Tacos al Pastor mid-assembly: comal grilling a tortilla (timing bar
    // needle parked in the green zone), plate holds pastor + tortilla — the
    // bigger, more detailed food reads at thumbnail size.
    s.station = { kind: 'grill', progress: 1.9, total: 3.2, input: 'tortilla', result: 'tortilla-panggang', doneAt: null, burnt: false };
    s.timing = { pos: 0.5, dir: 1, last: null, lastAt: 0 };
    s.plate = ['pastor-masak', 'tortilla-panggang'];
    s.hand = 'bawang-iris';
    s.chefX = 690;
    // A just-earned coin floater: the taqueria feels alive, mid-rush.
    s.floaters = [{ text: '+$2.450 · x2', x: 700, y: 290, life: 0.9, color: '#7ee787' }];
    return { screen: SCREEN_PLAY, best: 8400 };
  }
  if (name === 'serve') {
    // Jam Makan Siang (level 2): a new dish (Quesadilla) complete and ready.
    world.reset();
    s.level = 2;
    s.levelName = 'JAM MAKAN SIANG';
    s.levelReached = 2;
    s.timeLeft = 96;
    s.elapsed = 84;
    s.score = 4100;
    s.coins = 19800;
    s.tips = 220;
    s.combo = 4;
    s.multiplier = 2;
    s.served = 7;
    setOrders(world, [
      { dish: 'quesadilla', name: 'Quesadilla', needs: ['tortilla-panggang', 'keju', 'ayam-panggang'], patience: 30, maxPatience: 35, face: 1 },
      { dish: 'tacos-pastor', name: 'Tacos al Pastor', needs: ['tortilla-panggang', 'pastor-masak', 'bawang-iris'], patience: 18, maxPatience: 35, face: 3 },
      { dish: 'elote', name: 'Elote', needs: ['jagung-bakar', 'keju', 'cabai-iris'], patience: 25, maxPatience: 35, face: 2 },
    ]);
    // Plate complete and ready: the matching order glows for serving.
    s.plate = ['tortilla-panggang', 'keju', 'ayam-panggang'];
    s.plateReady = 'quesadilla';
    s.hand = null;
    s.chefX = 690;
    s.floaters = [{ text: '+$1.650', x: 1020, y: 290, life: 0.95, color: '#7ee787' }];
    return { screen: SCREEN_PLAY, best: 4100 };
  }
  if (name === 'end') {
    world.reset();
    s.level = 3;
    s.levelName = 'FIESTA RUSH';
    s.levelReached = 3;
    s.timeLeft = 0;
    s.elapsed = 180;
    s.score = 18900;
    s.coins = 42800;
    s.tips = 1950;
    s.served = 22;
    s.bestCombo = 9;
    s.multiplier = 3;
    s.combo = 0;
    s.hearts = 2;
    s.vipServed = 3;
    s.bossServed = true;
    s.burnt = 1;
    s.festivalCount = 3;
    s.perfectServes = 6;
    s.servedDishes = ['tacos-pastor', 'burrito', 'quesadilla', 'elote', 'churros', 'fajitas', 'fiesta-grande'];
    s.orders = [];
    s.over = true;
    s.overReason = 'Shift selesai! Taqueria tutup dengan bangga.';
    return { screen: SCREEN_OVER, best: 18900 };
  }
  // start (default): title over a live taqueria with two orders waiting.
  world.reset();
  s.timeLeft = 180;
  setOrders(world, [
    { dish: 'tacos-pastor', name: 'Tacos al Pastor', needs: ['tortilla-panggang', 'pastor-masak', 'bawang-iris'], patience: 41, face: 0 },
    { dish: 'guacamole', name: 'Guacamole', needs: ['alpukat', 'tomat', 'jeruk'], patience: 35, face: 2 },
  ]);
  s.chefX = 690;
  return { screen: SCREEN_TITLE, best: 0 };
}

export { STEP };
