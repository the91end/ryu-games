# Ryu Games

Mobile HTML games for babies and toddlers. It's plain HTML, CSS and JS
modules, with no build step.

- **Big targets everywhere**: menu tiles are at least 160px and in-game buttons are 72–96px.
- **Toddler-proof**: no zoom, text selection, long-press menu or pull-to-refresh.
  To leave a game you **hold** the 🏠 button for 1.2 s, so a random tap won't exit it.
- **Fullscreen**: the first ▶ tap goes fullscreen, unlocks audio and keeps the screen awake.
  The ⛶ button toggles fullscreen. On iPhone, use *Share → Add to Home Screen*, because
  iOS Safari has no fullscreen API and the home-screen app opens without browser bars.
- **English / Bahasa Indonesia**: the 🇬🇧/🇮🇩 button on the menu switches language.
  The choice is saved, and words are spoken aloud in that language.
- **2D and 3D**: 2D games use canvas or plain DOM. 3D games use three.js, stored in
  `vendor/` so it works offline, and it only loads when a 3D game opens.

## Games

| Game | Type | What it does |
|---|---|---|
| 🫧 Bubbles / Gelembung | 2D canvas | Tap floating bubbles to pop them |
| 🐹 Whack-a-Mole / Pukul Tikus | 2D DOM | Slow, friendly moles. Each bonk is counted aloud ("one, two…" / "satu, dua…") |
| 🎹 Piano | 2D DOM | 8 rainbow keys. Pick a song and the next key glows so the child can play along. There are no wrong notes |
| 🎸 Play a Song / Main Lagu | 2D canvas | A 4-lane Guitar Hero-style game for toddlers. Notes fall and your child taps the pad; the real melody plays whichever pad is hit, and notes wait at the pad, so there is no way to fail |
| 🃏 Flash Cards / Kartu Kata | 2D DOM | 15 categories and about 200 cards. Each card shows the name written and spoken, and tapping the word spells it out. Animals and vehicles also make their sound |
| 🎨 Colors / Warna | 2D DOM | Tap to change the color and hear its name |
| 🧊 Shapes 3D / Bentuk 3D | 3D three.js | Tap shapes to make them jump and play a note, or tap empty space to add one |

## Run it

It uses ES modules, so serve it over HTTP. Opening it with `file://` won't work.

```sh
python3 -m http.server 8000
# open http://<your-computer-ip>:8000 on the phone (same Wi-Fi)
```

## Deploy (free, straight from GitHub)

**GitHub Pages** (already set up in `.github/workflows/pages.yml`):

1. Merge into `main`. The workflow deploys on every push to `main`.
2. One time: open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The site goes live at `https://the91end.github.io/ryu-games/`. Open it on the
   phone and use *Add to Home Screen*.

Other free hosts that deploy from a GitHub repo on every push:
**Cloudflare Pages**, **Netlify** and **Vercel**. With any of them, import the repo,
leave the build command empty, and set the output directory to `/`.

## Project layout

```
index.html              menu + game screen + start overlay
css/style.css           global styles, toddler-proofing
js/main.js              menu, game lifecycle, hold-to-exit, language button
js/kit.js               per-game toolbox (taps, loop, canvas, sounds, speech), auto-cleanup
js/kit3d.js             three.js scene helper (renderer, camera, lights, tap picking)
js/i18n.js              English / Indonesian strings + text-to-speech
js/fullscreen.js        fullscreen + wake lock
games/registry.js       list of games shown on the menu
games/_template.js      copy this to start a new game
games/songs.js          song melodies shared by Piano and Play a Song
games/flashcards-data.js  flash card categories and words
sounds/                 real recordings for flash cards (credits in sounds/CREDITS.md)
vendor/                 three.js (MIT)
```

## Add a game

1. Copy `games/_template.js` to `games/my-game.js`.
2. Add it to `games/registry.js`:
   ```js
   { id: 'my-game', type: '2d', emoji: '🚀', color: '#4d96ff',
     name: { en: 'Rocket', id: 'Roket' }, load: () => import('./my-game.js') },
   ```

A game is `{ start(stage, kit), stop?() }`. Anything you register through `kit`
is removed automatically when the child leaves the game. That covers listeners,
loops, timers and resize handlers.

```js
kit.onTap((x, y) => ...)              // tap anywhere (multi-touch)
kit.loop((dt, t) => ...)              // animation loop
kit.canvas2d()                        // HiDPI full-screen canvas -> { canvas, ctx }
kit.onResize((w, h) => ...)
kit.sound.pop() / .randomNote() / .note(i) / .tone(freq, dur)
kit.say({ en: 'Dog', id: 'Anjing' })  // speak in the current language
kit.tr({ en, id }), kit.lang          // localized text / 'en' | 'id'
kit.vibrate(ms), kit.random(a, b), kit.pick(arr), kit.randomColor()
```

For 3D:

```js
import { create3D } from '../js/kit3d.js';
const { THREE, scene, camera, pickAt, worldAt } = await create3D(kit);
```

## Add flash cards / categories / songs

- **Cards**: edit `games/flashcards-data.js`. Add a `sound: ['Woof!', 'Guk guk!']`
  to any card so it can "talk".
- **Real sounds**: 33 recordings are included for animals, sea animals, vehicles,
  rain and thunder. Add more at `sounds/<category>/<card id>.mp3`; a card without
  a recording speaks its sound instead. See `sounds/README.md` and
  `sounds/CREDITS.md` (some clips are CC BY / CC BY-SA and need credit).
- **Songs**: add to `SONGS` in `games/songs.js` using note names
  `C D E F G A B C2`. Piano and Play a Song both use this list.

## Add a language

Add the language to `LANGS` and `STRINGS` in `js/i18n.js`. Then give every
`{ en, id }` name (in the registry, flash cards and so on) a value for it. Text
without a translation falls back to English.
