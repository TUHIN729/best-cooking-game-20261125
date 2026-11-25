// world.js — the kitchen simulation for Ember Kitchen: the chef, the stations,
// the orders on the board, cooking timers, plating, serving and the shift clock.
// Pure state and rules; drawing lives in render.js.

import {
  VIEW_W, VIEW_H, SHIFT_SECONDS, COIN_GOAL, MAX_MISSES,
  CHEF_SPEED, CHEF_RADIUS, INTERACT_RANGE,
  ORDER_PATIENCE, ORDER_SPAWN_START, ORDER_SPAWN_END, MAX_ORDERS,
  BURN_GRACE_SECONDS, CHOP_SECONDS,
  INGREDIENTS, ingredientById, RECIPES, recipeById,
  STATIONS, pantrySlotRect, stationApproach,
} from './config.js';

export function makeItem(id, state = 'raw') {
  return { id, state };
}

// A cooking job sitting on a station: what is cooking, how far along, and when it burns.
function makeJob(item, cookSeconds) {
  return { item, progress: 0, cookSeconds, done: false, burnt: false, burnTimer: 0 };
}

export function createWorld(seed = 1) {
  let rngState = seed >>> 0 || 1;
  const rand = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0;
    return rngState / 4294967296;
  };

  return {
    seed,
    rand,
    screen: 'title', // 'title' | 'playing' | 'paused' | 'over'
    time: 0,         // seconds since the shift started
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    stars: 0,
    goalReached: false,
    rushAnnounced: false,
    orders: [],      // { id, recipeId, patience, maxPatience }
    nextOrderId: 1,
    spawnTimer: 2,
    chef: {
      x: VIEW_W / 2, y: 430,
      tx: null, ty: null,       // click-to-move target
      pendingStation: null,     // station id to auto-use on arrival
      pendingIngredient: null,  // ingredient id to pick up on arrival at pantry
      hands: null,              // { id, state } or null
      facing: 1,
      moving: false,
      chopAnim: 0,
    },
    // One job slot per work station (chop board, stove, grill). Plating holds a plate.
    jobs: { chop: null, stove: null, grill: null },
    plate: [], // items on the plating counter: [{ id, state }]
    plateReadyRecipe: null,
    lastServeAt: -99,
    message: null, // { text, until, kind }
    events: [],    // sound events drained by main.js each frame
  };
}

export function startShift(world) {
  world.screen = 'playing';
  world.time = 0;
  world.timeLeft = SHIFT_SECONDS;
  world.coins = 0;
  world.served = 0;
  world.missed = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.stars = 0;
  world.goalReached = false;
  world.rushAnnounced = false;
  world.orders = [];
  world.nextOrderId = 1;
  world.spawnTimer = 2;
  world.jobs = { chop: null, stove: null, grill: null };
  world.plate = [];
  world.plateReadyRecipe = null;
  world.chef.hands = null;
  world.chef.x = VIEW_W / 2;
  world.chef.y = 430;
  world.chef.tx = null;
  world.chef.pendingStation = null;
  world.chef.pendingIngredient = null;
  world.message = { text: 'Shift started — first order coming!', until: 3, kind: 'info' };
}

function flash(world, text, kind = 'info', seconds = 2.2) {
  world.message = { text, until: world.time + seconds, kind };
}

function emit(world, sound) {
  world.events.push(sound);
}

// --- Orders ---------------------------------------------------------------

function spawnOrder(world) {
  if (world.orders.length >= MAX_ORDERS) return;
  const recipe = RECIPES[Math.floor(world.rand() * RECIPES.length)];
  const patience = ORDER_PATIENCE * (1 - (world.time / SHIFT_SECONDS) * 0.25);
  world.orders.push({
    id: world.nextOrderId++,
    recipeId: recipe.id,
    patience,
    maxPatience: patience,
  });
  emit(world, 'orderIn');
}

function spawnInterval(world) {
  const t = world.time / SHIFT_SECONDS;
  return ORDER_SPAWN_START + (ORDER_SPAWN_END - ORDER_SPAWN_START) * t;
}

// The plate matches a recipe when it holds exactly the recipe's items (as a set).
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.items.length) return false;
  const have = plate.map((i) => `${i.id}:${i.state}`).sort().join('|');
  const want = recipe.items.map((i) => `${i.id}:${i.state}`).sort().join('|');
  return have === want;
}

