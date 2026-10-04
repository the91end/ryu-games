// Toddler piano: a grid of 5 octaves (C2–B6, 35 big keys), read like a book:
// the lowest note is top-left, going right through C D E F G A B, then down to
// the next octave, ending with the highest note bottom-right. Each note keeps
// its rainbow color, lighter going up and darker going down.
// Pick a song and the next key glows — tap it to play along. Any key can be
// tapped at any time; there are no wrong notes.
//
// Songs live in games/songs.js (shared with the Play a Song game).

import { SONGS } from './songs.js';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const COLORS = ['#ff5d5d', '#ff8c42', '#ffd23f', '#7bd389', '#3ec1d3', '#4d96ff', '#a66cff'];
const OCTAVES = [2, 3, 4, 5, 6];

const KEYS = [];
for (const octave of OCTAVES) {
  LETTERS.forEach((letter, n) => {
    const midi = 12 * (octave + 1) + SEMITONE[letter];
    KEYS.push({ letter, octave, n, color: COLORS[n], freq: 440 * 2 ** ((midi - 69) / 12) });
  });
}

// Song note names (see songs.js): G0 A0 B0 = octave 3, C..B = octave 4, C2 D2 E2 = octave 5
const keyFor = (name) => {
  const letter = name[0];
  const octave = name.endsWith('0') ? 3 : name.endsWith('2') ? 5 : 4;
  return (octave - OCTAVES[0]) * LETTERS.length + LETTERS.indexOf(letter);
};

const CHEER = { en: 'Yay! Well done!', id: 'Hore! Pintar!' };

export default {
  start(stage, kit) {
    stage.innerHTML = `
      <style>
        .piano { position:absolute; inset:0; display:flex; flex-direction:column; background:#1b1f3b; }
        /* One row of songs; swipe sideways for more */
        .songs { display:flex; gap:10px; padding:12px 12px 12px 110px; flex:none; align-items:center;
          overflow-x:auto; touch-action:pan-x; scrollbar-width:none; }
        .songs::-webkit-scrollbar { display:none; }
        .song { flex:none; width:72px; height:72px; border-radius:22px; font-size:40px;
          background:rgba(255,255,255,.15); transition:transform .1s; }
        .song.active { background:#fff; transform:scale(1.08); }
        .keys { flex:1; display:grid; gap:5px; padding:0 6px 6px; min-height:0; }
        .key { border-radius:14px; position:relative; min-width:0; min-height:0;
          background:color-mix(in srgb, var(--c), var(--mix) var(--amt));
          box-shadow:inset 0 -8px 0 rgba(0,0,0,.2); transition:transform .08s, filter .08s; }
        .key.down { transform:scale(.94); filter:brightness(1.35); }
        .key.next { outline:6px solid #fff; outline-offset:-6px; animation:glow .8s ease-in-out infinite; }
        .key.next::after { content:'⭐'; position:absolute; left:50%; top:50%;
          transform:translate(-50%,-50%); font-size:min(7vmin, 44px); }
        @keyframes glow { 50% { filter:brightness(1.35); } }
      </style>
      <div class="piano">
        <div class="songs"></div>
        <div class="keys"></div>
      </div>`;

    const songBar = stage.querySelector('.songs');
    const keysEl = stage.querySelector('.keys');

    let song = null; // { notes: number[], pos, button }

    const keyEls = KEYS.map((k, i) => {
      const el = document.createElement('div');
      el.className = 'key';
      el.style.setProperty('--c', k.color);
      // Octave 4 is the pure color; higher octaves are mixed with white, lower with black
      const step = k.octave - 4;
      el.style.setProperty('--mix', step >= 0 ? '#fff' : '#000');
      el.style.setProperty('--amt', `${Math.abs(step) * (step >= 0 ? 22 : 18)}%`);
      keysEl.appendChild(el);
      kit.on(el, 'pointerdown', () => press(i));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
        kit.on(el, ev, () => el.classList.remove('down'));
      }
      return el;
    });

    // One octave per row (C..B), lowest octave at the top
    keysEl.style.gridTemplateColumns = `repeat(${LETTERS.length}, 1fr)`;
    keysEl.style.gridTemplateRows = `repeat(${OCTAVES.length}, 1fr)`;

    function highlightNext() {
      keyEls.forEach((el) => el.classList.remove('next'));
      if (song) keyEls[song.notes[song.pos]].classList.add('next');
    }

    function press(i) {
      keyEls[i].classList.add('down');
      kit.sound.tone(KEYS[i].freq, 0.6, 'triangle', 0.35);
      kit.vibrate(10);
      if (song && i === song.notes[song.pos]) {
        song.pos++;
        if (song.pos >= song.notes.length) finishSong();
        else highlightNext();
      }
    }

    function finishSong() {
      song.button.classList.remove('active');
      song = null;
      highlightNext();
      kit.setTimeout(() => {
        ['C4', 'E4', 'G4', 'C5'].forEach((name, j) => {
          const k = KEYS.find((x) => `${x.letter}${x.octave}` === name);
          kit.setTimeout(() => kit.sound.tone(k.freq, 0.4, 'triangle'), j * 130);
        });
        kit.setTimeout(() => kit.say(CHEER), 600);
      }, 400);
    }

    // Songs in the current language first
    const songs = [...SONGS].sort((a, b) => (b.lang === kit.lang) - (a.lang === kit.lang));
    for (const s of songs) {
      const btn = document.createElement('button');
      btn.className = 'song emoji';
      btn.textContent = s.emoji;
      btn.setAttribute('aria-label', kit.tr(s.title));
      kit.on(btn, 'click', () => {
        songBar.querySelectorAll('.song').forEach((b) => b.classList.remove('active'));
        if (song?.button === btn) { song = null; highlightNext(); return; } // tap again = free play
        btn.classList.add('active');
        song = { notes: s.notes.split(/\s+/).map(keyFor), pos: 0, button: btn };
        highlightNext();
      });
      songBar.appendChild(btn);
    }
  },
};
