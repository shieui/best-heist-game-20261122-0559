// The Velvet Vault — the world: state, movement, sight, alarm and loot.
// Everything the game simulates lives here; rendering lives in render.js
// and only reads this state.

import { ALARM, COIN, LEVELS, PLAYER, ROOM, SIGHT } from './config.js';

export const EVENT_NONE = 0;
export const EVENT_CAUGHT = 1;
export const EVENT_CLEAR = 2;
export const EVENT_WIN = 4;
export const EVENT_GRAB = 8;
export const EVENT_COIN = 16;
export const EVENT_DASH = 32;

const TAU = Math.PI * 2;

function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

function angleDiff(a, b) {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function turnToward(angle, target, maxStep) {
  const d = angleDiff(target, angle);
  if (Math.abs(d) <= maxStep) return target;
  return angle + Math.sign(d) * maxStep;
}

/** True when the segment (x1,y1)-(x2,y2) crosses the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const slabs = [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ];
  for (const [p, q] of slabs) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

/** All solid rectangles that block sight in this level, loot case included. */
function sightBlockers(state) {
  const list = state.level.cases.slice();
  if (!state.lootTaken) list.push(state.level.loot);
  return list;
}

/** True when the line from (ox,oy) to (tx,ty) is not cut by any case. */
export function lineOfSight(state, ox, oy, tx, ty) {
  for (const rect of sightBlockers(state)) {
    if (segmentHitsRect(ox, oy, tx, ty, rect)) return false;
  }
  return true;
}

/**
 * True when an observer at (ox,oy) facing `angleDeg` with the given cone
 * can see the point (tx,ty): inside range, inside the cone, line of sight.
 * Sneaking shrinks the range the observer can use.
 */
export function canSee(state, ox, oy, angleDeg, range, fovDeg, tx, ty, sneaking) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  const reach = sneaking ? range * SIGHT.sneakRangeFactor : range;
  if (dist > reach) return false;
  if (dist < 14) return true;
  const target = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (Math.abs(angleDiff(target, angleDeg)) > fovDeg / 2) return false;
  return lineOfSight(state, ox, oy, tx, ty);
}

/** A fresh state for level `levelIndex` (0-based). */
export function createWorld(levelIndex) {
  const level = LEVELS[levelIndex];
  return {
    levelIndex,
    level,
    time: 0,
    score: 0,
    alarm: 0,
    lootTaken: false,
    grabProgress: 0,
    coinsLeft: COIN.perLevel,
    status: 'play',
    clearBonus: 0,
    player: {
      x: level.player.x,
      y: level.player.y,
      dir: -90,
      sneaking: false,
      dashT: 0,
      dashCd: 0,
      moving: false,
    },
    guards: level.guards.map((g) => ({
      x: g.x,
      y: g.y,
      angle: 90,
      speed: g.speed,
      range: g.range,
      fov: g.fov,
      waypoints: g.waypoints,
      wp: 1,
      waitT: 0,
      state: 'patrol',
      notice: 0,
      pauseT: 0,
      lastSeen: null,
      investigate: null,
    })),
    cameras: level.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      angle: c.angle,
      base: c.angle,
      sweep: c.sweep,
      speed: c.speed,
      range: c.range,
      fov: c.fov,
      notice: 0,
      t: Math.random() * TAU,
    })),
    coins: [],
    particles: [],
  };
}

/** Push the player circle out of the room walls and the display cases. */
function collide(state, p, nx, ny) {
  const r = PLAYER.radius;
  const minX = ROOM.x + r;
  const maxX = ROOM.x + ROOM.w - r;
  const minY = ROOM.y + r;
  const maxY = ROOM.y + ROOM.h - r;
  let x = clamp(nx, minX, maxX);
  let y = clamp(ny, minY, maxY);
  const solids = state.level.cases.concat([state.level.loot]);
  for (const rect of solids) {
    const cx = clamp(x, rect.x, rect.x + rect.w);
    const cy = clamp(y, rect.y, rect.y + rect.h);
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 === 0) {
        y = rect.y - r;
      } else {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        y = cy + (dy / d) * r;
      }
    }
  }
  p.x = x;
  p.y = y;
}

/** A burst of sparks at (x,y) for pickups and dashes. */
export function burst(state, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * TAU;
    const sp = 40 + Math.random() * 90;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      color,
      size: 2 + Math.random() * 2.5,
    });
  }
}

/** Is the thief close enough to the loot case to grab it? */
export function nearLoot(state) {
  const loot = state.level.loot;
  const cx = loot.x + loot.w / 2;
  const cy = loot.y + loot.h / 2;
  return Math.hypot(state.player.x - cx, state.player.y - cy) < 78;
}

