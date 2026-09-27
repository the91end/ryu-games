import { playClip, slug } from './voice.js';

// Tiny i18n: English + Bahasa Indonesia. Add a language by adding a key to
// STRINGS and LANGS, then give every `name: { en, id }` in the registry a value.

export const LANGS = {
  en: { label: 'EN', flag: '🇬🇧', speech: 'en-US' },
  id: { label: 'ID', flag: '🇮🇩', speech: 'id-ID' },
};

const STRINGS = {
  en: {
    start: 'Start',
    install: 'Install app',
    language: 'Change language',
    back: 'Hold to go back to the menu',
    menu: 'Game menu',
  },
  id: {
    start: 'Mulai',
    install: 'Pasang aplikasi',
    language: 'Ganti bahasa',
    back: 'Tahan untuk kembali ke menu',
    menu: 'Menu permainan',
  },
};

const STORAGE_KEY = 'ryu-games.lang';

function detect() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS[saved]) return saved;
  } catch { /* storage blocked */ }
  return (navigator.language || 'en').toLowerCase().startsWith('id') ? 'id' : 'en';
}

let lang = detect();
const listeners = new Set();

export const getLang = () => lang;

export function setLang(next) {
  if (!LANGS[next] || next === lang) return;
  lang = next;
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  document.documentElement.lang = next;
  listeners.forEach((fn) => fn(lang));
}

export function nextLang() {
  const keys = Object.keys(LANGS);
  setLang(keys[(keys.indexOf(lang) + 1) % keys.length]);
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** UI string by key. */
export function t(key) {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Pick the current language from a { en, id } object (or pass a plain string through). */
export function tr(value) {
  if (value == null || typeof value === 'string') return value;
  return value[lang] ?? value.en;
}

/** Fill `data-i18n-aria="key"` attributes under root. */
export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  for (const el of root.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  }
}

/** Speak text aloud in the current language (great for naming colors, animals…).
 *  Uses a recorded natural voice clip when there is one, else the browser's voice. */
export function say(text) {
  const phrase = tr(text);
  if (!phrase) return;
  window.speechSynthesis?.cancel();
  const current = lang;
  playClip(current, slug(phrase)).then((ok) => { if (!ok && current === lang) speak(phrase); });
}

/** Say a single letter's name (A → "ay" / "a"), for spelling words out. */
export function sayLetter(letter) {
  const l = String(letter).toLowerCase();
  window.speechSynthesis?.cancel();
  playClip(lang, `letter-${slug(l)}`).then((ok) => { if (!ok) speak(l); });
}

function speak(text) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS[lang].speech;
  const voice = synth.getVoices().find((v) => v.lang.replace('_', '-').startsWith(u.lang.slice(0, 2)));
  if (voice) u.voice = voice;
  u.rate = 0.9;
  u.pitch = 1.2;
  synth.cancel();
  synth.speak(u);
}
