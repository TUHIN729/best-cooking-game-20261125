// render.js — every pixel of Ember Kitchen is drawn with canvas paths.
// No image files: the kitchen, the food, the chef and the tickets are all code.

import {
  VIEW_W, VIEW_H, SHIFT_SECONDS, COIN_GOAL, MAX_MISSES,
  INGREDIENTS, ingredientById, recipeById, STATIONS, pantrySlotRect,
  COLORS,
} from './config.js';
import { shiftClock, nearestStationLabel } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'left', weight = '700', font = 'system-ui, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- Food icons -------------------------------------------------------------

export function drawIngredient(ctx, id, state, x, y, size) {
  const ing = ingredientById(id);
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  if (state === 'burnt') {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, -s * 0.1);
    ctx.lineTo(s * 0.25, s * 0.15);
    ctx.moveTo(s * 0.25, -s * 0.15);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  switch (id) {
    case 'noodle': {
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath();
      ctx.arc(0, s * 0.08, s * 0.42, 0, Math.PI);
      ctx.fill();
      ctx.strokeStyle = ing.color;
      ctx.lineWidth = s * 0.09;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.3 + i * s * 0.08, -s * 0.05);
        ctx.quadraticCurveTo(i * s * 0.12, -s * 0.3, s * 0.3 - i * s * 0.08, -s * 0.02);
        ctx.stroke();
      }
      if (state === 'cooked') {
        ctx.fillStyle = 'rgba(242, 201, 76, 0.35)';
        ctx.beginPath();
        ctx.arc(0, -s * 0.05, s * 0.34, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.42, s * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2a541';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      if (state === 'chopped') {
        ctx.strokeStyle = '#c98a2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.1);
        ctx.lineTo(s * 0.2, s * 0.1);
        ctx.stroke();
      }
      break;
    }
    case 'fish': {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.42, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, 0);
      ctx.lineTo(-s * 0.58, -s * 0.2);
      ctx.lineTo(-s * 0.58, s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1d2b36';
      ctx.beginPath();
      ctx.arc(s * 0.22, -s * 0.05, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
      if (state === 'cooked') {
        ctx.strokeStyle = '#8a5a2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.2, -s * 0.08);
        ctx.lineTo(s * 0.2, -s * 0.08);
        ctx.moveTo(-s * 0.2, s * 0.06);
        ctx.lineTo(s * 0.2, s * 0.06);
        ctx.stroke();
      }
      break;
    }
    case 'veg': {
      ctx.fillStyle = ing.color;
      for (let i = 0; i < 3; i++) {
        const a = -0.5 + i * 0.5;
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.2, s * 0.14, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#2f7d3d';
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rice': {
      ctx.fillStyle = '#d94f30';
      ctx.beginPath();
      ctx.arc(0, s * 0.1, s * 0.4, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#f5f0e1';
      ctx.beginPath();
      ctx.arc(0, -s * 0.02, s * 0.32, Math.PI, 0);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-s * 0.2 + i * s * 0.1, -s * 0.12 - (i % 2) * s * 0.08, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'chili': {
      ctx.strokeStyle = ing.color;
      ctx.lineWidth = s * 0.16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.2);
      ctx.quadraticCurveTo(0, s * 0.35, s * 0.32, -s * 0.18);
      ctx.stroke();
      ctx.strokeStyle = '#58b368';
      ctx.lineWidth = s * 0.08;
      ctx.beginPath();
      ctx.moveTo(s * 0.32, -s * 0.18);
      ctx.quadraticCurveTo(s * 0.42, -s * 0.34, s * 0.5, -s * 0.3);
      ctx.stroke();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// --- Kitchen ----------------------------------------------------------------

function drawFloor(ctx, time) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.floorDark;
  for (let y = 100; y < VIEW_H; y += 64) {
    ctx.fillRect(0, y, VIEW_W, 3);
    const off = (Math.floor(y / 64) % 2) * 80;
    for (let x = off; x < VIEW_W; x += 160) ctx.fillRect(x, y, 3, 64);
  }
  // A woven rug in the middle of the floor where the chef works.
  ctx.fillStyle = '#a34d2d';
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 470, 190, 90, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a05b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 470, 160, 72, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 470, 120, 50, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Warm lantern glow that breathes gently.
  const glow = 0.05 + 0.02 * Math.sin(time * 0.8);
  const g = ctx.createRadialGradient(VIEW_W / 2, 380, 60, VIEW_W / 2, 380, 620);
  g.addColorStop(0, `rgba(242, 201, 76, ${glow})`);
  g.addColorStop(1, 'rgba(242, 201, 76, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 100, VIEW_W, VIEW_H - 100);
}

function drawTopBoard(ctx, world) {
  // Order board: dark timber rail across the top.
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, VIEW_W, 100);
  ctx.fillStyle = '#4a2f1c';
  ctx.fillRect(0, 96, VIEW_W, 4);
  text(ctx, 'ORDER BOARD', 24, 24, 15, '#d9a05b', 'left', '800');
  text(ctx, 'EMBER KITCHEN', 24, 52, 13, '#8a6a4a', 'left', '600');

  // Tickets, left to right.
  let x = 190;
  for (const order of world.orders) {
    const recipe = recipeById(order.recipeId);
    const frac = Math.max(0, order.patience / order.maxPatience);
    const w = 168;
    ctx.fillStyle = '#fff6e0';
    rr(ctx, x, 10, w, 80, 8);
    ctx.fill();
    ctx.strokeStyle = frac < 0.3 ? '#e4572e' : '#c9a86a';
    ctx.lineWidth = frac < 0.3 ? 3 : 1.5;
    ctx.stroke();
    // Ticket name, shortened with an ellipsis when the READY tag is showing.
    let ticketName = recipe ? recipe.name : '???';
    const nameLimit = world.plateReadyRecipe === order.recipeId ? w - 78 : w - 20;
    ctx.font = '800 13px system-ui, sans-serif';
    while (ticketName.length > 4 && ctx.measureText(ticketName).width > nameLimit) {
      ticketName = ticketName.slice(0, -2);
    }
    if (ticketName !== (recipe ? recipe.name : '???')) ticketName += '…';
    text(ctx, ticketName, x + 10, 26, 13, '#241608', 'left', '800');
    let ix = x + 12;
    if (recipe) {
      for (const item of recipe.items) {
        drawIngredient(ctx, item.id, item.state, ix + 12, 52, 26);
        ix += 30;
      }
    }
    // Patience bar.
    ctx.fillStyle = '#e5d9bd';
    rr(ctx, x + 10, 70, w - 20, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#f2a541' : '#e4572e';
    if (frac > 0) {
      rr(ctx, x + 10, 70, (w - 20) * frac, 10, 5);
      ctx.fill();
    }
    if (world.plateReadyRecipe === order.recipeId) {
      ctx.fillStyle = '#2f7d3d';
      rr(ctx, x + w - 62, 14, 52, 18, 9);
      ctx.fill();
      text(ctx, 'READY', x + w - 36, 23, 10, '#ffffff', 'center', '800');
    }
    x += w + 10;
  }
  if (world.orders.length === 0) {
    text(ctx, 'No orders — breathe. The rush is coming.', 200, 50, 15, '#8a6a4a', 'left', '600');
  }

  // Timer + coins, top right.
  const urgent = world.timeLeft <= 30;
  ctx.fillStyle = urgent ? '#e4572e' : '#2b1d12';
  rr(ctx, VIEW_W - 300, 10, 130, 80, 10);
  ctx.fill();
  text(ctx, 'TIME', VIEW_W - 235, 26, 11, '#d9a05b', 'center', '800');
  text(ctx, shiftClock(world), VIEW_W - 235, 50, 26, urgent ? '#ffd9c9' : '#fff6e0', 'center', '800');

  ctx.fillStyle = '#2b1d12';
  rr(ctx, VIEW_W - 158, 10, 134, 80, 10);
  ctx.fill();
  text(ctx, 'COINS', VIEW_W - 91, 26, 11, '#d9a05b', 'center', '800');
  text(ctx, `${world.coins} / ${COIN_GOAL}`, VIEW_W - 91, 52, 24, '#f2c94c', 'center', '800');
  // Miss pips: three walked-out customers end the shift early.
  for (let i = 0; i < MAX_MISSES; i++) {
    ctx.fillStyle = i < world.missed ? '#e4572e' : '#5a4030';
    ctx.beginPath();
    ctx.arc(VIEW_W - 140 + i * 22, 76, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  if (world.combo > 1) {
    ctx.fillStyle = '#f2c94c';
    rr(ctx, VIEW_W - 300, 66, 130, 20, 10);
    ctx.fill();
    text(ctx, `COMBO x${world.combo}`, VIEW_W - 235, 76, 12, '#241608', 'center', '800');
  }
}

function drawStation(ctx, world, st) {
  const near = world.screen === 'playing' && (() => {
    const c = world.chef;
    const cx = Math.max(st.x, Math.min(c.x, st.x + st.w));
    const cy = Math.max(st.y, Math.min(c.y, st.y + st.h));
    return Math.hypot(c.x - cx, c.y - cy) <= 118;
  })();

  ctx.save();
  ctx.fillStyle = COLORS.counter;
  rr(ctx, st.x, st.y, st.w, st.h, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, st.x + 4, st.y + 4, st.w - 8, 14, 6);
  ctx.fill();
  if (near) {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 3;
    rr(ctx, st.x - 3, st.y - 3, st.w + 6, st.h + 6, 12);
    ctx.stroke();
  }
  text(ctx, st.label, st.x + st.w / 2, st.y + st.h - 12, 12, '#fff6e0', 'center', '800');

  if (st.kind === 'pantry') {
    for (const ing of INGREDIENTS) {
      const r = pantrySlotRect(ing.slot);
      ctx.fillStyle = '#8a5a33';
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fill();
      drawIngredient(ctx, ing.id, 'raw', r.x + r.w / 2, r.y + r.h / 2 - 6, 44);
      text(ctx, ing.name, r.x + r.w / 2, r.y + r.h - 10, 10, '#fff6e0', 'center', '700');
    }
  }

  if (st.kind === 'chop' || st.kind === 'stove' || st.kind === 'grill') {
    const job = world.jobs[st.kind];
    const cx = st.x + st.w / 2;
    const cy = st.y + st.h / 2 - 10;
    if (st.kind === 'stove') {
      // Two burners.
      for (const bx of [cx - 42, cx + 42]) {
        ctx.fillStyle = '#3a3f47';
        ctx.beginPath();
        ctx.arc(bx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        if (job && !job.done) {
          ctx.fillStyle = '#e4572e';
          ctx.beginPath();
          ctx.arc(bx, cy, 20 + 4 * Math.sin(world.time * 9), 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f2a541';
          ctx.beginPath();
          ctx.arc(bx, cy, 12 + 3 * Math.sin(world.time * 12 + 1), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (st.kind === 'grill') {
      ctx.strokeStyle = '#3a3f47';
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(st.x + 16, cy - 18 + i * 12);
        ctx.lineTo(st.x + st.w - 16, cy - 18 + i * 12);
        ctx.stroke();
      }
      if (job && !job.done) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 3; i++) {
          const wy = cy - 26 - ((world.time * 26 + i * 14) % 34);
          ctx.beginPath();
          ctx.arc(cx - 30 + i * 30, wy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (job) {
      drawIngredient(ctx, job.item.id, job.item.state, cx, cy, 42);
      // Progress ring.
      const frac = job.done ? 1 : job.progress / job.cookSeconds;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = job.burnt ? '#e4572e' : job.done ? '#58b368' : '#f2c94c';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (job.done && !job.burnt) {
        text(ctx, 'READY', cx, cy - 38, 11, '#58b368', 'center', '800');
      }
      if (job.burnt) text(ctx, 'BURNT!', cx, cy - 38, 11, '#e4572e', 'center', '800');
    } else {
      // Hint text on a small pill so it reads over the station's own drawing.
      const hint = st.kind === 'chop' ? 'chop here' : 'cook here';
      ctx.font = '600 12px system-ui, sans-serif';
      const hw = ctx.measureText(hint).width + 18;
      ctx.fillStyle = 'rgba(43, 29, 18, 0.55)';
      rr(ctx, cx - hw / 2, cy - 11, hw, 22, 11);
      ctx.fill();
      text(ctx, hint, cx, cy, 12, '#fff6e0', 'center', '600');
    }
  }

  if (st.kind === 'plate') {
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath();
    ctx.ellipse(st.x + st.w / 2, st.y + st.h / 2 - 12, 62, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = world.plateReadyRecipe ? '#58b368' : '#c9a86a';
    ctx.lineWidth = world.plateReadyRecipe ? 4 : 2;
    ctx.stroke();
    let ix = st.x + 34;
    for (const item of world.plate) {
      drawIngredient(ctx, item.id, item.state, ix + 14, st.y + st.h / 2 - 12, 34);
      ix += 36;
    }
    if (world.plate.length === 0) text(ctx, 'plate dishes here', st.x + st.w / 2, st.y + st.h / 2 - 12, 12, '#6b4423', 'center', '600');
    if (world.plateReadyRecipe) {
      text(ctx, 'READY TO SERVE', st.x + st.w / 2, st.y - 12, 13, '#58b368', 'center', '800');
    }
  }

  if (st.kind === 'serve') {
    // Serving hatch with a bell.
    ctx.fillStyle = '#241608';
    rr(ctx, st.x + 14, st.y + 30, st.w - 28, st.h - 60, 8);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(st.x + st.w / 2, st.y + 66, 16, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(st.x + st.w / 2 - 20, st.y + 66, 40, 6);
    text(ctx, 'RING THE BELL', st.x + st.w / 2, st.y + st.h - 34, 11, '#f2c94c', 'center', '800');
    if (world.plateReadyRecipe) {
      ctx.fillStyle = '#58b368';
      rr(ctx, st.x + 8, st.y + 8, st.w - 16, 20, 10);
      ctx.fill();
      text(ctx, 'ORDER UP!', st.x + st.w / 2, st.y + 18, 11, '#ffffff', 'center', '800');
    }
  }

  if (st.kind === 'bin') {
    ctx.fillStyle = '#3a3f47';
    rr(ctx, st.x + 22, st.y + 12, st.w - 44, st.h - 30, 6);
    ctx.fill();
    ctx.fillStyle = '#565d68';
    ctx.fillRect(st.x + 16, st.y + 8, st.w - 32, 8);
  }
  ctx.restore();
}

function drawChef(ctx, world) {
  const c = world.chef;
  const bob = c.moving ? Math.sin(world.time * 14) * 2 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron.
  ctx.fillStyle = '#fff6e0';
  rr(ctx, -18, -6, 36, 32, 12);
  ctx.fill();
  ctx.fillStyle = '#d94f30';
  ctx.fillRect(-18, 8, 36, 6);
  // Head.
  ctx.fillStyle = '#f0c8a0';
  ctx.beginPath();
  ctx.arc(0, -18, 14, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -30, 8, 0, Math.PI * 2);
  ctx.arc(0, -34, 9, 0, Math.PI * 2);
  ctx.arc(8, -30, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -30, 28, 6);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#241608';
  ctx.beginPath();
  ctx.arc(c.facing * 4 - 4, -18, 2, 0, Math.PI * 2);
  ctx.arc(c.facing * 4 + 4, -18, 2, 0, Math.PI * 2);
  ctx.fill();
  // What the chef is carrying, held up high.
  if (c.hands) {
    drawIngredient(ctx, c.hands.id, c.hands.state, 0, -60, 40);
  }
  ctx.restore();
}

function drawMessage(ctx, world) {
  if (!world.message || world.time > world.message.until) return;
  const colors = { info: '#2b1d12', good: '#2f7d3d', warn: '#b3541e', bad: '#b3261e' };
  const bg = colors[world.message.kind] || colors.info;
  ctx.save();
  ctx.font = '700 17px system-ui, sans-serif';
  const w = ctx.measureText(world.message.text).width + 36;
  ctx.fillStyle = bg;
  rr(ctx, (VIEW_W - w) / 2, VIEW_H - 64, w, 40, 20);
  ctx.fill();
  ctx.fillStyle = '#fff6e0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.message.text, VIEW_W / 2, VIEW_H - 44);
  ctx.restore();
}

function drawHint(ctx, world) {
  if (world.screen !== 'playing') return;
  const label = nearestStationLabel(world);
  const hint = label
    ? `Near ${label} — press E to use it`
    : 'WASD / arrows to move · click a station to walk to it · E to use it';
  text(ctx, hint, VIEW_W / 2, VIEW_H - 88, 13, 'rgba(255,246,224,0.85)', 'center', '600');
}

// --- Screens ----------------------------------------------------------------

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'EMBER KITCHEN', VIEW_W / 2, 150, 72, '#f2c94c', 'center', '900', "Georgia, 'Times New Roman', serif");
  text(ctx, '— Midnight Ramen Rush —', VIEW_W / 2, 205, 22, '#fff6e0', 'center', '600', "Georgia, 'Times New Roman', serif");
  text(ctx, 'A tiny kitchen, a hungry night, and tickets that will not wait.', VIEW_W / 2, 250, 18, '#d9a05b', 'center', '600');
  const lines = [
    'Grab ingredients from the PANTRY (click one, or keys 1–6).',
    'Chop on the CHOP BOARD, cook on the STOVE or GRILL — don\'t let it burn!',
    'Build the dish on the PLATING counter, then ring the bell at the SERVE WINDOW.',
    'Serve before patience runs out. 3 walked-out customers end the shift.',
    'Earn 120 coins in 3 minutes to win. Combos pay extra.',
  ];
  lines.forEach((l, i) => text(ctx, l, VIEW_W / 2, 300 + i * 30, 17, '#fff6e0', 'center', '600'));
  const pulse = 0.7 + 0.3 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER or click to start  ·  P pause  ·  M mute', VIEW_W / 2, 500, 20, '#f2c94c', 'center', '800');
  ctx.globalAlpha = 1;
  text(ctx, 'WASD / arrows move · E interact · mouse clicks walk you there', VIEW_W / 2, 540, 15, '#d9a05b', 'center', '600');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2 - 10, 56, '#fff6e0', 'center', '900', "Georgia, 'Times New Roman', serif");
  text(ctx, 'Press P to keep cooking', VIEW_W / 2, VIEW_H / 2 + 40, 18, '#d9a05b', 'center', '600');
}

function drawGameOver(ctx, world) {
  ctx.fillStyle = 'rgba(20, 12, 6, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const won = world.coins >= COIN_GOAL;
  text(ctx, won ? 'SHIFT COMPLETE!' : 'SHIFT OVER', VIEW_W / 2, 150, 56, won ? '#f2c94c' : '#e4572e', 'center', '900', "Georgia, 'Times New Roman', serif");
  let stars = '';
  for (let i = 0; i < 3; i++) stars += i < world.stars ? '★' : '☆';
  text(ctx, stars, VIEW_W / 2, 215, 48, '#f2c94c', 'center', '400');
  text(ctx, `Coins earned: ${world.coins}  (goal ${COIN_GOAL})`, VIEW_W / 2, 285, 22, '#fff6e0', 'center', '700');
  text(ctx, `Dishes served: ${world.served}   ·   Walked out: ${world.missed}   ·   Best combo: x${Math.max(1, world.bestCombo)}`, VIEW_W / 2, 325, 18, '#d9a05b', 'center', '600');
  text(ctx, won ? 'The lanterns stay lit — the night crowd is yours.' : 'The night crowd drifted away. One more shift?', VIEW_W / 2, 365, 18, '#fff6e0', 'center', '600');
  const pulse = 0.7 + 0.3 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press R to cook again', VIEW_W / 2, 440, 20, '#f2c94c', 'center', '800');
  ctx.globalAlpha = 1;
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, world.time);
  drawTopBoard(ctx, world);
  for (const st of Object.values(STATIONS)) drawStation(ctx, world, st);
  drawChef(ctx, world);
  drawHint(ctx, world);
  drawMessage(ctx, world);
  if (world.screen === 'title') drawTitle(ctx, world);
  else if (world.screen === 'paused') drawPaused(ctx);
  else if (world.screen === 'over') drawGameOver(ctx, world);
}
