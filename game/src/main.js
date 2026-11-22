// The Velvet Vault — the frame loop and the screens between rooms.
// Owns the canvas, the clock, the screen state machine and the first
// user gesture that wakes the sound. The world itself lives in world.js.

import { VIEW } from './config.js';
import { createSound } from './audio.js';
import { createInput } from './input.js';
import { drawGame, SCREEN_CAUGHT, SCREEN_CLEAR, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON } from './render.js';
import { createWorld, EVENT_CAUGHT, EVENT_CLEAR, EVENT_COIN, EVENT_DASH, EVENT_GRAB, EVENT_WIN, stepWorld } from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.w;
canvas.height = VIEW.h;

const input = createInput(canvas);
const sound = createSound();

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const shotLevel = Math.max(0, Math.min(2, Number(params.get('level') || 0)));

let world = createWorld(0);
let screen = SCREEN_TITLE;
let totalScore = 0;
let last = performance.now();
let muted = false;
let wasSpotted = false;

/** Start the named level fresh, keeping the score earned so far. */
function startLevel(index) {
  world = createWorld(index);
  world.score = totalScore;
  screen = SCREEN_PLAY;
}

/** Back to the title, score reset. */
function backToTitle() {
  totalScore = 0;
  world = createWorld(0);
  screen = SCREEN_TITLE;
}

function onCaught() {
  screen = SCREEN_CAUGHT;
  sound.caught();
}

function onClear() {
  totalScore = world.score;
  screen = SCREEN_CLEAR;
  sound.clear();
}

function onWin() {
  totalScore = world.score;
  screen = SCREEN_WON;
  sound.clear();
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const pressed = input.read();

  if (pressed.mute) {
    muted = sound.toggleMute();
    input.release('mute');
  }
  sound.ensure();

  if (screen === SCREEN_TITLE) {
    if (pressed.enter) {
      sound.startPad();
      startLevel(0);
      input.release('enter');
    }
  } else if (screen === SCREEN_PLAY) {
    if (pressed.enter) input.release('enter');
    const events = stepWorld(world, pressed, dt);
    if (events & EVENT_GRAB) sound.grab();
    if (events & EVENT_COIN) sound.coin();
    if (events & EVENT_DASH) sound.dash();
    const spotted = world.guards.some((g) => g.notice > 0.6) || world.cameras.some((c) => c.notice > 0.6);
    if (spotted && !wasSpotted) sound.spotted();
    wasSpotted = spotted;
    if (events & EVENT_CAUGHT) onCaught();
    else if (events & EVENT_WIN) onWin();
    else if (events & EVENT_CLEAR) onClear();
    if (pressed.retry) {
      startLevel(world.levelIndex);
      input.release('retry');
    }
  } else if (screen === SCREEN_CLEAR) {
    if (pressed.enter) {
      startLevel(world.levelIndex + 1);
      input.release('enter');
    }
  } else if (screen === SCREEN_CAUGHT || screen === SCREEN_WON) {
    if (pressed.retry) {
      backToTitle();
      input.release('retry');
    }
  }

  drawGame(ctx, world, screen, now / 1000);
  requestAnimationFrame(frame);
}

// A staged screenshot: one exact frame, no loop, no sound.
if (shotName) {
  const staged = stageShot(shotName, shotLevel);
  world = staged.world;
  screen = staged.screen;
  drawGame(ctx, world, screen, 1.6);
  document.title = `The Velvet Vault — ${shotName}`;
} else {
  requestAnimationFrame(frame);
}
