// Flash cards: pick a category, then flip through big picture cards.
//   - The name is written and spoken in the selected language.
//   - Tap the picture: hear the name (and its sound, e.g. "Woof woof!").
//   - Tap the word: it's spelled out letter by letter.
//   - Swipe or tap the big arrows for the next card.
// Content lives in games/flashcards-data.js; recordings in sounds/<category>/<id>.mp3.

import { CATEGORIES } from './flashcards-data.js';

const ANNOUNCE_DELAY = 500; // ms after a card appears before its name is spoken
const NAV_THROTTLE = 700;   // ms minimum between card changes (arrows or swipes)

const CHEERS = [
  { en: 'Great job!', id: 'Hebat!' },
  { en: 'Well done!', id: 'Pintar sekali!' },
  { en: 'Yay! You did it!', id: 'Hore! Bagus!' },
];

const missingAudio = new Set(); // remember 404s so we fall back to speech instantly

export default {
  start(stage, kit) {
    stage.innerHTML = `
      <style>
        .fc { position:absolute; inset:0; display:flex; flex-direction:column; background:#1b1f3b;
          padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); }
        .fc-bar { flex:none; height:104px; display:flex; align-items:center; justify-content:flex-end;
          gap:12px; padding:0 12px 0 110px; }
        .fc-btn { font-family:var(--emoji-font); width:80px; height:80px; border-radius:24px; background:rgba(255,255,255,.18);
          font-size:44px; line-height:1; display:grid; place-items:center; flex:none; }
        .fc-btn:active { transform:scale(.92); }
        .fc [hidden] { display:none !important; }

        .fc-cats { flex:1; overflow-y:auto; touch-action:pan-y; display:grid; gap:16px; padding:0 16px 16px;
          grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); grid-auto-rows:150px; }
        .fc-cat { border-radius:28px; background:var(--c); display:flex; flex-direction:column; align-items:center;
          justify-content:center; gap:6px; box-shadow:0 8px 0 rgba(0,0,0,.25); }
        .fc-cat:active { transform:translateY(6px); box-shadow:0 2px 0 rgba(0,0,0,.25); }
        .fc-cat .e { font-size:72px; line-height:1; }
        .fc-cat .l { font-size:20px; font-weight:800; text-align:center; padding:0 6px; text-shadow:0 2px 0 rgba(0,0,0,.25); }

        .fc-view { flex:1; display:flex; align-items:center; gap:12px; padding:0 12px 12px; min-height:0; }
        .fc-view.portrait { flex-direction:column; }
        .fc-card { flex:1; align-self:stretch; min-height:0; border-radius:36px; background:#fff; color:#1b1f3b;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2vmin; padding:3vmin;
          box-shadow:0 12px 0 var(--c, #ff8c42); touch-action:none; transition:transform .25s, opacity .25s; }
        .fc-card.out-left { transform:translateX(-30%) rotate(-6deg); opacity:0; }
        .fc-card.out-right { transform:translateX(30%) rotate(6deg); opacity:0; }
        .fc-pic { font-size:min(38vmin, 260px); line-height:1.1; font-family:var(--emoji-font); }
        .fc-pic.text { font-family:system-ui,sans-serif; font-weight:900; color:var(--c, #ff8c42); }
        .fc-pic.bounce { animation:fcb .45s; }
        @keyframes fcb { 40% { transform:scale(1.15) rotate(-4deg); } }
        .fc-swatch { width:min(40vmin, 260px); height:min(40vmin, 260px); border-radius:50%;
          border:6px solid rgba(0,0,0,.15); }
        .fc-extra { font-family:var(--emoji-font); font-size:min(6vmin, 40px); letter-spacing:4px; text-align:center; max-width:100%; }
        .fc-word { display:flex; flex-wrap:wrap; justify-content:center; font-size:min(12vmin, 84px);
          font-weight:900; letter-spacing:.04em; text-align:center; }
        .fc-word span { display:inline-block; transition:transform .15s, color .15s; }
        .fc-word span.lit { color:var(--c, #ff8c42); transform:translateY(-12%) scale(1.25); }
        .fc-nav { flex:none; width:96px; height:96px; border-radius:50%; background:var(--c, #ff8c42);
          font-size:52px; box-shadow:0 8px 0 rgba(0,0,0,.25); }
        .fc-nav:active { transform:translateY(6px); box-shadow:0 2px 0 rgba(0,0,0,.25); }
        .fc-navs { display:contents; }
        .fc-view.portrait .fc-navs { display:flex; justify-content:space-between; width:100%; order:2; }
      </style>
      <div class="fc">
        <div class="fc-bar">
          <button class="fc-btn" data-act="sound" hidden>📣</button>
          <button class="fc-btn" data-act="say">🔊</button>
          <button class="fc-btn" data-act="cats">🗂️</button>
        </div>
        <div class="fc-cats"></div>
        <div class="fc-view" hidden>
          <div class="fc-navs">
            <button class="fc-nav" data-act="prev">◀</button>
            <button class="fc-nav" data-act="next" style="order:3">▶</button>
          </div>
          <div class="fc-card">
            <div class="fc-pic"></div>
            <div class="fc-extra"></div>
            <div class="fc-word"></div>
          </div>
        </div>
      </div>`;

    const $ = (s) => stage.querySelector(s);
    const catsEl = $('.fc-cats');
    const view = $('.fc-view');
    const cardEl = $('.fc-card');
    const picEl = $('.fc-pic');
    const extraEl = $('.fc-extra');
    const wordEl = $('.fc-word');
    const btn = (act) => stage.querySelector(`[data-act="${act}"]`);

    let category = null;
    let index = 0;
    let audio = null;
    let pending = []; // timers for spelling / queued speech, cancelled on every card change

    kit.onResize((w, h) => view.classList.toggle('portrait', h > w));
    kit.addCleanup(() => audio?.pause());

    // ---------- speech / sound helpers ----------
    function cancelPending() {
      pending.forEach(clearTimeout);
      pending = [];
      audio?.pause();
      wordEl.querySelectorAll('.lit').forEach((s) => s.classList.remove('lit'));
    }
    const later = (fn, ms) => pending.push(kit.setTimeout(fn, ms));

    const current = () => category.cards[index];

    function sayName() {
      kit.say(current().name);
      picEl.classList.remove('bounce');
      void picEl.offsetWidth; // restart animation
      picEl.classList.add('bounce');
    }

    function playSound() {
      const c = current();
      if (!c.sound) return;
      const key = c.audio || `${category.id}/${c.id}`;
      const speak = () => kit.say(c.sound);
      if (missingAudio.has(key)) return speak();
      audio?.pause();
      audio = new Audio(`sounds/${key}.mp3`);
      audio.play().catch(() => { missingAudio.add(key); speak(); });
    }

    // Letter by letter, then the whole word, then a cheer: "C! A! T! Cat! Great job!"
    function spell() {
      cancelPending();
      const spans = [...wordEl.children];
      const letters = spans.filter((s) => /\p{L}|\p{N}/u.test(s.textContent));
      const STEP = 750;
      letters.forEach((s, i) => later(() => {
        spans.forEach((x) => x.classList.remove('lit'));
        s.classList.add('lit');
        kit.sayLetter(s.textContent);
        kit.sound.note(i); // a rising little tune under the letters
      }, i * STEP));
      const end = letters.length * STEP + 150;
      later(() => {
        spans.forEach((x) => x.classList.add('lit'));
        kit.say(current().name);
        picEl.classList.remove('bounce');
        void picEl.offsetWidth;
        picEl.classList.add('bounce');
      }, end);
      later(() => {
        spans.forEach((x) => x.classList.remove('lit'));
        kit.say(kit.pick(CHEERS));
      }, end + 1300);
    }

    // ---------- rendering ----------
    function showCategories() {
      cancelPending();
      category = null;
      view.hidden = true;
      catsEl.hidden = false;
      btn('say').hidden = true;
      btn('sound').hidden = true;
      btn('cats').hidden = true;
      catsEl.innerHTML = '';
      for (const cat of CATEGORIES) {
        const b = document.createElement('button');
        b.className = 'fc-cat';
        b.style.setProperty('--c', cat.color);
        b.innerHTML = `<span class="e emoji">${cat.emoji}</span><span class="l">${kit.tr(cat.name)}</span>`;
        b.addEventListener('click', () => openCategory(cat));
        catsEl.appendChild(b);
      }
    }

    function openCategory(cat) {
      category = cat;
      index = 0;
      catsEl.hidden = true;
      view.hidden = false;
      btn('say').hidden = false;
      btn('cats').hidden = false;
      stage.querySelector('.fc').style.setProperty('--c', cat.color);
      kit.say(cat.name);
      renderCard(false);
    }

    function renderCard(announce = true) {
      cancelPending();
      const c = current();
      picEl.innerHTML = '';
      if (c.swatch) {
        const sw = document.createElement('div');
        sw.className = 'fc-swatch';
        sw.style.background = c.swatch;
        picEl.appendChild(sw);
      } else {
        picEl.textContent = c.emoji;
      }
      // Numbers and letters are drawn as big bold text, not emoji
      picEl.classList.toggle('text', /^[\p{L}\p{N}]+$/u.test(c.emoji));
      extraEl.textContent = c.extra || '';
      extraEl.hidden = !c.extra;
      wordEl.innerHTML = '';
      for (const ch of kit.tr(c.name)) {
        const s = document.createElement('span');
        s.textContent = ch === ' ' ? ' ' : ch;
        wordEl.appendChild(s);
      }
      btn('sound').hidden = !c.sound;
      // Give the card a moment to appear before it talks
      if (announce) later(sayName, ANNOUNCE_DELAY);
    }

    // Throttled: a toddler mashing the arrows moves one card at a time
    let lastNav = 0;
    function go(step) {
      if (!category) return;
      const now = performance.now();
      if (now - lastNav < NAV_THROTTLE) return;
      lastNav = now;
      const n = category.cards.length;
      index = (index + step + n) % n;
      cardEl.classList.add(step > 0 ? 'out-left' : 'out-right');
      kit.sound.tone(step > 0 ? 660 : 520, 0.12, 'triangle', 0.2);
      kit.setTimeout(() => {
        cardEl.classList.remove('out-left', 'out-right');
        renderCard();
      }, 200);
    }

    // ---------- input ----------
    kit.on(btn('prev'), 'click', () => go(-1));
    kit.on(btn('next'), 'click', () => go(1));
    kit.on(btn('say'), 'click', () => { cancelPending(); sayName(); });
    kit.on(btn('sound'), 'click', () => { cancelPending(); playSound(); });
    kit.on(btn('cats'), 'click', showCategories);
    kit.on(wordEl, 'click', (e) => { e.stopPropagation(); spell(); });

    // Tap the picture: name, then its sound. Swipe the card: next / previous.
    let downX = null;
    kit.on(cardEl, 'pointerdown', (e) => { downX = e.clientX; });
    kit.on(cardEl, 'pointerup', (e) => {
      if (downX == null) return;
      const dx = e.clientX - downX;
      downX = null;
      if (Math.abs(dx) > 60) return go(dx < 0 ? 1 : -1);
      if (wordEl.contains(e.target)) return; // handled by spell()
      cancelPending();
      sayName();
      if (current().sound) later(playSound, 900);
    });

    showCategories();
  },
};
