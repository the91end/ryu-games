// Toddler piano: 8 big rainbow keys. Pick a song and the next key glows —
// tap it to play along. Any key can be tapped at any time; there are no
// wrong notes.
//
// Adding a song: write its melody with the key names below (C D E F G A B C2),
// space-separated. The melody must fit in one octave (C to C2).

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
    emoji: '⭐',
    title: { en: 'Twinkle Twinkle Little Star', id: 'Twinkle Twinkle Little Star' },
    notes: 'C C G G A A G F F E E D D C G G F F E E D G G F F E E D C C G G A A G F F E E D D C',
  },
  {
    emoji: '🐑',
    title: { en: 'Mary Had a Little Lamb', id: 'Mary Had a Little Lamb' },
    notes: 'E D C D E E E D D D E G G E D C D E E E E D D E D C',
  },
  {
    emoji: '🚣',
    title: { en: 'Row, Row, Row Your Boat', id: 'Row, Row, Row Your Boat' },
    notes: 'C C C D E E D E F G C2 C2 C2 G G G E E E C C C G F E D C',
  },
  {
    emoji: '🐮',
    title: { en: 'Old MacDonald', id: 'Old MacDonald' },
    notes: 'C C C G A A G E E D D C G C C C G A A G E E D D C',
  },
  {
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
        .songs { display:flex; flex-wrap:wrap; gap:10px; padding:12px 12px 12px 110px; flex:none; min-height:104px; align-items:center; }
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

    for (const s of SONGS) {
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
