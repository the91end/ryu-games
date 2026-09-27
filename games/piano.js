// Toddler piano: 8 big rainbow keys. Pick a song and the next key glows —
// tap it to play along. Any key can be tapped at any time; there are no
// wrong notes.
//
// Adding a song: write its melody with the key names below (C D E F G A B C2),
// space-separated. The melody must fit in one octave (C to C2).
// `lang` puts songs of the current language first (e.g. Indonesian songs when
// the app is in Bahasa Indonesia). The Indonesian melodies are approximate.

const KEYS = [
  { name: 'C',  freq: 261.63, color: '#ff5d5d' },
  { name: 'D',  freq: 293.66, color: '#ff8c42' },
  { name: 'E',  freq: 329.63, color: '#ffd23f' },
  { name: 'F',  freq: 349.23, color: '#7bd389' },
  { name: 'G',  freq: 392.0,  color: '#3ec1d3' },
  { name: 'A',  freq: 440.0,  color: '#4d96ff' },
  { name: 'B',  freq: 493.88, color: '#a66cff' },
  { name: 'C2', freq: 523.25, color: '#ff5d8f' },
];

const SONGS = [
  {
    lang: 'id',
    emoji: '🎈',
    title: 'Balonku Ada Lima',
    notes: 'G E G E G C2 B A G F D F D F B A G F E G E G E G C2 B A G F D F A G F E D C',
  },
  {
    lang: 'id',
    emoji: '🦎',
    title: 'Cicak-cicak di Dinding',
    notes: 'C D E C E F G G A G F E D E C E F G A G F E D E D C',
  },
  {
    lang: 'id',
    emoji: '🌈',
    title: 'Pelangi-pelangi',
    notes: 'C E G G A G E C D F A A G F E D E G C2 C2 B A G E F A G F E D C',
  },
  {
    lang: 'id',
    emoji: '🌟',
    title: 'Bintang Kecil',
    notes: 'G G E G C2 A G F F D F A G F E E D E G F E D D C D E D C',
  },
  {
    lang: 'id',
    emoji: '🚂',
    title: 'Naik Kereta Api',
    notes: 'C E G G G E C D F A A G F E G G G E C D E F G G G F E D C',
  },
  {
    lang: 'id',
    emoji: '🦜',
    title: 'Burung Kakak Tua',
    notes: 'G E E E F G G A G F E D E F F F G A A B A G F E D C',
  },
  {
    lang: 'en',
    emoji: '⭐',
    title: { en: 'Twinkle Twinkle Little Star', id: 'Twinkle Twinkle Little Star' },
    notes: 'C C G G A A G F F E E D D C G G F F E E D G G F F E E D C C G G A A G F F E E D D C',
  },
  {
    lang: 'en',
    emoji: '🐑',
    title: { en: 'Mary Had a Little Lamb', id: 'Mary Had a Little Lamb' },
    notes: 'E D C D E E E D D D E G G E D C D E E E E D D E D C',
  },
  {
    lang: 'en',
    emoji: '🚣',
    title: { en: 'Row, Row, Row Your Boat', id: 'Row, Row, Row Your Boat' },
    notes: 'C C C D E E D E F G C2 C2 C2 G G G E E E C C C G F E D C',
  },
  {
    lang: 'en',
    emoji: '🐮',
    title: { en: 'Old MacDonald', id: 'Old MacDonald' },
    notes: 'C C C G A A G E E D D C G C C C G A A G E E D D C',
  },
  {
    lang: 'en',
    emoji: '🎶',
    title: { en: 'Ode to Joy', id: 'Ode to Joy' },
    notes: 'E E F G G F E D C C D E E D D E E F G G F E D C C D E D C C',
  },
];

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
        .keys { flex:1; display:flex; gap:6px; padding:0 6px 6px; }
        .keys.portrait { flex-direction:column-reverse; } /* low notes at the bottom */
        .key { flex:1; border-radius:18px; background:var(--c); position:relative;
          box-shadow:inset 0 -10px 0 rgba(0,0,0,.2); transition:transform .08s, filter .08s; }
        .key.down { transform:scale(.96); filter:brightness(1.3); }
        .key.next { outline:8px solid #fff; outline-offset:-8px; animation:glow .8s ease-in-out infinite; }
        .key.next::after { content:'⭐'; position:absolute; left:50%; top:50%;
          transform:translate(-50%,-50%); font-size:min(12vmin, 70px); }
        @keyframes glow { 50% { filter:brightness(1.35); } }
      </style>
      <div class="piano">
        <div class="songs"></div>
        <div class="keys"></div>
      </div>`;

    const songBar = stage.querySelector('.songs');
    const keysEl = stage.querySelector('.keys');
    const indexOf = Object.fromEntries(KEYS.map((k, i) => [k.name, i]));

    let song = null; // { notes: number[], pos, button }

    const keyEls = KEYS.map((k, i) => {
      const el = document.createElement('div');
      el.className = 'key';
      el.style.setProperty('--c', k.color);
      keysEl.appendChild(el);
      kit.on(el, 'pointerdown', () => press(i));
      for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
        kit.on(el, ev, () => el.classList.remove('down'));
      }
      return el;
    });

    kit.onResize((w, h) => keysEl.classList.toggle('portrait', h > w));

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
        [0, 2, 4, 7].forEach((n, j) => kit.setTimeout(() => kit.sound.tone(KEYS[n].freq, 0.4, 'triangle'), j * 130));
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
        song = { notes: s.notes.split(/\s+/).map((n) => indexOf[n]), pos: 0, button: btn };
        highlightNext();
      });
      songBar.appendChild(btn);
    }
  },
};
