// Taco Fiesta Rush — tuning numbers and colours in one place.
// A colourful Mexican taqueria at desert sunset: papel picado, cacti,
// mariachi, neon TACOS. Playfield is a fixed 1280x720 logical area for the
// HUD; the 3D scene is rendered behind it.
export const FIELD = { width: 1280, height: 720 };

/** Fixed simulation step: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

/** One full shift, in seconds. */
export const SHIFT_SECONDS = 180;

export const HEARTS = 3;
export const BURN_SECONDS = 4;
export const VIP_CHANCE = 0.25;

/** Fiesta systems (v3): a Fiesta Rush wave every 45 s for 15 s (2x spawn),
 *  one boss VIP per shift (El Jefe), ingredients going stale in the hand
 *  after 12 s, a combo multiplier up to x5, and tips for perfect serves. */
export const FIESTA_EVERY = 45;
export const FIESTA_SECONDS = 15;
export const BOSS_AT = 90;
export const BOSS_PAY = 3;
export const FRESH_SECONDS = 12;
export const COMBO_CAP = 5;
export const TIP_RATE = 0.1;

/** Perfect Cook timing bar (revisi v3, 13:50 WIB): while a station job cooks,
 *  a needle sweeps 0..1; hit the station again in the green zone = instant
 *  finish, yellow = +50% progress, outside = -25%. */
export const TIMING_SPEED = 1.6; // needle sweeps per second (0..1..0)
export const TIMING_GREEN = [0.44, 0.56];
export const TIMING_YELLOW = [0.28, 0.72];
/** Slow Time power-up: every 5 perfect serves grants 1 charge (max 2);
 *  press X to halve patience drain for 10 s. */
export const SLOW_SECONDS = 10;
export const SLOW_PERFECTS = 5;
export const SLOW_MAX = 2;
/** Last Second Save: serving an order under 20% patience pays +$300. */
export const LAST_SECOND_FRAC = 0.2;
export const LAST_SECOND_BONUS = 300;

/** Three levels inside one 180 s shift. Pressure grows for real: patience
 *  shrinks, orders spawn faster, more tickets fit the board, new dishes
 *  unlock, VIPs arrive in Fiesta Rush — and in Fiesta Rush a panci/comal job
 *  left more than BURN_SECONDS after it finishes burns and must be trashed. */
export const LEVEL_AT = [0, 60, 120];
export const LEVELS = [
  {
    name: 'BUKA TAQUERIA', patience: 45, spawn: 11, maxOrders: 2,
    dishes: ['tacos-pastor', 'burrito', 'guacamole', 'agua-fresca'], unlock: [],
  },
  {
    name: 'JAM MAKAN SIANG', patience: 35, spawn: 8, maxOrders: 3,
    dishes: ['tacos-pastor', 'burrito', 'guacamole', 'agua-fresca', 'quesadilla', 'nachos', 'elote', 'tamales'],
    unlock: ['quesadilla', 'nachos', 'elote', 'tamales'],
  },
  {
    name: 'FIESTA RUSH', patience: 25, spawn: 6, maxOrders: 4,
    dishes: ['tacos-pastor', 'burrito', 'guacamole', 'agua-fresca', 'quesadilla', 'nachos', 'elote', 'tamales', 'churros', 'enchiladas', 'tacos-pescado', 'sopa-tortilla', 'flan', 'margarita', 'salsa-verde', 'fajitas'],
    unlock: ['churros', 'enchiladas', 'tacos-pescado', 'sopa-tortilla', 'flan', 'margarita', 'salsa-verde', 'fajitas'],
  },
];

// --- Ingredients -------------------------------------------------------------
// 17 bins on the counter (keys 1-9, 0, Q, E, R, A, S, D, F).
export const CHOP_SECONDS = 1.6;
export const COOK_SECONDS = 3.0;
export const GRILL_SECONDS = 3.2;

