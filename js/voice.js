// Recorded voice clips (generated with neural TTS, see tools/voice/). Every
// phrase the app says has a clip at voice/<lang>/<slug>.mp3, listed in
// voice/manifest.js. Phrases without a clip fall back to the browser's
// built-in speech.
//
// Clips are played through Web Audio (not <audio>) so they also work from
// timers, e.g. while spelling a word letter by letter on iOS.

import MANIFEST from '../voice/manifest.js';
import { getAudio } from './audio.js';

const available = Object.fromEntries(Object.entries(MANIFEST).map(([lang, slugs]) => [lang, new Set(slugs)]));
const buffers = new Map(); // url -> Promise<AudioBuffer>
let current = null;

/** "Mobil Polisi!" -> "mobil-polisi". Must match slug() in tools/voice/phrases.mjs. */
export function slug(text) {
  return String(text)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function hasClip(lang, key) {
  return available[lang]?.has(key) ?? false;
}

function load(url) {
  if (!buffers.has(url)) {
    const ac = getAudio();
    buffers.set(url, fetch(url)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then((data) => new Promise((ok, fail) => ac.decodeAudioData(data, ok, fail))));
  }
  return buffers.get(url);
}

export function stopClip() {
  try { current?.stop(); } catch { /* already stopped */ }
  current = null;
}

/** Plays voice/<lang>/<key>.mp3. Resolves false if it couldn't be played. */
export async function playClip(lang, key) {
  const ac = getAudio();
  if (!ac || !hasClip(lang, key)) return false;
  stopClip();
  try {
    const buffer = await load(`voice/${lang}/${key}.mp3`);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.connect(ac.destination);
    src.start();
    current = src;
    return true;
  } catch {
    return false;
  }
}
