// The "kit" is a per-game toolbox handed to game.start(stage, kit).
// Everything registered through it (listeners, loops, timers, resize handlers)
// is cleaned up automatically when the game exits, so games only need a
// minimal stop() — or none at all.

import { getLang, t, tr, say, sayLetter } from './i18n.js';
import { getAudio } from './audio.js';

// Happy-sounding pentatonic scale: any sequence of these notes sounds nice
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

export const PALETTE = ['#ff5d8f', '#ffd23f', '#3ec1d3', '#7bd389', '#a66cff', '#ff8c42', '#4d96ff'];

export function createKit(stage) {
  const cleanups = [];
  let destroyed = false;

  const kit = {
    stage,

    /** Register any custom teardown function. */
    addCleanup(fn) { cleanups.push(fn); },

    /** addEventListener that is removed automatically on exit. */
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    },

    /**
     * Tap/touch anywhere on the stage. fn(x, y, event) with stage-relative coords.
     * Uses pointerdown (fires immediately, supports multi-touch — toddlers mash).
     */
    onTap(fn) {
      kit.on(stage, 'pointerdown', (e) => {
        const r = stage.getBoundingClientRect();
        fn(e.clientX - r.left, e.clientY - r.top, e);
      });
    },

    /** requestAnimationFrame loop. fn(dtSeconds, timeSeconds). Stopped on exit. */
    loop(fn) {
      let last = performance.now();
      let id = 0;
      const frame = (now) => {
        if (destroyed) return;
        const dt = Math.min((now - last) / 1000, 0.1); // clamp after tab switches
        last = now;
        fn(dt, now / 1000);
        id = requestAnimationFrame(frame);
      };
      id = requestAnimationFrame(frame);
      cleanups.push(() => cancelAnimationFrame(id));
    },

    setTimeout(fn, ms) {
      const id = setTimeout(fn, ms);
      cleanups.push(() => clearTimeout(id));
      return id;
    },

    setInterval(fn, ms) {
      const id = setInterval(fn, ms);
      cleanups.push(() => clearInterval(id));
      return id;
    },

    get width() { return stage.clientWidth; },
    get height() { return stage.clientHeight; },

    /** fn(width, height) on resize/rotation. Called once immediately. */
    onResize(fn) {
      const ro = new ResizeObserver(() => fn(stage.clientWidth, stage.clientHeight));
      ro.observe(stage);
      cleanups.push(() => ro.disconnect());
      fn(stage.clientWidth, stage.clientHeight);
    },

    /**
     * Full-stage 2D canvas, sharp on high-DPI screens. Draw in CSS pixels.
     * Returns { canvas, ctx }. Read size from kit.width / kit.height.
     */
    canvas2d() {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      stage.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      kit.onResize((w, h) => {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      return { canvas, ctx };
    },

    sound: {
      /** Simple synth tone. */
      tone(freq = 440, duration = 0.25, type = 'sine', volume = 0.3) {
        const ac = getAudio();
        if (!ac) return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + duration);
      },
      /** A note from a pentatonic scale; any index works (wraps). */
      note(i, duration = 0.35) {
        const n = PENTATONIC[((i % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length];
        kit.sound.tone(n, duration, 'triangle');
      },
      randomNote() { kit.sound.note(Math.floor(Math.random() * PENTATONIC.length)); },
      pop() {
        const ac = getAudio();
        if (!ac) return;
        const t = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.frequency.setValueAtTime(600 + Math.random() * 400, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      },
    },

    /** Current language code ('en' | 'id'), UI strings, and { en, id } picker. */
    get lang() { return getLang(); },
    t,
    tr,
    /** Speak a string or { en, id } object in the current language. */
    say,
    /** Say one letter's name, e.g. "B!" / "Be!" (for spelling). */
    sayLetter,

    vibrate(ms = 30) { navigator.vibrate?.(ms); },

    random(min, max) { return min + Math.random() * (max - min); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    randomColor() { return kit.pick(PALETTE); },

    destroy() {
      destroyed = true;
      while (cleanups.length) {
        try { cleanups.pop()(); } catch (err) { console.error(err); }
      }
      window.speechSynthesis?.cancel();
      stage.innerHTML = '';
      stage.removeAttribute('style');
    },
  };

  return kit;
}

