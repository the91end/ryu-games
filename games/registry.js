// Every game shown on the menu. To add a game:
//   1. Copy games/_template.js to games/<id>.js
//   2. Add an entry below. `name` is { en, id } for English / Bahasa Indonesia.
//      `load` is a dynamic import, so each game (and heavy libraries like
//      three.js for 3D games) is only downloaded when it's opened.

export const GAMES = [
  { id: 'bubbles',  type: '2d', emoji: '🫧', color: '#3ec1d3', name: { en: 'Bubbles', id: 'Gelembung' },  load: () => import('./bubbles.js') },
  { id: 'moles',    type: '2d', emoji: '🐹', color: '#7bd389', name: { en: 'Whack-a-Mole', id: 'Pukul Tikus' }, load: () => import('./moles.js') },
  { id: 'piano',    type: '2d', emoji: '🎹', color: '#ffd23f', name: { en: 'Piano', id: 'Piano' },         load: () => import('./piano.js') },
  { id: 'playsong', type: '2d', emoji: '🎸', color: '#a66cff', name: { en: 'Play a Song', id: 'Main Lagu' }, load: () => import('./playsong.js') },
  { id: 'flashcards', type: '2d', emoji: '🃏', color: '#ff8c42', name: { en: 'Flash Cards', id: 'Kartu Kata' }, load: () => import('./flashcards.js') },
  { id: 'colors',   type: '2d', emoji: '🎨', color: '#ff5d8f', name: { en: 'Colors', id: 'Warna' },        load: () => import('./colors.js') },
  { id: 'shapes3d', type: '3d', emoji: '🧊', color: '#a66cff', name: { en: 'Shapes 3D', id: 'Bentuk 3D' }, load: () => import('./shapes3d.js') },
];
