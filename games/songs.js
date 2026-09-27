// Songs shared by the Piano and Play a Song games.
//
// Adding a song: write its melody with the note names below, space-separated.
// Middle octave: C D E F G A B C2. Below it: G0 A0 B0. Above it: D2 E2.
// (In Indonesian "not angka": 1=C 2=D 3=E 4=F 5=G 6=A 7=B, a dot below = the
// low notes G0 A0 B0, a dot above = C2 D2 E2.) The Piano's 8 keys play low and
// high notes on the key with the same name; Play a Song plays them exactly.
// `lang` puts songs of the current language first (e.g. Indonesian songs when
// the app is in Bahasa Indonesia).
//
// Indonesian melodies were transcribed from published not angka (number
// notation) for piano/pianika, e.g. the collections on not.web.id and
// tribunnews.com.

export const NOTES = [
  { name: 'G0', freq: 196.0,  color: '#3ec1d3' },
  { name: 'A0', freq: 220.0,  color: '#4d96ff' },
  { name: 'B0', freq: 246.94, color: '#a66cff' },
  { name: 'C',  freq: 261.63, color: '#ff5d5d' },
  { name: 'D',  freq: 293.66, color: '#ff8c42' },
  { name: 'E',  freq: 329.63, color: '#ffd23f' },
  { name: 'F',  freq: 349.23, color: '#7bd389' },
  { name: 'G',  freq: 392.0,  color: '#3ec1d3' },
  { name: 'A',  freq: 440.0,  color: '#4d96ff' },
  { name: 'B',  freq: 493.88, color: '#a66cff' },
  { name: 'C2', freq: 523.25, color: '#ff5d8f' },
  { name: 'D2', freq: 587.33, color: '#ff8c42' },
  { name: 'E2', freq: 659.25, color: '#ffd23f' },
];

export const SONGS = [
  {
    lang: 'id',
    emoji: '🎈',
    title: 'Balonku Ada Lima',
    notes: 'E F G C2 G E G D E F D G F E E E A A B C2 G E F G F E D C E F G C2 G E G D E F D G F E E E A A B C2 G D D G F E D C',
  },
  {
    lang: 'id',
    emoji: '🦎',
    title: 'Cicak-cicak di Dinding',
    notes: 'G E G E E F G F D F A G F E A F A F A B C2 C2 E G F D C',
  },
  {
    lang: 'id',
    emoji: '🌈',
    title: 'Pelangi-pelangi',
    notes: 'G0 C E E E E E D C B0 C D G F F F E D F E D C D E E G G G E F F E E E C D G0 C E E D F E E D D C',
  },
  {
    lang: 'id',
    emoji: '🌟',
    title: 'Bintang Kecil',
    notes: 'G E D C B0 D C B0 A0 G0 A0 B0 C G0 C E G E C D G E D C E G E D C A0 B0 C A0 G0 D E F D A0 B0 C',
  },
  {
    lang: 'id',
    emoji: '🚂',
    title: 'Naik Kereta Api',
    notes: 'E F G A G F E C C C C D E C D B0 C C B0 A0 B0 C A0 G0 D E F F E D D G A G E F G G E C E F G C C D E C D D C B0 C',
  },
  {
    lang: 'id',
    emoji: '🦜',
    title: 'Burung Kakak Tua',
    notes: 'G G E C E D E F A G F E G G E C E D B A G F E D C E G E G G A A A A E G E G G A A A A C2 B G A B C2',
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
