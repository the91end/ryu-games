import { GAMES } from '../games/registry.js';
import { createKit } from './kit.js';
import { getAudio } from './audio.js';
import { enterFullscreen, isFullscreen, keepAwake, keepFullscreen, isInstalled } from './fullscreen.js';
import { LANGS, getLang, nextLang, onLangChange, applyI18n, tr, say } from './i18n.js';

const HOLD_TO_EXIT_MS = 1200;

const $ = (sel) => document.querySelector(sel);
const menu = $('#menu');
const gameScreen = $('#game');
const stage = $('#game-stage');
const grid = $('#game-grid');
const backBtn = $('#back-btn');

let current = null; // { game, kit }

// ---------- Menu ----------
function buildMenu() {
  grid.innerHTML = '';
  for (const entry of GAMES) {
    const tile = document.createElement('button');
    tile.className = 'game-tile';
    tile.style.setProperty('--tile-color', entry.color);
    const name = tr(entry.name);
    tile.setAttribute('aria-label', name);
    tile.innerHTML = `<span class="emoji">${entry.emoji}</span><span class="label">${name}</span>`;
    tile.addEventListener('click', () => openGame(entry));
    grid.appendChild(tile);
  }
}

function renderLangButton() {
  const { flag, label } = LANGS[getLang()];
  $('#lang-btn').textContent = `${flag} ${label}`;
}

function showScreen(el) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s === el);
}

// ---------- Game lifecycle ----------
async function openGame(entry) {
  if (current) return;
  say(entry.name); // "Bubbles!" / "Gelembung!"
  showScreen(gameScreen);
  const kit = createKit(stage);
  current = { game: null, kit };
  try {
    const mod = await entry.load();
    if (!current || current.kit !== kit) return; // user left while loading
    current.game = mod.default;
    await current.game.start(stage, kit);
  } catch (err) {
    console.error(`Failed to start ${entry.id}`, err);
    closeGame();
  }
}

function closeGame() {
  if (!current) return;
  const { game, kit } = current;
  current = null;
  try { game?.stop?.(); } catch (err) { console.error(err); }
  kit.destroy(); // removes listeners, stops loops, clears the stage
  showScreen(menu);
}

// ---------- Hold-to-exit back button ----------
function setupBackButton() {
  backBtn.style.setProperty('--hold-ms', `${HOLD_TO_EXIT_MS}ms`);
  let timer = null;
  const start = (e) => {
    e.preventDefault();
    e.stopPropagation();
    backBtn.classList.add('holding');
    timer = setTimeout(() => { cancel(); closeGame(); }, HOLD_TO_EXIT_MS);
  };
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
    backBtn.classList.remove('holding');
  };
  backBtn.addEventListener('pointerdown', start);
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) backBtn.addEventListener(ev, cancel);
}

// ---------- Global toddler-proofing ----------
function lockDownGestures() {
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  // iOS Safari ignores user-scalable=no; block pinch zoom manually.
  // (Double-tap zoom is already disabled by `touch-action` in the CSS.)
  document.addEventListener('gesturestart', (e) => e.preventDefault());
}

// ---------- Installable app (PWA) ----------
function setupInstall() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker not registered', err));
  }
  // Chrome/Edge/Samsung Internet: show our own 📲 button when the app can be installed.
  // (iPhone/iPad: Share → Add to Home Screen; there is no install event there.)
  const btn = $('#install-btn');
  let prompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e;
    btn.hidden = isInstalled();
  });
  btn.addEventListener('click', async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    prompt = null;
    btn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { btn.hidden = true; });
}

// ---------- Boot ----------
function init() {
  applyI18n();
  renderLangButton();
  buildMenu();
  setupBackButton();

  $('#lang-btn').addEventListener('click', nextLang);
  onLangChange(() => {
    applyI18n();
    renderLangButton();
    buildMenu();
  });
  lockDownGestures();

  keepFullscreen();
  setupInstall();

  // First tap: unlock audio, go fullscreen, keep screen awake
  const overlay = $('#start-overlay');
  $('#start-btn').addEventListener('click', async () => {
    overlay.classList.add('hidden');
    getAudio();
    await enterFullscreen();
    keepAwake();
  });

  // Hide the start overlay when launched as an installed (standalone) app that's already fullscreen
  if (isFullscreen()) overlay.classList.add('hidden');
}

init();
