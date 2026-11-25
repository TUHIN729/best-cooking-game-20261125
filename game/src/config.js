// config.js — tuning, ingredients, recipes and the kitchen layout for Ember Kitchen.
// Every value here is original to this game; nothing is copied from another game.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const SHIFT_SECONDS = 180;
export const COIN_GOAL = 120;
export const MAX_MISSES = 3;
export const HANDS_CAPACITY = 1;

export const CHEF_SPEED = 265;
export const CHEF_RADIUS = 22;
export const INTERACT_RANGE = 118;

// Patience an order starts with (seconds) and how fast new orders arrive.
export const ORDER_PATIENCE = 52;
export const ORDER_SPAWN_START = 15;
export const ORDER_SPAWN_END = 7.5;
export const MAX_ORDERS = 4;
export const BURN_GRACE_SECONDS = 7;

export const CHOP_SECONDS = 1.8;
export const STOVE_SECONDS = 4.0;
export const GRILL_SECONDS = 4.5;

// One ingredient: id, display name, colour used to draw it, pantry slot, needsChop.
export const INGREDIENTS = [
  { id: 'noodle', name: 'Noodles', color: '#f2c94c', slot: 0, chop: false, cook: 'stove', cookSeconds: 3.5 },
  { id: 'egg',    name: 'Egg',     color: '#fdf3d0', slot: 1, chop: true,  cook: null,   cookSeconds: 0 },
  { id: 'fish',   name: 'Mackerel',color: '#7fb3d5', slot: 2, chop: false, cook: 'grill', cookSeconds: 4.5 },
  { id: 'veg',    name: 'Greens',  color: '#58b368', slot: 3, chop: true,  cook: null,   cookSeconds: 0 },
  { id: 'rice',   name: 'Rice',    color: '#f5f0e1', slot: 4, chop: false, cook: 'stove', cookSeconds: 3.0 },
  { id: 'chili',  name: 'Chili',   color: '#e4572e', slot: 5, chop: false, cook: null,   cookSeconds: 0 },
];

export function ingredientById(id) {
  return INGREDIENTS.find((i) => i.id === id) || null;
}

// A recipe: the dish name, its coin value, and the items a finished plate must hold.
// An item is { id, state } where state is 'chopped' or 'cooked' (raw items never plate).
export const RECIPES = [
  {
    id: 'ramen',
    name: 'Lantern Ramen',
    coins: 16,
    items: [
      { id: 'noodle', state: 'cooked' },
      { id: 'egg', state: 'chopped' },
    ],
  },
  {
    id: 'mackerel',
    name: 'Grilled Mackerel Set',
    coins: 18,
    items: [
      { id: 'fish', state: 'cooked' },
      { id: 'rice', state: 'cooked' },
    ],
  },
  {
    id: 'stirfry',
    name: 'Ember Stir-Fry',
    coins: 14,
    items: [
      { id: 'veg', state: 'chopped' },
      { id: 'noodle', state: 'cooked' },
    ],
  },
  {
    id: 'chili-noodle',
    name: 'Chili Noodles',
    coins: 15,
    items: [
      { id: 'noodle', state: 'cooked' },
      { id: 'chili', state: 'raw' },
    ],
  },
  {
    id: 'omelette',
    name: 'Golden Omelette',
    coins: 13,
    items: [
      { id: 'egg', state: 'chopped' },
      { id: 'fish', state: 'cooked' },
    ],
  },
  {
    id: 'rice-bowl',
    name: 'Midnight Rice Bowl',
    coins: 12,
    items: [
      { id: 'rice', state: 'cooked' },
      { id: 'veg', state: 'chopped' },
    ],
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Station rectangles in canvas space. The kitchen is one room: the order board
// hangs across the top, counters line the walls, the chef works the middle floor.
export const STATIONS = {
  pantry: { id: 'pantry', label: 'PANTRY', x: 24, y: 300, w: 150, h: 260, kind: 'pantry' },
  chop:   { id: 'chop',   label: 'CHOP BOARD', x: 300, y: 128, w: 170, h: 62, kind: 'chop' },
  stove:  { id: 'stove',  label: 'STOVE', x: 520, y: 128, w: 170, h: 62, kind: 'stove' },
  grill:  { id: 'grill',  label: 'GRILL', x: 740, y: 128, w: 170, h: 62, kind: 'grill' },
  plate:  { id: 'plate',  label: 'PLATING', x: 960, y: 128, w: 200, h: 62, kind: 'plate' },
  serve:  { id: 'serve',  label: 'SERVE WINDOW', x: 1120, y: 300, w: 136, h: 200, kind: 'serve' },
  bin:    { id: 'bin',    label: 'BIN', x: 24, y: 620, w: 110, h: 70, kind: 'bin' },
};

// Pantry ingredient slots, laid out on the pantry counter (2 columns x 3 rows).
export function pantrySlotRect(slot) {
  const s = STATIONS.pantry;
  const col = slot % 2;
  const row = Math.floor(slot / 2);
  const w = 62;
  const h = 72;
  return {
    x: s.x + 8 + col * (w + 6),
    y: s.y + 30 + row * (h + 6),
    w,
    h,
  };
}

// Where the chef stands to use a station (approach point just outside its rect).
export function stationApproach(st) {
  if (st.id === 'pantry') return { x: st.x + st.w + 46, y: st.y + st.h / 2 };
  if (st.id === 'serve') return { x: st.x - 46, y: st.y + st.h / 2 };
  if (st.id === 'bin') return { x: st.x + st.w + 46, y: st.y + st.h / 2 };
  return { x: st.x + st.w / 2, y: st.y + st.h + 52 };
}

export const COLORS = {
  floor: '#8a5a33',
  floorDark: '#7a4e2b',
  wall: '#3d2b1f',
  board: '#2b1d12',
  counter: '#b07a45',
  counterTop: '#d9a05b',
  steel: '#c8ccd4',
  cream: '#fff6e0',
  ink: '#241608',
  red: '#e4572e',
  green: '#58b368',
  gold: '#f2c94c',
};
