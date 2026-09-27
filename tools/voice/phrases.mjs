// Collects every phrase the app speaks, in English and Indonesian, and writes
// tools/voice/phrases.json for generate.py. Run from the repo root:
//   node tools/voice/phrases.mjs
//
// Sources: the flash card data, songs, game names, every `{ en: '…', id: '…' }`
// literal in js/ and games/, numbers 1–100 (Whack-a-Mole counting) and letter names.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { CATEGORIES } from '../../games/flashcards-data.js';
import { SONGS } from '../../games/songs.js';
import { GAMES } from '../../games/registry.js';

/** Must match slug() in js/voice.js. */
export function slug(text) {
  return String(text)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// How each letter's name should be pronounced
const LETTERS = {
  en: 'ay bee see dee ee ef jee aitch eye jay kay el em en oh pee cue ar ess tee you vee double-you ex why zee',
  id: 'a be ce de e ef ge ha i je ka el em en o pe ki er es te u fe we eks ye zet',
};

const phrases = { en: new Map(), id: new Map() };
const add = (lang, text, spoken = text) => {
  if (!text) return;
  const key = slug(text);
  if (key && !phrases[lang].has(key)) phrases[lang].set(key, spoken);
};
const addPair = (v) => {
  if (!v) return;
  if (typeof v === 'string') { add('en', v); add('id', v); return; }
  add('en', v.en);
  add('id', v.id ?? v.en);
};

for (const cat of CATEGORIES) {
  addPair(cat.name);
  for (const c of cat.cards) { addPair(c.name); addPair(c.sound); }
}
// English songs keep their English title (and English voice) in Indonesian mode
const englishInId = new Set();
for (const s of SONGS) {
  addPair(s.title);
  if (s.lang === 'en') englishInId.add(slug(typeof s.title === 'string' ? s.title : s.title.en));
}
for (const g of GAMES) addPair(g.name);

// Every inline { en: '…', id: '…' } in the code (cheers, color names, …)
for (const dir of ['js', 'games']) {
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of src.matchAll(/\{\s*en:\s*'([^']+)',\s*id:\s*'([^']+)'\s*\}/g)) addPair({ en: m[1], id: m[2] });
  }
}

for (let n = 1; n <= 100; n++) addPair(String(n));

// Spoken with energy: names get an exclamation mark, single letters (ABC cards)
// are said by their letter name.
const lively = (t) => (/[!?.]$/.test(t) ? t : `${t}!`);
const out = [];
for (const lang of ['en', 'id']) {
  const names = LETTERS[lang].split(' ').map((n) => n.replace('-', ' '));
  for (const [key, text] of phrases[lang]) {
    const letter = /^[a-z]$/.test(key) ? names[key.charCodeAt(0) - 97] : null;
    const entry = { lang, key, text: lively(letter ?? text) };
    if (lang === 'id' && englishInId.has(key)) entry.engine = 'en';
    out.push(entry);
  }
  names.forEach((name, i) => out.push({ lang, key: `letter-${String.fromCharCode(97 + i)}`, text: lively(name) }));
}
writeFileSync('tools/voice/phrases.json', JSON.stringify(out, null, 1));
console.log(`${out.length} phrases (${out.filter((p) => p.lang === 'en').length} en, ${out.filter((p) => p.lang === 'id').length} id)`);
