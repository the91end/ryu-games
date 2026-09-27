// Whack-a-Mole, toddler edition: slow moles, huge holes, no way to lose.
// Every bonk is counted out loud (in English or Indonesian).

const MOLES = ['🐹', '🐰', '🐻', '🐸', '🐷'];
const CHEER = { en: 'Yay!', id: 'Hore!' };

export default {
  start(stage, kit) {
    stage.innerHTML = `
      <style>
        .mole-wrap { position:absolute; inset:0; display:flex; flex-direction:column; background:#7bd389; }
        .mole-score { height:100px; display:flex; align-items:center; justify-content:flex-end;
          padding:0 24px; font-size:56px; font-weight:800; color:#fff; text-shadow:0 3px 0 rgba(0,0,0,.2); }
        .mole-grid { flex:1; display:grid; gap:4vmin; padding:0 4vmin 4vmin; }
        .hole { position:relative; overflow:hidden; border-radius:50% 50% 40% 40% / 30% 30% 20% 20%;
          background:radial-gradient(ellipse at 50% 85%, #3b2a1a 0 45%, #5a3d22 46% 60%, transparent 61%); }
        .mole { position:absolute; left:50%; bottom:8%; font-size:min(22vmin, 150px); line-height:1;
          transform:translate(-50%, 110%); transition:transform .25s cubic-bezier(.3,1.5,.5,1); pointer-events:none; }
        .hole.up .mole { transform:translate(-50%, 0); }
        .hole.bonk .mole { transform:translate(-50%, 0) scale(1.2, .7); transition-duration:.1s; }
        .burst { position:absolute; font-size:min(14vmin, 100px); pointer-events:none;
          animation:burst .7s ease-out forwards; }
        @keyframes burst { from { transform:translate(-50%,-50%) scale(.3); opacity:1 }
                           to   { transform:translate(-50%,-160%) scale(1.3); opacity:0 } }
      </style>
      <div class="mole-wrap">
        <div class="mole-score">⭐ <span id="mole-count">0</span></div>
        <div class="mole-grid"></div>
      </div>`;

    const grid = stage.querySelector('.mole-grid');
    const countEl = stage.querySelector('#mole-count');
    let score = 0;

    // 6 holes: 3x2 in landscape, 2x3 in portrait — always big
    const holes = [];
    for (let i = 0; i < 6; i++) {
      const hole = document.createElement('div');
      hole.className = 'hole';
      hole.innerHTML = '<span class="mole emoji"></span>';
      grid.appendChild(hole);
      holes.push({ el: hole, mole: hole.firstChild, up: false, timer: 0 });
    }
    kit.onResize((w, h) => {
      const landscape = w > h;
      grid.style.gridTemplateColumns = `repeat(${landscape ? 3 : 2}, 1fr)`;
      grid.style.gridTemplateRows = `repeat(${landscape ? 2 : 3}, 1fr)`;
    });

    function hide(h) {
      h.up = false;
      h.el.classList.remove('up', 'bonk');
    }

    function popUp() {
      const free = holes.filter((h) => !h.up);
      if (!free.length) return;
      const h = kit.pick(free);
      h.mole.textContent = kit.pick(MOLES);
      h.up = true;
      h.timer = kit.random(1.8, 2.8); // seconds visible — slow on purpose
      h.el.classList.add('up');
    }

    function burst(x, y, text) {
      const el = document.createElement('div');
      el.className = 'burst emoji';
      el.textContent = text;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      stage.appendChild(el);
      kit.setTimeout(() => el.remove(), 800);
    }

    for (const h of holes) {
      kit.on(h.el, 'pointerdown', (e) => {
        if (!h.up || h.el.classList.contains('bonk')) return;
        h.el.classList.add('bonk');
        kit.sound.tone(180, 0.12, 'square', 0.2);
        kit.vibrate(40);
        score++;
        countEl.textContent = score;
        const r = stage.getBoundingClientRect();
        burst(e.clientX - r.left, e.clientY - r.top, '⭐');

        if (score % 10 === 0) {
          kit.say(CHEER);
          [0, 1, 2, 3].forEach((n) => kit.setTimeout(() => kit.sound.note(n * 2), n * 120));
          for (let i = 0; i < 8; i++) burst(kit.random(0, kit.width), kit.random(0, kit.height), kit.pick(['🎉', '⭐', '🎈']));
        } else {
          kit.say(String(score)); // counting practice: "one, two…" / "satu, dua…"
        }
        kit.setTimeout(() => hide(h), 250);
      });
    }

    let spawnIn = 0.5;
    kit.loop((dt) => {
      spawnIn -= dt;
      if (spawnIn <= 0) {
        popUp();
        spawnIn = kit.random(0.9, 1.6);
      }
      for (const h of holes) {
        if (!h.up) continue;
        h.timer -= dt;
        if (h.timer <= 0 && !h.el.classList.contains('bonk')) hide(h);
      }
    });
  },
};
