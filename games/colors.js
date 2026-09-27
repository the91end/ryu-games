// 2D DOM example (no canvas): every tap changes the color, drops a big shape,
// and says the color's name out loud in English or Indonesian.

const COLORS = [
  { hex: '#ff4d4d', name: { en: 'Red',    id: 'Merah' } },
  { hex: '#ffd23f', name: { en: 'Yellow', id: 'Kuning' } },
  { hex: '#4d96ff', name: { en: 'Blue',   id: 'Biru' } },
  { hex: '#4cc95a', name: { en: 'Green',  id: 'Hijau' } },
  { hex: '#a66cff', name: { en: 'Purple', id: 'Ungu' } },
  { hex: '#ff8c42', name: { en: 'Orange', id: 'Oranye' } },
  { hex: '#ff7eb6', name: { en: 'Pink',   id: 'Merah Muda' } },
];
const SHAPES = ['⭐', '❤️', '⚪', '🔷', '🌙', '☀️', '🌸', '🍎'];

export default {
  start(stage, kit) {
    let current = kit.pick(COLORS);
    stage.style.transition = 'background-color 0.3s';
    stage.style.backgroundColor = current.hex;
    let note = 0;

    kit.onTap((x, y) => {
      current = kit.pick(COLORS.filter((c) => c !== current));
      stage.style.backgroundColor = current.hex;
      kit.sound.note(note++);
      kit.say(current.name);
      kit.vibrate(15);

      const el = document.createElement('div');
      el.className = 'emoji';
      el.textContent = kit.pick(SHAPES);
      const size = Math.min(kit.width, kit.height) * 0.3;
      el.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-size:${size}px;line-height:1;
        transform:translate(-50%,-50%) scale(0);pointer-events:none;
        transition:transform .35s cubic-bezier(.3,1.6,.5,1), opacity .6s .6s`;
      stage.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = 'translate(-50%,-50%) scale(1)'; el.style.opacity = '0'; });
      kit.setTimeout(() => el.remove(), 1300);
    });
  },
};