export function refreshPlateReady(world) {
  world.plateReadyRecipe = null;
  for (const order of world.orders) {
    const recipe = recipeById(order.recipeId);
    if (recipe && plateMatchesRecipe(world.plate, recipe)) {
      world.plateReadyRecipe = recipe.id;
      return;
    }
  }
}

// --- Station helpers ------------------------------------------------------

function stationAt(x, y) {
  for (const st of Object.values(STATIONS)) {
    if (x >= st.x - 6 && x <= st.x + st.w + 6 && y >= st.y - 6 && y <= st.y + st.h + 6) return st;
  }
  return null;
}

function pantrySlotAt(x, y) {
  for (const ing of INGREDIENTS) {
    const r = pantrySlotRect(ing.slot);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return ing;
  }
  return null;
}

function chefNearStation(world, st) {
  const c = world.chef;
  const cx = Math.max(st.x, Math.min(c.x, st.x + st.w));
  const cy = Math.max(st.y, Math.min(c.y, st.y + st.h));
  return Math.hypot(c.x - cx, c.y - cy) <= INTERACT_RANGE;
}

function nearestStation(world) {
  let best = null;
  let bestD = Infinity;
  for (const st of Object.values(STATIONS)) {
    if (!chefNearStation(world, st)) continue;
    const cx = Math.max(st.x, Math.min(world.chef.x, st.x + st.w));
    const cy = Math.max(st.y, Math.min(world.chef.y, st.y + st.h));
    const d = Math.hypot(world.chef.x - cx, world.chef.y - cy);
    if (d < bestD) { bestD = d; best = st; }
  }
  return best;
}

// --- Interactions ---------------------------------------------------------

function tryPickIngredient(world, ing) {
  const chef = world.chef;
  if (chef.hands) { flash(world, 'Hands full — serve or bin something first', 'warn'); return; }
  chef.hands = makeItem(ing.id, 'raw');
  emit(world, 'pickup');
}

function useStation(world, st) {
  const chef = world.chef;
  if (!st) return;

  if (st.kind === 'pantry') {
    if (chef.hands) { flash(world, 'Hands full — put it down first', 'warn'); return; }
    flash(world, 'Pick an ingredient from the pantry (click it, or keys 1–6)', 'info');
    return;
  }

  if (st.kind === 'bin') {
    if (chef.hands) {
      chef.hands = null;
      emit(world, 'place');
      flash(world, 'Binned it', 'info', 1.2);
    } else {
      flash(world, 'Nothing to bin', 'info', 1.2);
    }
    return;
  }

  if (st.kind === 'chop' || st.kind === 'stove' || st.kind === 'grill') {
    const job = world.jobs[st.kind];
    if (job) {
      // Pick the finished (or burnt) item back up.
      if (chef.hands) { flash(world, 'Hands full — put it down first', 'warn'); return; }
      if (!job.done && !job.burnt) { flash(world, 'Still cooking — wait for the ding!', 'info', 1.4); return; }
      chef.hands = job.item;
      world.jobs[st.kind] = null;
      emit(world, job.burnt ? 'burnt' : 'pickup');
      if (job.burnt) flash(world, 'Burnt! Bin it and start over', 'warn');
      return;
    }
    // Place an item to work on.
    if (!chef.hands) { flash(world, `Nothing to ${st.kind === 'chop' ? 'chop' : 'cook'} — grab an ingredient first`, 'info', 1.6); return; }
    const ing = ingredientById(chef.hands.id);
    if (st.kind === 'chop') {
      if (chef.hands.state !== 'raw' || !ing.chop) { flash(world, `${ing.name} does not need chopping`, 'warn'); return; }
      world.jobs.chop = makeJob(makeItem(ing.id, 'chopped'), CHOP_SECONDS);
      chef.hands = null;
      emit(world, 'chop');
    } else {
      if (chef.hands.state !== 'raw' || ing.cook !== st.kind) {
        flash(world, st.kind === 'stove' ? `${ing.name} goes on the grill, not the stove` : `${ing.name} goes on the stove, not the grill`, 'warn');
        return;
      }
      world.jobs[st.kind] = makeJob(makeItem(ing.id, 'cooked'), ing.cookSeconds);
      chef.hands = null;
      emit(world, 'sizzle');
    }
    return;
  }

  if (st.kind === 'plate') {
    if (!chef.hands) {
      if (world.plate.length > 0) {
        // Take the last item back off the plate.
        chef.hands = world.plate.pop();
        refreshPlateReady(world);
        emit(world, 'pickup');
      } else {
        flash(world, 'Plate is empty — bring a cooked item', 'info', 1.6);
      }
      return;
    }
    const item = chef.hands;
    if (item.state === 'raw' || item.state === 'burnt') {
      flash(world, item.state === 'burnt' ? 'Burnt food never plates — bin it' : 'Cook or chop it first, then plate it', 'warn');
      return;
    }
    if (world.plate.length >= 4) { flash(world, 'Plate is full', 'warn'); return; }
    world.plate.push(item);
    chef.hands = null;
    emit(world, 'place');
    refreshPlateReady(world);
    if (world.plateReadyRecipe) emit(world, 'plateReady');
    return;
  }

  if (st.kind === 'serve') {
    if (!world.plateReadyRecipe) {
      flash(world, world.plate.length === 0 ? 'Nothing plated yet — build a dish on the plating counter' : 'That plate matches no order yet — check the tickets', 'warn', 2);
      return;
    }
    serveDish(world);
  }
}