export const INGREDIENTS = [
  { id: 'tortilla', label: 'Tortilla', color: '#f2d8a0', shape: 'flat' },
  { id: 'daging', label: 'Daging', color: '#c94a3d', shape: 'meat' },
  { id: 'ayam', label: 'Ayam', color: '#e88a7a', shape: 'drum' },
  { id: 'ikan', label: 'Ikan', color: '#7ab8d9', shape: 'fillet' },
  { id: 'keju', label: 'Keju', color: '#f2c94c', shape: 'block' },
  { id: 'jagung', label: 'Jagung', color: '#f7dc7a', shape: 'corn' },
  { id: 'alpukat', label: 'Alpukat', color: '#5a8a3d', shape: 'avocado' },
  { id: 'tomat', label: 'Tomat', color: '#d6332a', shape: 'round' },
  { id: 'cabai', label: 'Cabai', color: '#c0392b', shape: 'chili' },
  { id: 'bawang', label: 'Bawang', color: '#f5efe0', shape: 'round' },
  { id: 'kacang', label: 'Kacang', color: '#8a5a2e', shape: 'beans' },
  { id: 'nasi', label: 'Nasi', color: '#f5efe0', shape: 'bowl' },
  { id: 'jeruk', label: 'Jeruk', color: '#8ac96a', shape: 'lime' },
  { id: 'cokelat', label: 'Cokelat', color: '#5a3220', shape: 'bar' },
  { id: 'gula', label: 'Gula', color: '#ffffff', shape: 'powder' },
  { id: 'es', label: 'Es', color: '#aee6f5', shape: 'cube' },
  { id: 'saus', label: 'Saus', color: '#d6332a', shape: 'bottle' },
];

/** Keyboard label per bin: 1-9, then 0, Q, E, R, A, S, D, F. */
export const KEY_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'E', 'R', 'A', 'S', 'D', 'F'];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// Chopping: raw -> sliced/salsa. Cooking (panci): raw -> cooked. Grilling
// (comal): tortilla/corn/chicken -> toasted.
export const CHOP = { tomat: 'salsa', bawang: 'bawang-iris', cabai: 'cabai-iris', ayam: 'ayam-potong', ikan: 'ikan-potong' };
export const COOK = { daging: 'pastor-masak' };
export const GRILL = { tortilla: 'tortilla-panggang', jagung: 'jagung-bakar', 'ayam-potong': 'ayam-panggang' };

export const ITEM_LABEL = {
  tortilla: 'Tortilla', daging: 'Daging', ayam: 'Ayam', ikan: 'Ikan',
  keju: 'Keju', jagung: 'Jagung', alpukat: 'Alpukat', tomat: 'Tomat',
  cabai: 'Cabai', bawang: 'Bawang', kacang: 'Kacang', nasi: 'Nasi',
  jeruk: 'Jeruk Nipis', cokelat: 'Cokelat', gula: 'Gula', es: 'Es Batu',
  saus: 'Saus',
  salsa: 'Salsa', 'bawang-iris': 'Bawang Iris', 'cabai-iris': 'Cabai Iris',
  'ayam-potong': 'Ayam Potong', 'ikan-potong': 'Ikan Potong',
  'pastor-masak': 'Pastor Masak', 'tortilla-panggang': 'Tortilla Panggang',
  'jagung-bakar': 'Jagung Bakar', 'ayam-panggang': 'Ayam Panggang',
  gosong: 'Gosong!',
};

export const ITEM_COLOR = {
  tortilla: '#f2d8a0', daging: '#c94a3d', ayam: '#e88a7a', ikan: '#7ab8d9',
  keju: '#f2c94c', jagung: '#f7dc7a', alpukat: '#5a8a3d', tomat: '#d6332a',
  cabai: '#c0392b', bawang: '#f5efe0', kacang: '#8a5a2e', nasi: '#f5efe0',
  jeruk: '#8ac96a', cokelat: '#5a3220', gula: '#ffffff', es: '#aee6f5',
  saus: '#d6332a',
  salsa: '#d6332a', 'bawang-iris': '#f5efe0', 'cabai-iris': '#ff5a3c',
  'ayam-potong': '#e88a7a', 'ikan-potong': '#7ab8d9',
  'pastor-masak': '#a03a2e', 'tortilla-panggang': '#d9a05a',
  'jagung-bakar': '#c9a03a', 'ayam-panggang': '#8a4a1e', gosong: '#1a1a1a',
};

