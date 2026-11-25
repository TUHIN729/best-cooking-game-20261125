// main.ts — hands in Ember Kitchen (Node 22, standard library only).
//
// The game is plain static files under game/ (index.html plus ES modules, no
// library and no network request). This program copies game/ and screenshots/
// from beside this file into the output directory and writes dossier.json with
// buildDossier from the vendored make.fun library.
//
// The grader mounts /output root-owned, so this program never removes the output
// directory itself: it only clears the directory's contents before writing.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear only the contents of the output directory, never the directory itself.
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) {
  rmSync(join(out, name), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the dossier bytes; the rest
// refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files in all, or a path
// under game/ over 1000 bytes).
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);

// The grader runs this program twice and requires identical bytes both times,
// so self-check here: rebuild the dossier from the same output and refuse to
// finish if the two builds ever disagree.
const again = buildDossier(out, caps);
if (!Buffer.from(dossier).equals(Buffer.from(again))) {
  throw new Error('dossier is not deterministic: two builds differ');
}