function serveDish(world) {
  const recipe = recipeById(world.plateReadyRecipe);
  const orderIdx = world.orders.findIndex((o) => o.recipeId === recipe.id);
  if (orderIdx < 0) return;
  const order = world.orders[orderIdx];
  const patienceFrac = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(8 * patienceFrac);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const mult = 1 + Math.min(1, (world.combo - 1) * 0.1);
  const earned = Math.round((recipe.coins + tip) * mult);
  world.coins += earned;
  world.served += 1;
  world.orders.splice(orderIdx, 1);
  world.plate = [];
  world.plateReadyRecipe = null;
  world.lastServeAt = world.time;
  emit(world, 'serve');
  flash(world, `Served ${recipe.name}! +${earned} coins${world.combo > 1 ? ` (combo x${world.combo})` : ''}`, 'good', 2.4);
  if (world.coins >= COIN_GOAL && !world.goalReached) {
    world.goalReached = true;
    flash(world, 'Goal reached! Keep serving for a 3-star finish', 'good', 3);
    emit(world, 'win');
  }
}

// --- Chef movement ----------------------------------------------------------

function clampToRoom(world) {
  const c = world.chef;
  c.x = Math.max(60, Math.min(VIEW_W - 60, c.x));
  c.y = Math.max(210, Math.min(VIEW_H - 40, c.y));
  // Push out of station rectangles (counters are solid).
  for (const st of Object.values(STATIONS)) {
    const pad = CHEF_RADIUS - 2;
    if (c.x > st.x - pad && c.x < st.x + st.w + pad && c.y > st.y - pad && c.y < st.y + st.h + pad) {
      const dxl = c.x - (st.x - pad);
      const dxr = st.x + st.w + pad - c.x;
      const dyt = c.y - (st.y - pad);
      const dyb = st.y + st.h + pad - c.y;
      const m = Math.min(dxl, dxr, dyt, dyb);
      if (m === dxl) c.x = st.x - pad;
      else if (m === dxr) c.x = st.x + st.w + pad;
      else if (m === dyt) c.y = st.y - pad;
      else c.y = st.y + st.h + pad;
    }
  }
}

function moveChef(world, dt, input) {
  const chef = world.chef;
  const mv = input.moveVector();
  if (mv.x !== 0 || mv.y !== 0) {
    chef.tx = null;
    chef.pendingStation = null;
    chef.pendingIngredient = null;
    chef.x += mv.x * CHEF_SPEED * dt;
    chef.y += mv.y * CHEF_SPEED * dt;
    chef.facing = mv.x !== 0 ? Math.sign(mv.x) : chef.facing;
    chef.moving = true;
  } else if (chef.tx !== null) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      chef.tx = null;
      chef.moving = false;
      if (chef.pendingStation) {
        const st = STATIONS[chef.pendingStation];
        chef.pendingStation = null;
        if (st && chefNearStation(world, st)) useStation(world, st);
      } else if (chef.pendingIngredient) {
        const ing = ingredientById(chef.pendingIngredient);
        chef.pendingIngredient = null;
        if (ing && chefNearStation(world, STATIONS.pantry)) tryPickIngredient(world, ing);
      }
    } else {
      chef.x += (dx / d) * CHEF_SPEED * dt;
      chef.y += (dy / d) * CHEF_SPEED * dt;
      chef.facing = dx !== 0 ? Math.sign(dx) : chef.facing;
      chef.moving = true;
    }
  } else {
    chef.moving = false;
  }
  clampToRoom(world);
  if (chef.chopAnim > 0) chef.chopAnim = Math.max(0, chef.chopAnim - dt);
}