// --- Dishes (plate recipes) ---------------------------------------------------
// 16 dishes, prices in pesos (shown as $): 4 from level 1, 4 unlock at
// level 2, 8 at level 3. All Mexican.
export const DISHES = [
  { id: 'tacos-pastor', name: 'Tacos al Pastor', needs: ['tortilla-panggang', 'pastor-masak', 'bawang-iris'], price: 1000, color: '#c94a3d', icon: 'taco' },
  { id: 'burrito', name: 'Burrito Carne Asada', needs: ['tortilla-panggang', 'nasi', 'kacang', 'keju'], price: 1400, color: '#d9a05a', icon: 'burrito' },
  { id: 'guacamole', name: 'Guacamole', needs: ['alpukat', 'tomat', 'jeruk'], price: 800, color: '#5a8a3d', icon: 'bowl' },
  { id: 'agua-fresca', name: 'Agua Fresca', needs: ['jeruk', 'es'], price: 500, color: '#8ac96a', icon: 'cup' },
  { id: 'quesadilla', name: 'Quesadilla', needs: ['tortilla-panggang', 'keju', 'ayam-panggang'], price: 1100, color: '#f2c94c', icon: 'fold' },
  { id: 'nachos', name: 'Nachos Supreme', needs: ['keju', 'salsa', 'cabai-iris'], price: 900, color: '#f2c94c', icon: 'chips' },
  { id: 'elote', name: 'Elote', needs: ['jagung-bakar', 'keju', 'cabai-iris'], price: 800, color: '#f7dc7a', icon: 'corn' },
  { id: 'tamales', name: 'Tamales', needs: ['jagung', 'pastor-masak'], price: 900, color: '#d9a05a', icon: 'wrap' },
  { id: 'churros', name: 'Churros', needs: ['cokelat', 'gula'], price: 700, color: '#8a5a2e', icon: 'stick' },
  { id: 'enchiladas', name: 'Enchiladas Rojas', needs: ['tortilla-panggang', 'saus', 'keju'], price: 1100, color: '#d6332a', icon: 'roll' },
  { id: 'tacos-pescado', name: 'Tacos Pescado', needs: ['tortilla-panggang', 'ikan-potong', 'salsa'], price: 1200, color: '#7ab8d9', icon: 'taco' },
  { id: 'sopa-tortilla', name: 'Sopa de Tortilla', needs: ['tortilla-panggang', 'tomat', 'keju'], price: 900, color: '#d6332a', icon: 'broth' },
  { id: 'flan', name: 'Flan', needs: ['gula', 'es'], price: 600, color: '#f2c94c', icon: 'flan' },
  { id: 'margarita', name: 'Margarita Mocktail', needs: ['jeruk', 'es', 'gula'], price: 700, color: '#8ac96a', icon: 'cup' },
  { id: 'salsa-verde', name: 'Salsa Verde', needs: ['tomat', 'cabai-iris', 'bawang-iris'], price: 600, color: '#5a8a3d', icon: 'bowl' },
  { id: 'fajitas', name: 'Fajitas', needs: ['ayam-panggang', 'bawang-iris', 'cabai-iris'], price: 1200, color: '#8a4a1e', icon: 'skillet' },
];

/** The boss VIP's mega dish: 4 ingredients, served once per shift. Not in the
 *  normal spawn pool — only El Jefe orders it. */
export const BOSS_DISH = {
  id: 'fiesta-grande', name: 'Fiesta Grande',
  needs: ['tortilla-panggang', 'pastor-masak', 'ayam-panggang', 'salsa'], price: 3000, color: '#f2c94c', icon: 'feast',
};

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

export const PALETTE = {
  backdrop: '#1a0d08',
  wall: '#2a1408',
  counter: '#3a2010',
  counterTop: '#4a2c14',
  board: '#1a0d08',
  boardPaper: '#fff8e6',
  panel: '#fff8e6',
  ink: '#1a0d08',
  muted: '#a89880',
  accent: '#ff6a2a',
  gold: '#f2c94c',
  green: '#4e9b47',
  red: '#ff3b5c',
  timer: '#ff3b5c',
  hand: '#ffe9a8',
  neonPink: '#ff2e88',
  neonCyan: '#ffd23c',
  neonGold: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Best score between visits (this browser only). */
export const BEST_KEY = 'taco-fiesta.best';
