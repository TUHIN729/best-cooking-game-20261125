// main.js — the entry point for Ember Kitchen: the game loop, screen flow,
// sound wiring and the ?shot= hook the screenshots use.

import { VIEW_W, VIEW_H } from './config.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';
import { createWorld, startShift, updateWorld, refreshPlateReady } from './world.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sound = new SoundEngine();
const input = new Input(canvas, () => sound.unlock());

// A seeded world keeps the order deck identical between runs.
const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') || '1', 10);
const world = createWorld(Number.isFinite(seedParam) ? seedParam : 1);
world.frozen = false;

// Test and screenshot hook: ?shot=cover|play|rush|serve stages a frozen mid-game
// state; anything else starts on the title screen.
const shotName = params.get('shot');
if (shotName) {
  applyShot(world, shotName);
  world.screen = 'playing';
} else {
  world.screen = 'title';
}

// Exposed for play-testing and for the screenshot driver; the game never reads it.
window.__game = {
  world,
  sound,
  startShift: () => startShift(world),
  refreshPlate: () => refreshPlateReady(world),
};

function drainSounds() {
  for (const name of world.events.splice(0)) {
    if (typeof sound[name] === 'function') sound[name]();
  }
}

function handleScreens() {
  if (world.screen === 'title') {
    if (input.pressed('Enter') || input.takeClick()) {
      sound.unlock();
      startShift(world);
    }
    return;
  }
  if (world.screen === 'over') {
    if (input.pressed('KeyR') || input.pressed('Enter') || input.takeClick()) {
      startShift(world);
    }
    return;
  }
  if (world.screen === 'playing') {
    if (input.pressed('KeyP')) {
      world.screen = 'paused';
      return;
    }
  } else if (world.screen === 'paused') {
    if (input.pressed('KeyP') || input.pressed('Enter')) world.screen = 'playing';
    return;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  handleScreens();
  if (world.screen === 'playing' && !world.frozen) {
    updateWorld(world, dt, input);
  } else {
    // Still consume clicks on frozen shot states so they never queue up.
    input.takeClick();
  }
  if (input.pressed('KeyM')) {
    const muted = sound.toggleMute();
    world.message = { text: muted ? 'Sound off (M to turn back on)' : 'Sound on', until: world.time + 1.5, kind: 'info' };
  }
  drainSounds();
  render(ctx, world);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
