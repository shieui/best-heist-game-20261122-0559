// The Velvet Vault — everything drawn on the canvas: the room, the cones,
// the people, the loot, the alarm meter and the screens in between.

import { HUD_H, ROOM, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WON = 'won';

const TAU = Math.PI * 2;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawVisionCone(ctx, x, y, angleDeg, range, fovDeg, fill) {
  const a = (angleDeg * Math.PI) / 180;
  const half = ((fovDeg / 2) * Math.PI) / 180;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, a - half, a + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** The parquet floor, the rug and the walls of the gallery. */
function drawRoom(ctx, state) {
  const level = state.level;
  // Floor tiles.
  for (let ty = 0; ty < 14; ty += 1) {
    for (let tx = 0; tx < 23; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#3a2c1e' : '#33271b';
      ctx.fillRect(ROOM.x + tx * 40, ROOM.y + ty * 40, 40, 40);
    }
  }
  // The rug under the loot.
  const loot = level.loot;
  ctx.fillStyle = '#5e1f24';
  roundRect(ctx, loot.x - 70, loot.y - 58, loot.w + 140, loot.h + 116, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  roundRect(ctx, loot.x - 70, loot.y - 58, loot.w + 140, loot.h + 116, 10);
  ctx.stroke();
  // Walls: a thick dark frame with a gold inner line.
  ctx.fillStyle = '#14161d';
  ctx.fillRect(0, HUD_H, VIEW.w, 16);
  ctx.fillRect(0, VIEW.h - 16, VIEW.w, 16);
  ctx.fillRect(0, HUD_H, 16, VIEW.h - HUD_H);
  ctx.fillRect(VIEW.w - 16, HUD_H, VIEW.w, VIEW.h - HUD_H);
  ctx.strokeStyle = '#8a6d2b';
  ctx.lineWidth = 2;
  ctx.strokeRect(17, HUD_H + 17, VIEW.w - 34, VIEW.h - HUD_H - 34);
  // The exit doorway in the top wall.
  const exit = level.exit;
  ctx.fillStyle = state.lootTaken ? '#2f7d4f' : '#4a2b2b';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = state.lootTaken ? '#7dffb0' : '#8a6d2b';
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  if (state.lootTaken) {
    ctx.fillStyle = '#c9f5d6';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h + 14);
  }
}

/** A glass-topped display case. */
function drawCase(ctx, rect) {
  ctx.fillStyle = '#1d2733';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
  ctx.fill();
  ctx.fillStyle = '#274b5c';
  roundRect(ctx, rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rect.x + 12, rect.y + rect.h - 10);
  ctx.lineTo(rect.x + rect.w - 22, rect.y + 12);
  ctx.stroke();
}

/** The loot case and its glowing jewel. */
function drawLoot(ctx, state, now) {
  const loot = state.level.loot;
  if (state.lootTaken) {
    // The empty case, lid open.
    ctx.fillStyle = '#1d2733';
    roundRect(ctx, loot.x, loot.y, loot.w, loot.h, 6);
    ctx.fill();
    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY', loot.x + loot.w / 2, loot.y + loot.h / 2 + 4);
    return;
  }
  drawCase(ctx, loot);
  const cx = loot.x + loot.w / 2;
  const cy = loot.y + loot.h / 2;
  const pulse = 0.6 + 0.4 * Math.sin(now * 3);
  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34 + 10 * pulse);
  glow.addColorStop(0, 'rgba(120,200,255,0.9)');
  glow.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, TAU);
  ctx.fill();
  // The sapphire: a faceted diamond.
  ctx.fillStyle = '#6fc3ff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx + 12, cy);
  ctx.lineTo(cx, cy + 14);
  ctx.lineTo(cx - 12, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#dff2ff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 14);
  ctx.lineTo(cx + 6, cy - 2);
  ctx.lineTo(cx - 6, cy - 2);
  ctx.closePath();
  ctx.fill();
  // The grab ring while the thief holds E.
  if (state.grabProgress > 0) {
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + TAU * state.grabProgress);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.name.toUpperCase(), cx, loot.y - 10);
}

