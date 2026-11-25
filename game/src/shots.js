// shots.js — deterministic staged states for the entry's screenshots.
// Each shot builds a real mid-game state from the game's own rules (orders on the
// board, jobs on the stations, a plate on the counter) and then freezes the clock,
// so the screenshot is a stable render of the game itself, never a mock-up.

import { SHIFT_SECONDS, INGREDIENTS } from './config.js';
import { makeItem, refreshPlateReady } from './world.js';

function setClock(world, secondsLeft) {
  world.time = SHIFT_SECONDS - secondsLeft;
  world.timeLeft = secondsLeft;
}

function setOrder(world, id, recipeId, patience, maxPatience) {
  world.orders.push({ id, recipeId, patience, maxPatience });
}

function setJob(world, kind, itemId, state, progress, cookSeconds) {
  world.jobs[kind] = {
    item: makeItem(itemId, state),
    progress,
    cookSeconds,
    done: progress >= cookSeconds,
    burnt: false,
    burnTimer: 0,
  };
}

function freeze(world) {
  world.screen = 'playing';
  world.frozen = true;
  world.message = null;
}

// The cover: a full kitchen at its best — three tickets on the board, a finished
// rice bowl glowing READY on the plating counter, a noodle on the stove and an egg
// mid-chop for the next dish, the chef carrying a chopped egg, 2:15 on the clock.
export function shotCover(world) {
  setClock(world, 135);
  world.coins = 48;
  world.served = 3;
  world.combo = 2;
  world.bestCombo = 2;
  setOrder(world, 1, 'rice-bowl', 38, 52);
  setOrder(world, 2, 'ramen', 22, 52);
  setOrder(world, 3, 'mackerel', 44, 52);
  setJob(world, 'stove', 'noodle', 'cooked', 2.1, 3.5);
  setJob(world, 'chop', 'egg', 'chopped', 1.1, 1.8);
  world.plate = [makeItem('rice', 'cooked'), makeItem('veg', 'chopped')];
  refreshPlateReady(world);
  world.chef.x = 980;
  world.chef.y = 300;
  world.chef.facing = -1;
  world.chef.hands = makeItem('egg', 'chopped');
  freeze(world);
}

// Active play: the chef carries a raw mackerel toward the grill, a fish already
// sizzling, two tickets up, 2:40 left.
export function shotPlay(world) {
  setClock(world, 160);
  world.coins = 18;
  world.served = 1;
  world.combo = 1;
  world.bestCombo = 1;
  setOrder(world, 1, 'mackerel', 40, 52);
  setOrder(world, 2, 'stirfry', 30, 52);
  setJob(world, 'grill', 'fish', 'cooked', 2.6, 4.5);
  setJob(world, 'stove', 'rice', 'cooked', 1.2, 3.0);
  world.plate = [];
  world.chef.x = 640;
  world.chef.y = 420;
  world.chef.facing = 1;
  world.chef.hands = makeItem('fish', 'raw');
  freeze(world);
}

// The rush: four tickets, one nearly out of patience, the clock at 0:42,
// a stir-fry half built on the plate, combo x3.
export function shotRush(world) {
  setClock(world, 42);
  world.coins = 98;
  world.served = 7;
  world.combo = 3;
  world.bestCombo = 4;
  world.rushAnnounced = true;
  setOrder(world, 1, 'ramen', 6, 52);
  setOrder(world, 2, 'chili-noodle', 28, 52);
  setOrder(world, 3, 'omelette', 36, 52);
  setOrder(world, 4, 'stirfry', 46, 52);
  setJob(world, 'stove', 'noodle', 'cooked', 3.2, 3.5);
  setJob(world, 'chop', 'veg', 'chopped', 0.9, 1.8);
  world.plate = [makeItem('veg', 'chopped')];
  refreshPlateReady(world);
  world.chef.x = 560;
  world.chef.y = 380;
  world.chef.facing = -1;
  world.chef.hands = makeItem('noodle', 'cooked');
  freeze(world);
}

// The serve: a finished Lantern Ramen on the plate, ORDER UP at the window,
// the chef at the hatch, 1:30 left.
export function shotServe(world) {
  setClock(world, 90);
  world.coins = 64;
  world.served = 4;
  world.combo = 2;
  world.bestCombo = 3;
  setOrder(world, 1, 'ramen', 30, 52);
  setOrder(world, 2, 'rice-bowl', 41, 52);
  world.plate = [makeItem('noodle', 'cooked'), makeItem('egg', 'chopped')];
  refreshPlateReady(world);
  world.chef.x = 1010;
  world.chef.y = 400;
  world.chef.facing = 1;
  world.chef.hands = null;
  freeze(world);
}

export const SHOTS = { cover: shotCover, play: shotPlay, rush: shotRush, serve: shotServe };

export function applyShot(world, name) {
  const fn = SHOTS[name] || SHOTS.cover;
  fn(world);
  return name in SHOTS ? name : 'cover';
}

// Keep the ingredient list referenced so the pantry always renders stocked.
export function pantryStock() {
  return INGREDIENTS.map((i) => i.id);
}