/** Is the thief standing in the exit doorway? */
export function inExit(state) {
  const e = state.level.exit;
  const p = state.player;
  return p.x > e.x - 6 && p.x < e.x + e.w + 6 && p.y > e.y - 4 && p.y < e.y + e.h + 10;
}

/** Move one guard one step: patrol, suspicion, chase or investigation. */
function stepGuard(state, guard, dt) {
  const player = state.player;
  const seen = canSee(
    state,
    guard.x,
    guard.y,
    guard.angle,
    guard.range,
    guard.fov,
    player.x,
    player.y,
    player.sneaking,
  );
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
  if (seen) {
    const closeness = 1 - clamp(dist / guard.range, 0, 1);
    guard.notice = clamp(guard.notice + SIGHT.noticeRate * (0.7 + closeness) * dt, 0, 1);
    guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.notice = clamp(guard.notice - SIGHT.noticeDecay * dt, 0, 1);
  }

  if (guard.notice > 0.9 || state.alarm >= ALARM.chaseAt) {
    guard.state = 'chase';
  } else if (guard.notice > 0.35 && guard.state !== 'chase') {
    guard.state = 'suspicious';
  } else if (guard.state === 'suspicious' && guard.notice < 0.15) {
    guard.state = 'patrol';
  }

  if (guard.investigate && guard.state !== 'chase') guard.state = 'investigate';

  if (guard.state === 'chase') {
    const target = guard.lastSeen || { x: guard.x, y: guard.y };
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const d = Math.hypot(dx, dy);
    if (d < 14) {
      guard.pauseT += dt;
      guard.angle = turnToward(guard.angle, guard.angle + 120 * dt, 120 * dt);
      if (guard.pauseT > 2) {
        guard.pauseT = 0;
        guard.state = 'patrol';
        guard.lastSeen = null;
      }
    } else {
      guard.pauseT = 0;
      const sp = guard.speed * 1.6;
      guard.x += (dx / d) * sp * dt;
      guard.y += (dy / d) * sp * dt;
      guard.angle = turnToward(guard.angle, (Math.atan2(dy, dx) * 180) / Math.PI, 540 * dt);
    }
    return;
  }

  if (guard.state === 'investigate') {
    const target = guard.investigate;
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const d = Math.hypot(dx, dy);
    if (d < 12) {
      guard.pauseT += dt;
      guard.angle = turnToward(guard.angle, guard.angle + 90 * dt, 90 * dt);
      if (guard.pauseT > 2) {
        guard.pauseT = 0;
        guard.investigate = null;
        guard.state = 'patrol';
      }
    } else {
      guard.pauseT = 0;
      guard.x += (dx / d) * guard.speed * dt;
      guard.y += (dy / d) * guard.speed * dt;
      guard.angle = turnToward(guard.angle, (Math.atan2(dy, dx) * 180) / Math.PI, 540 * dt);
    }
    return;
  }

  if (guard.state === 'suspicious') {
    guard.angle = turnToward(
      guard.angle,
      (Math.atan2(player.y - guard.y, player.x - guard.x) * 180) / Math.PI,
      420 * dt,
    );
    return;
  }

  // Patrol: walk the waypoints, pausing at each one.
  if (guard.waitT > 0) {
    guard.waitT -= dt;
    return;
  }
  const wp = guard.waypoints[guard.wp];
  const dx = wp[0] - guard.x;
  const dy = wp[1] - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 6) {
    guard.wp = (guard.wp + 1) % guard.waypoints.length;
    guard.waitT = 0.8;
    return;
  }
  guard.x += (dx / d) * guard.speed * dt;
  guard.y += (dy / d) * guard.speed * dt;
  guard.angle = turnToward(guard.angle, (Math.atan2(dy, dx) * 180) / Math.PI, 420 * dt);
}

