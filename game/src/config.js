// The Velvet Vault — configuration and level layouts.
// Every number here is fixed by hand: the three rooms are laid out on paper
// first, then typed in, so the game is the same every run and every
// screenshot is reproducible.

export const VIEW = { w: 960, h: 640 };
export const HUD_H = 48;

// The room's inner floor, inside the outer walls.
export const ROOM = { x: 16, y: HUD_H + 16, w: 928, h: 560 };

export const PLAYER = {
  radius: 11,
  walk: 168,
  sneak: 96,
  dashSpeed: 400,
  dashTime: 0.18,
  dashCooldown: 1.2,
};

export const ALARM = {
  max: 100,
  // Alarm gained per second while any observer has a firm fix on the thief.
  riseFar: 34,
  riseNear: 62,
  // Alarm lost per second while nobody sees the thief.
  decay: 13,
  // At this alarm every guard abandons patrol and runs to the last seen spot.
  chaseAt: 55,
};

// How far a thrown coin can fly and how far away a guard hears it land.
export const COIN = { range: 300, hear: 280, perLevel: 3 };

// A guard or camera spots the thief only inside this cone and only with a
// clear line of sight. Sneaking halves the range a guard can spot from.
export const SIGHT = { sneakRangeFactor: 0.55, noticeRate: 1.5, noticeDecay: 0.8 };

// One level: a room, its furniture, its guards, its cameras and its loot.
export const LEVELS = [
  {
    name: 'The Sapphire Wing',
    sub: 'Level 1 — two guards, one camera',
    par: 60,
    loot: { name: 'Star of Aldermere', value: 1000, x: 435, y: 288, w: 90, h: 64 },
    player: { x: 480, y: 588 },
    exit: { x: 440, y: 64, w: 80, h: 14 },
    cases: [
      { x: 150, y: 150, w: 110, h: 70 },
      { x: 700, y: 150, w: 110, h: 70 },
      { x: 150, y: 420, w: 110, h: 70 },
      { x: 700, y: 420, w: 110, h: 70 },
      { x: 430, y: 470, w: 100, h: 56 },
    ],
    guards: [
      {
        x: 240, y: 140, speed: 56, range: 190, fov: 70,
        waypoints: [[240, 140], [720, 140]],
      },
      {
        x: 720, y: 520, speed: 56, range: 190, fov: 70,
        waypoints: [[720, 520], [240, 520]],
      },
    ],
    cameras: [
      { x: 480, y: 72, angle: 90, sweep: 52, speed: 0.55, range: 230, fov: 56 },
    ],
  },
  {
    name: 'The Gilded Hall',
    sub: 'Level 2 — three guards, two cameras',
    par: 75,
    loot: { name: 'The Gilded Mask', value: 1500, x: 435, y: 300, w: 90, h: 64 },
    player: { x: 480, y: 588 },
    exit: { x: 440, y: 64, w: 80, h: 14 },
    cases: [
      { x: 150, y: 150, w: 110, h: 70 },
      { x: 700, y: 150, w: 110, h: 70 },
      { x: 150, y: 420, w: 110, h: 70 },
      { x: 700, y: 420, w: 110, h: 70 },
      { x: 280, y: 300, w: 80, h: 56 },
      { x: 600, y: 300, w: 80, h: 56 },
    ],
    guards: [
      {
        x: 200, y: 140, speed: 62, range: 200, fov: 72,
        waypoints: [[200, 140], [760, 140]],
      },
      {
        x: 760, y: 520, speed: 62, range: 200, fov: 72,
        waypoints: [[760, 520], [200, 520]],
      },
      {
        x: 480, y: 180, speed: 50, range: 190, fov: 70,
        waypoints: [[480, 180], [480, 470]],
      },
    ],
    cameras: [
      { x: 180, y: 72, angle: 90, sweep: 55, speed: 0.65, range: 235, fov: 56 },
      { x: 780, y: 72, angle: 90, sweep: 55, speed: 0.65, range: 235, fov: 56 },
    ],
  },
  {
    name: 'The Vault of Kings',
    sub: 'Level 3 — four guards, three cameras',
    par: 90,
    loot: { name: 'The Crown of Vell', value: 2500, x: 435, y: 300, w: 90, h: 64 },
    player: { x: 480, y: 588 },
    exit: { x: 440, y: 64, w: 80, h: 14 },
    cases: [
      { x: 120, y: 150, w: 100, h: 64 },
      { x: 740, y: 150, w: 100, h: 64 },
      { x: 120, y: 430, w: 100, h: 64 },
      { x: 740, y: 430, w: 100, h: 64 },
      { x: 300, y: 210, w: 90, h: 56 },
      { x: 570, y: 210, w: 90, h: 56 },
      { x: 300, y: 400, w: 90, h: 56 },
      { x: 570, y: 400, w: 90, h: 56 },
    ],
    guards: [
      {
        x: 180, y: 140, speed: 70, range: 205, fov: 74,
        waypoints: [[180, 140], [780, 140]],
      },
      {
        x: 780, y: 520, speed: 70, range: 205, fov: 74,
        waypoints: [[780, 520], [180, 520]],
      },
      {
        x: 300, y: 180, speed: 58, range: 195, fov: 72,
        waypoints: [[300, 180], [300, 480]],
      },
      {
        x: 660, y: 480, speed: 58, range: 195, fov: 72,
        waypoints: [[660, 480], [660, 180]],
      },
    ],
    cameras: [
      { x: 180, y: 72, angle: 90, sweep: 55, speed: 0.7, range: 240, fov: 56 },
      { x: 480, y: 72, angle: 90, sweep: 48, speed: 0.8, range: 240, fov: 56 },
      { x: 780, y: 72, angle: 90, sweep: 55, speed: 0.7, range: 240, fov: 56 },
    ],
  },
];
