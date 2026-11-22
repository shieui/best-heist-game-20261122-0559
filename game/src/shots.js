// The Velvet Vault — the staged scenes behind ?shot=start|play|play2|end.
// Each scene puts the world in one exact, named state and freezes it, so a
// screenshot is the same frame every time it is taken. The scenes play by
// the real rules: nothing here is drawn by hand, only the state is placed.

import { createWorld } from './world.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON } from './render.js';

/** The thief mid-crossing on level 1: cones, a camera, the jewel, alarm up. */
function stagePlay(world) {
  world.player.x = 430;
  world.player.y = 452;
  world.player.dir = -90;
  world.alarm = 34;
  world.coinsLeft = 2;
  world.coins.push({ x: 620, y: 380, t: 0.4 });
  const g0 = world.guards[0];
  g0.x = 470;
  g0.y = 140;
  g0.angle = 135;
  g0.state = 'patrol';
  const g1 = world.guards[1];
  g1.x = 560;
  g1.y = 520;
  g1.angle = -125;
  g1.state = 'suspicious';
  g1.notice = 0.55;
  world.cameras[0].angle = 122;
  world.cameras[0].notice = 0.2;
  return SCREEN_PLAY;
}

/** Level 2, deeper in: three guards, two cameras, the mask still waiting. */
function stagePlay2(world) {
  world.player.x = 360;
  world.player.y = 480;
  world.player.dir = -45;
  world.player.sneaking = true;
  world.alarm = 61;
  world.coinsLeft = 1;
  const g0 = world.guards[0];
  g0.x = 500;
  g0.y = 140;
  g0.angle = 90;
  const g1 = world.guards[1];
  g1.x = 420;
  g1.y = 520;
  g1.angle = -90;
  g1.state = 'chase';
  g1.notice = 1;
  g1.lastSeen = { x: 360, y: 480 };
  const g2 = world.guards[2];
  g2.x = 480;
  g2.y = 330;
  g2.angle = 180;
  world.cameras[0].angle = 68;
  world.cameras[1].angle = 112;
  return SCREEN_PLAY;
}

/**
 * Put a fresh world in the named scene and return the screen to draw.
 * Unknown names stage the title; the live game never calls this.
 */
export function stageShot(name, levelIndex = 0) {
  if (name === 'play2') {
    const world = createWorld(1);
    return { world, screen: stagePlay2(world) };
  }
  if (name === 'end') {
    const world = createWorld(0);
    world.lootTaken = true;
    world.score = 2480;
    world.clearBonus = 480;
    world.status = 'won';
    return { world, screen: SCREEN_WON };
  }
  if (name === 'caught') {
    const world = createWorld(0);
    world.alarm = 100;
    world.status = 'caught';
    return { world, screen: SCREEN_CAUGHT };
  }
  if (name === 'play') {
    const world = createWorld(levelIndex);
    return { world, screen: stagePlay(world) };
  }
  const world = createWorld(0);
  world.guards[0].x = 420;
  world.guards[0].y = 140;
  world.guards[0].angle = 110;
  world.guards[1].x = 540;
  world.guards[1].y = 520;
  world.guards[1].angle = -100;
  world.cameras[0].angle = 100;
  return { world, screen: SCREEN_TITLE };
}

/** The title screen's backdrop: level 1, guards mid-patrol, thief waiting. */
export function stageTitle(levelIndex = 0) {
  return stageShot('start', levelIndex);
}