/** One guard: cone, navy uniform, cap, and a mark when he is alerted. */
function drawGuard(ctx, guard) {
  const hot = guard.state === 'chase';
  const warm = guard.state === 'suspicious' || guard.state === 'investigate';
  const fill = hot
    ? 'rgba(255,64,64,0.28)'
    : warm
      ? 'rgba(255,150,40,0.26)'
      : 'rgba(255,214,106,0.20)';
  drawVisionCone(ctx, guard.x, guard.y, guard.angle, guard.range, guard.fov, fill);
}

function drawGuardBody(ctx, guard) {
  // Body.
  ctx.fillStyle = '#2b3a55';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 12, 0, TAU);
  ctx.fill();
  // Cap.
  ctx.fillStyle = '#1a2436';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 3, 8, Math.PI, 0);
  ctx.fill();
  // Facing tick.
  const a = (guard.angle * Math.PI) / 180;
  ctx.strokeStyle = '#dfe8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(a) * 15, guard.y + Math.sin(a) * 15);
  ctx.stroke();
  if (guard.state === 'chase') {
    ctx.fillStyle = '#ff5b5b';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 20);
  } else if (guard.state === 'suspicious' || guard.state === 'investigate') {
    ctx.fillStyle = '#ffb347';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 20);
  }
}

/** A wall camera and its sweeping red cone. */
function drawCamera(ctx, camera) {
  const fill =
    camera.notice > 0.5 ? 'rgba(255,70,70,0.34)' : 'rgba(255,70,70,0.20)';
  drawVisionCone(ctx, camera.x, camera.y, camera.angle, camera.range, camera.fov, fill);
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(camera.x - 8, camera.y - 5, 16, 10);
  ctx.fillStyle = camera.notice > 0.5 ? '#ff4040' : '#ff7070';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y + 6, 3.5, 0, TAU);
  ctx.fill();
}

/** The thief: a hooded figure, smaller and lower when sneaking. */
function drawPlayer(ctx, state) {
  const p = state.player;
  const squash = p.sneaking ? 0.8 : 1;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1, squash);
  // A thin gold ring so the thief still reads at a glance when the
  // screenshot is shrunk to a thumbnail.
  ctx.strokeStyle = 'rgba(255,215,106,0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#191d26';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0e1118';
  ctx.beginPath();
  ctx.arc(0, -2, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e8ecf5';
  ctx.fillRect(-6, -1, 12, 3);
  const a = (p.dir * Math.PI) / 180;
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
  ctx.stroke();
  ctx.restore();
  if (state.grabProgress > 0) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GRABBING…', p.x, p.y - 22);
  }
}

/** The top bar: alarm meter, level, time, loot, coins and score. */
function drawHud(ctx, state) {
  ctx.fillStyle = '#10131a';
  ctx.fillRect(0, 0, VIEW.w, HUD_H);
  ctx.strokeStyle = '#2a2f3d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H);
  ctx.lineTo(VIEW.w, HUD_H);
  ctx.stroke();

  // Alarm meter.
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 16, 20);
  const bx = 76;
  const bw = 260;
  ctx.fillStyle = '#232833';
  roundRect(ctx, bx, 8, bw, 20, 4);
  ctx.fill();
  const frac = state.alarm / 100;
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#3fae5a');
  grad.addColorStop(0.55, '#e8b93c');
  grad.addColorStop(1, '#e5484d');
  ctx.fillStyle = grad;
  if (frac > 0) {
    roundRect(ctx, bx, 8, Math.max(8, bw * frac), 20, 4);
    ctx.fill();
  }
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`${Math.round(state.alarm)}%`, bx + bw + 10, 20);
  if (state.alarm >= 55) {
    ctx.fillStyle = '#ff5b5b';
    ctx.fillText('HUNTED', bx + bw + 56, 20);
  }

  // Level, time, loot, coins, score.
  const level = state.level;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#c9a227';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(level.name.toUpperCase(), VIEW.w - 16, 20);
  ctx.fillStyle = '#e8ecf5';
  ctx.font = '13px system-ui, sans-serif';
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60);
  ctx.fillText(
    `${mins}:${secs.toString().padStart(2, '0')}   Score ${state.score}   Coins ${state.coinsLeft}   ${
      state.lootTaken ? 'LOOT ✓' : `LOOT: ${level.loot.name}`
    }`,
    VIEW.w - 16,
    40,
  );
}