/** Advance the world one frame. Returns an event bitmask for sounds. */
export function stepWorld(state, input, dt) {
  let events = EVENT_NONE;
  if (state.status !== 'play') return events;
  state.time += dt;
  const player = state.player;
  const level = state.level;

  // --- Thrown coin -------------------------------------------------------
  if (input.click && state.coinsLeft > 0) {
    const cx = clamp(input.click.x, ROOM.x + 8, ROOM.x + ROOM.w - 8);
    const cy = clamp(input.click.y, ROOM.y + 8, ROOM.y + ROOM.h - 8);
    state.coins.push({ x: cx, y: cy, t: 0 });
    state.coinsLeft -= 1;
    burst(state, cx, cy, '#ffd76a', 10);
    for (const guard of state.guards) {
      if (Math.hypot(guard.x - cx, guard.y - cy) < COIN.hear) {
        guard.investigate = { x: cx, y: cy };
        guard.pauseT = 0;
      }
    }
    events |= EVENT_COIN;
  }

  // --- Movement ----------------------------------------------------------
  const len = Math.hypot(input.mx, input.my);
  const nx = len > 0 ? input.mx / len : 0;
  const ny = len > 0 ? input.my / len : 0;
  // Sneaking is a stance, not a speed: holding Shift hides the thief even
  // while standing still behind a case.
  player.sneaking = input.sneak;
  player.moving = len > 0;
  if (len > 0) player.dir = (Math.atan2(ny, nx) * 180) / Math.PI;
  player.dashCd = Math.max(0, player.dashCd - dt);
  let speed = player.sneaking ? PLAYER.sneak : PLAYER.walk;
  if (input.dash && player.dashCd <= 0 && len > 0) {
    player.dashT = PLAYER.dashTime;
    player.dashCd = PLAYER.dashCooldown;
    burst(state, player.x, player.y, '#9fb4ff', 8);
    for (const guard of state.guards) {
      if (Math.hypot(guard.x - player.x, guard.y - player.y) < 220) {
        guard.state = 'suspicious';
        guard.notice = Math.max(guard.notice, 0.5);
      }
    }
    events |= EVENT_DASH;
  }
  if (player.dashT > 0) {
    player.dashT -= dt;
    speed = PLAYER.dashSpeed;
  }
  collide(state, player, player.x + nx * speed * dt, player.y + ny * speed * dt);

  // --- Guards and cameras -------------------------------------------------
  for (const guard of state.guards) stepGuard(state, guard, dt);
  for (const camera of state.cameras) {
    camera.t += dt;
    camera.angle = camera.base + Math.sin(camera.t * camera.speed) * camera.sweep;
    const seen = canSee(
      state,
      camera.x,
      camera.y,
      camera.angle,
      camera.range,
      camera.fov,
      player.x,
      player.y,
      player.sneaking,
    );
    camera.notice = clamp(
      camera.notice + (seen ? SIGHT.noticeRate * dt : -SIGHT.noticeDecay * dt),
      0,
      1,
    );
  }

  // --- Alarm --------------------------------------------------------------
  let firm = 0;
  for (const guard of state.guards) firm = Math.max(firm, guard.notice);
  for (const camera of state.cameras) firm = Math.max(firm, camera.notice);
  if (firm > 0.2) {
    const rate = firm > 0.6 ? ALARM.riseNear : ALARM.riseFar;
    state.alarm = clamp(state.alarm + rate * firm * dt, 0, ALARM.max);
  } else {
    state.alarm = clamp(state.alarm - ALARM.decay * dt, 0, ALARM.max);
  }
  if (state.alarm >= ALARM.max) {
    state.status = 'caught';
    return EVENT_CAUGHT;
  }

  // --- A guard bumping into the thief ends the run ------------------------
  for (const guard of state.guards) {
    if (Math.hypot(guard.x - player.x, guard.y - player.y) < 24) {
      state.status = 'caught';
      return EVENT_CAUGHT;
    }
  }

  // --- Grab the loot --------------------------------------------------------
  if (!state.lootTaken && nearLoot(state)) {
    if (input.grab) {
      state.grabProgress += dt / 1.2;
      if (state.grabProgress >= 1) {
        state.lootTaken = true;
        state.grabProgress = 0;
        state.score += level.loot.value;
        burst(state, level.loot.x + level.loot.w / 2, level.loot.y + level.loot.h / 2, '#ffd76a', 26);
        events |= EVENT_GRAB;
      }
    } else {
      state.grabProgress = Math.max(0, state.grabProgress - dt / 0.6);
    }
  } else {
    state.grabProgress = Math.max(0, state.grabProgress - dt / 0.6);
  }

  // --- Escape ---------------------------------------------------------------
  if (state.lootTaken && inExit(state)) {
    const bonus = Math.max(0, Math.round((level.par - state.time) * 10));
    state.clearBonus = bonus;
    state.score += bonus;
    if (state.levelIndex >= LEVELS.length - 1) {
      state.status = 'won';
      return EVENT_WIN;
    }
    state.status = 'clear';
    return EVENT_CLEAR;
  }

  // --- Particles --------------------------------------------------------------
  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.94;
    p.vy *= 0.94;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const coin of state.coins) coin.t += dt;

  return events;
}