// --- Per-frame update -------------------------------------------------------

export function updateWorld(world, dt, input) {
  if (world.screen !== 'playing') return;

  world.time += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.time);

  // Last-30-seconds rush warning.
  if (world.timeLeft <= 30 && !world.rushAnnounced) {
    world.rushAnnounced = true;
    flash(world, 'RUSH HOUR — last 30 seconds!', 'warn', 3);
    emit(world, 'rush');
  }

  // Order spawning.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    world.spawnTimer = spawnInterval(world);
  }

  // Order patience drains; an expired order is a miss.
  for (let i = world.orders.length - 1; i >= 0; i--) {
    const o = world.orders[i];
    o.patience -= dt;
    if (o.patience <= 0) {
      const recipe = recipeById(o.recipeId);
      world.orders.splice(i, 1);
      world.missed += 1;
      world.combo = 0;
      emit(world, 'fail');
      flash(world, `${recipe ? recipe.name : 'An order'} walked out — patience ran out`, 'bad', 2.4);
      refreshPlateReady(world);
      if (world.missed >= MAX_MISSES) {
        endShift(world, false);
        return;
      }
    }
  }

  // Cooking jobs progress; finished jobs can burn if left too long.
  for (const kind of ['chop', 'stove', 'grill']) {
    const job = world.jobs[kind];
    if (!job) continue;
    if (!job.done) {
      job.progress += dt;
      if (job.progress >= job.cookSeconds) {
        job.done = true;
        job.progress = job.cookSeconds;
        emit(world, kind === 'chop' ? 'chopDone' : 'cooked');
        if (kind === 'chop') world.chef.chopAnim = 0.4;
      }
    } else if (!job.burnt && kind !== 'chop') {
      job.burnTimer += dt;
      if (job.burnTimer >= BURN_GRACE_SECONDS) {
        job.burnt = true;
        job.item.state = 'burnt';
        emit(world, 'burnt');
        flash(world, 'Something burnt on the ' + kind + '!', 'bad', 2);
      }
    }
  }

  // Mouse click: walk to a point, a station, or a pantry ingredient.
  const click = input.takeClick();
  if (click) {
    const ing = pantrySlotAt(click.x, click.y);
    const st = stationAt(click.x, click.y);
    if (ing) {
      const ap = stationApproach(STATIONS.pantry);
      world.chef.tx = ap.x;
      world.chef.ty = ap.y;
      world.chef.pendingIngredient = ing.id;
      world.chef.pendingStation = null;
    } else if (st) {
      const ap = stationApproach(st);
      world.chef.tx = ap.x;
      world.chef.ty = ap.y;
      world.chef.pendingStation = st.id;
      world.chef.pendingIngredient = null;
    } else {
      world.chef.tx = click.x;
      world.chef.ty = click.y;
      world.chef.pendingStation = null;
      world.chef.pendingIngredient = null;
    }
  }

  // Pantry number keys.
  const num = input.pantryNumber();
  if (num >= 1 && num <= 6) {
    const ing = INGREDIENTS[num - 1];
    if (chefNearStation(world, STATIONS.pantry)) {
      tryPickIngredient(world, ing);
    } else {
      const ap = stationApproach(STATIONS.pantry);
      world.chef.tx = ap.x;
      world.chef.ty = ap.y;
      world.chef.pendingIngredient = ing.id;
      world.chef.pendingStation = null;
    }
  }

  // Interact key uses the nearest station in range.
  if (input.interactPressed()) {
    const st = nearestStation(world);
    if (st) useStation(world, st);
  }

  moveChef(world, dt, input);

  // Shift clock hits zero: the shift ends.
  if (world.timeLeft <= 0) {
    endShift(world, world.coins >= COIN_GOAL);
  }
}

function endShift(world, won) {
  world.screen = 'over';
  world.timeLeft = 0;
  const ratio = world.coins / COIN_GOAL;
  world.stars = won ? (ratio >= 1.5 ? 3 : ratio >= 1.2 ? 2 : 1) : 0;
  if (won) emit(world, 'win');
  else emit(world, 'fail');
}

// --- Helpers for the HUD and screenshots ------------------------------------

export function nearestStationLabel(world) {
  const st = nearestStation(world);
  return st ? st.label : null;
}

export function shiftClock(world) {
  const s = Math.ceil(world.timeLeft);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export { stationAt, pantrySlotAt, chefNearStation, nearestStation };