/** A dark veil with centred lines of text, for the title and end screens. */
function drawVeil(ctx, lines, accent) {
  ctx.fillStyle = 'rgba(8,10,16,0.82)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  ctx.textAlign = 'center';
  let y = VIEW.h / 2 - (lines.length - 1) * 22;
  for (const line of lines) {
    ctx.fillStyle = line.color || '#e8ecf5';
    ctx.font = line.font || '16px system-ui, sans-serif';
    ctx.fillText(line.text, VIEW.w / 2, y);
    y += 44;
  }
  if (accent) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(120, VIEW.h / 2 - (lines.length - 1) * 22 - 78, VIEW.w - 240, (lines.length - 1) * 44 + 156);
  }
}

/** Draw one frame of the game. `now` is seconds since the page loaded. */
export function drawGame(ctx, state, screen, now) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  ctx.fillStyle = '#0b0d12';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  drawRoom(ctx, state);
  for (const rect of state.level.cases) drawCase(ctx, rect);
  drawLoot(ctx, state, now);
  for (const camera of state.cameras) drawCamera(ctx, camera);
  for (const guard of state.guards) drawGuard(ctx, guard);
  for (const coin of state.coins) {
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5 + Math.sin(coin.t * 6) * 1.5, 0, TAU);
    ctx.fill();
  }
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  drawPlayer(ctx, state);
  for (const guard of state.guards) drawGuardBody(ctx, guard);
  drawHud(ctx, state);

  if (screen === SCREEN_TITLE) {
    drawVeil(
      ctx,
      [
        { text: 'THE VELVET VAULT', font: 'bold 44px Georgia, serif', color: '#c9a227' },
        { text: 'A night at the Marlowe Gallery', font: 'italic 18px Georgia, serif', color: '#b9c0cf' },
        { text: 'Steal the jewel. Dodge the cones. Slip out before the alarm hits 100.', font: '15px system-ui, sans-serif' },
        { text: 'Move WASD / arrows · Sneak Shift · Dash Space · Throw a coin: click · Grab the loot: hold E', font: '14px system-ui, sans-serif', color: '#9fb4ff' },
        { text: 'Press ENTER to begin', font: 'bold 18px system-ui, sans-serif', color: '#ffd76a' },
      ],
      '#c9a227',
    );
  } else if (screen === SCREEN_CLEAR) {
    drawVeil(
      ctx,
      [
        { text: `${state.level.name} — CLEAN GETAWAY`, font: 'bold 30px Georgia, serif', color: '#7dffb0' },
        { text: `Loot ${state.level.loot.name}  +${state.level.loot.value}   ·   Time bonus +${state.clearBonus}`, font: '16px system-ui, sans-serif' },
        { text: `Score ${state.score}`, font: 'bold 20px system-ui, sans-serif', color: '#ffd76a' },
        { text: 'Press ENTER for the next room', font: '16px system-ui, sans-serif', color: '#9fb4ff' },
      ],
      '#2f7d4f',
    );
  } else if (screen === SCREEN_CAUGHT) {
    drawVeil(
      ctx,
      [
        { text: 'CAUGHT!', font: 'bold 44px Georgia, serif', color: '#ff5b5b' },
        { text: 'The alarm hit 100 and the gallery locked down.', font: '16px system-ui, sans-serif' },
        { text: `Score ${state.score}`, font: 'bold 18px system-ui, sans-serif', color: '#ffd76a' },
        { text: 'Press R to try the room again', font: '16px system-ui, sans-serif', color: '#9fb4ff' },
      ],
      '#e5484d',
    );
  } else if (screen === SCREEN_WON) {
    drawVeil(
      ctx,
      [
        { text: 'THE PERFECT HEIST', font: 'bold 40px Georgia, serif', color: '#c9a227' },
        { text: 'Three rooms, three jewels, one clean escape.', font: 'italic 18px Georgia, serif', color: '#b9c0cf' },
        { text: `Final score ${state.score}`, font: 'bold 22px system-ui, sans-serif', color: '#ffd76a' },
        { text: 'Press R to play again', font: '16px system-ui, sans-serif', color: '#9fb4ff' },
      ],
      '#c9a227',
    );
  } else if (!state.lootTaken) {
    ctx.fillStyle = '#e8ecf5';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Objective: reach the glowing case and hold E to grab the jewel', 16, VIEW.h - 26);
  } else {
    ctx.fillStyle = '#7dffb0';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Loot secured — get to the green EXIT at the top!', 16, VIEW.h - 26);
  }
}
