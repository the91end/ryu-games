// Songs shared by the Piano and Play a Song games.
//
// Adding a song: write its melody with the key names below (C D E F G A B C2),
// space-separated. The melody must fit in one octave (C to C2).
// `lang` puts songs of the current language first (e.g. Indonesian songs when
// the app is in Bahasa Indonesia). The Indonesian melodies are approximate.

export const NOTES = [
  { name: 'C',  freq: 261.63, color: '#ff5d5d' },
  { name: 'D',  freq: 293.66, color: '#ff8c42' },
  { name: 'E',  freq: 329.63, color: '#ffd23f' },
  { name: 'F',  freq: 349.23, color: '#7bd389' },
  { name: 'G',  freq: 392.0,  color: '#3ec1d3' },
  { name: 'A',  freq: 440.0,  color: '#4d96ff' },
  { name: 'B',  freq: 493.88, color: '#a66cff' },
  { name: 'C2', freq: 523.25, color: '#ff5d8f' },
];

export const SONGS = [
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
