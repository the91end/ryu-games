// Play a Song: a toddler-sized "Guitar Hero". Colored notes fall down 4 big
// lanes; tap the pad when a note reaches it. Whatever lane is tapped, the
// song's real melody note plays, so it always sounds right. A note that reaches
// the pad waits there until it's tapped — you can't fail.
//
// Songs come from games/songs.js. Each song's pitches are spread over the
// 4 lanes, low notes on the left, high notes on the right.

import { NOTES, SONGS } from './songs.js';

const LANE_COLORS = ['#ff5d5d', '#ffd23f', '#3ec1d3', '#a66cff'];
const TRAVEL = 2.8; // seconds for a note to fall from the top to the pad
const BEAT = 0.75;  // seconds between notes
const CHEER = { en: 'Yay! You played the song!', id: 'Hore! Kamu pintar main lagu!' };

const freqOf = Object.fromEntries(NOTES.map((n) => [n.name, n.freq]));
const rankOf = Object.fromEntries(NOTES.map((n, i) => [n.name, i]));

function buildChart(song) {
  const names = song.notes.split(/\s+/);
  const used = [...new Set(names)].sort((a, b) => rankOf[a] - rankOf[b]);
  const laneOf = (n) => Math.min(3, Math.floor((used.indexOf(n) * 4) / used.length));
  return names.map((n, i) => ({ lane: laneOf(n), freq: freqOf[n], time: 1 + i * BEAT, hit: false }));
}

export default {
  start(stage, kit) {
    stage.style.background = '#1b1f3b';
    const { ctx } = kit.canvas2d();

    // ---------- song picker (DOM overlay) ----------
    const picker = document.createElement('div');
    picker.innerHTML = `
      <style>
        .ps-pick { position:absolute; inset:0; z-index:5; background:#1b1f3b; overflow-y:auto; touch-action:pan-y;
          display:grid; gap:16px; padding:110px 16px 16px; align-content:start;
          grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); grid-auto-rows:150px; }
        .ps-song { border-radius:28px; background:var(--c); display:flex; flex-direction:column; align-items:center;
          justify-content:center; gap:6px; padding:8px; box-shadow:0 8px 0 rgba(0,0,0,.25); }
        .ps-song:active { transform:translateY(6px); box-shadow:0 2px 0 rgba(0,0,0,.25); }
        .ps-song .e { font-size:64px; line-height:1; }
        .ps-song .l { font-size:17px; font-weight:800; text-align:center; text-shadow:0 2px 0 rgba(0,0,0,.25); }
      </style>
      <div class="ps-pick"></div>`;
    stage.appendChild(picker);
    const grid = picker.querySelector('.ps-pick');

    const songs = [...SONGS].sort((a, b) => (b.lang === kit.lang) - (a.lang === kit.lang));
    songs.forEach((song, i) => {
      const b = document.createElement('button');
      b.className = 'ps-song';
      b.style.setProperty('--c', LANE_COLORS[i % 4]);
      b.innerHTML = `<span class="e emoji">${song.emoji}</span><span class="l">${kit.tr(song.title)}</span>`;
      kit.on(b, 'click', () => startSong(song));
      grid.appendChild(b);
    });

    // ---------- game state ----------
    let chart = null;     // notes of the current song
    let t = 0;            // chart time (freezes while a note waits at the pad)
    let finished = false;
    const flash = [0, 0, 0, 0];
    const particles = [];

    function startSong(song) {
      chart = buildChart(song);
      t = 0;
      finished = false;
      picker.hidden = true;
      kit.say(song.title);
    }

    function showPicker() {
      chart = null;
      picker.hidden = false;
    }

    // ---------- layout ----------
    const layout = () => {
      const W = kit.width, H = kit.height;
      const laneW = W / 4;
      const padH = Math.min(H * 0.22, 200);
      const hitY = H - padH / 2 - 8;
      const r = Math.min(laneW * 0.36, padH * 0.4, 70);
      return { W, H, laneW, padH, hitY, r };
    };
    const noteY = (n, L) => L.hitY - ((n.time - t) / TRAVEL) * (L.hitY + L.r);

    function burst(x, y, color, count = 16) {
      for (let k = 0; k < count; k++) {
        const a = Math.random() * Math.PI * 2;
        const v = kit.random(120, 380);
        particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, life: 0.8, color });
      }
    }

    // ---------- input ----------
    kit.onTap((x, y) => {
      if (!chart) return;
      const L = layout();
      const lane = Math.max(0, Math.min(3, Math.floor(x / L.laneW)));
      flash[lane] = 1;
      kit.vibrate(15);

      // Generous hit window: anything in this lane in the bottom ~40% of the screen
      let best = null;
      for (const n of chart) {
        if (n.hit || n.lane !== lane) continue;
        const ny = noteY(n, L);
        if (ny > L.hitY - L.H * 0.4 && (!best || ny > noteY(best, L))) best = n;
      }
      if (best) {
        best.hit = true;
        kit.sound.tone(best.freq, 0.5, 'triangle', 0.35);
        burst((lane + 0.5) * L.laneW, Math.min(noteY(best, L), L.hitY), LANE_COLORS[lane]);
      } else {
        kit.sound.tone(180 + lane * 40, 0.08, 'sine', 0.1); // soft "thud", never a fail sound
      }
    });

    // ---------- loop ----------
    kit.loop((dt, now) => {
      const L = layout();
      ctx.clearRect(0, 0, L.W, L.H);

      // Lanes
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)';
        ctx.fillRect(i * L.laneW, 0, L.laneW, L.H);
      }

      if (chart) {
        // Advance time, but hold while the next unhit note is sitting on the pad
        const next = chart.find((n) => !n.hit);
        t += dt;
        if (next && t > next.time) t = next.time;
        if (!next && !finished) {
          finished = true;
          kit.say(CHEER);
          [0, 2, 4, 7].forEach((n, j) => kit.setTimeout(() => kit.sound.tone(NOTES[n].freq, 0.4, 'triangle'), j * 130));
          for (let k = 0; k < 6; k++) burst(kit.random(0, L.W), kit.random(0, L.H * 0.6), kit.pick(LANE_COLORS), 20);
          kit.setTimeout(showPicker, 3500);
        }

        // Falling notes
        for (const n of chart) {
          if (n.hit) continue;
          const y = noteY(n, L);
          if (y < -L.r) continue;
          const x = (n.lane + 0.5) * L.laneW;
          const waiting = next === n && t >= n.time;
          const s = waiting ? 1 + Math.sin(now * 8) * 0.08 : 1;
          ctx.fillStyle = LANE_COLORS[n.lane];
          ctx.beginPath();
          ctx.arc(x, y, L.r * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.beginPath();
          ctx.arc(x - L.r * 0.3, y - L.r * 0.3, L.r * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pads
        for (let i = 0; i < 4; i++) {
          flash[i] = Math.max(0, flash[i] - dt * 4);
          const waitingHere = next && next.lane === i && t >= next.time;
          const x = i * L.laneW + 8, w = L.laneW - 16, y = L.H - L.padH, h = L.padH - 8;
          ctx.globalAlpha = 0.35 + flash[i] * 0.65 + (waitingHere ? 0.25 + Math.sin(now * 8) * 0.15 : 0);
          ctx.fillStyle = LANE_COLORS[i];
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, 24);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 6;
          ctx.strokeStyle = LANE_COLORS[i];
          ctx.beginPath();
          ctx.arc((i + 0.5) * L.laneW, L.hitY, L.r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.vy += 500 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.min(1, p.life / 0.5);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  },
};
