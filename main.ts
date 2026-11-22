// The Velvet Vault — a top-down stealth heist game, handed in.
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline (game/index.html and its ES modules, no library and
// no network request). This program copies game/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary
// the judge reads, with the vendored make.fun library.
//
// Play it locally with any static server, for example:
//   cd game && python3 -m http.server 8080
// then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The game and its screenshots are the whole entry: refuse to hand in an
// empty folder rather than silently submitting nothing.
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) {
  console.error('game/index.html is missing: nothing to hand in');
  process.exit(1);
}
if (!existsSync(shotsDir) || readdirSync(shotsDir).filter((f) => !f.startsWith('.')).length === 0) {
  console.error('screenshots/ is missing or empty: the entry needs 3 or 4 screenshots');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB
// of game files, in all, or a path under game/ over 1000 bytes).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(
  `handed in ${statSync(join(out, 'dossier.json')).size} bytes of dossier for ` +
    `${readdirSync(join(out, 'screenshots')).length} screenshots`,
);
