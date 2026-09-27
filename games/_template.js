// Copy this file to start a new game, then add it to games/registry.js.
//
// start(stage, kit) — build the game inside `stage` (a full-screen div).
// stop()            — optional; anything registered through `kit` is cleaned up for you.
//
// Kit cheat sheet (see js/kit.js):
//   kit.onTap((x, y) => ...)      tap anywhere (multi-touch friendly)
//   kit.loop((dt, t) => ...)      animation loop
//   kit.canvas2d()                full-screen HiDPI canvas -> { canvas, ctx }
//   kit.onResize((w, h) => ...)   rotation / resize
//   kit.sound.pop() / .randomNote() / .note(i) / .tone(freq, dur)
//   kit.say({ en: "Hello", id: "Halo" })   speak in the current language
//   kit.tr({ en, id }) / kit.lang          localized text / current language
//   kit.vibrate(ms), kit.random(a, b), kit.pick(arr), kit.randomColor()
//   kit.on(target, type, fn)      auto-removed event listener
// For 3D: `const { THREE, scene, camera, pickAt, worldAt } = await create3D(kit)`
//   from '../js/kit3d.js' (see games/shapes3d.js).

export default {
  start(stage, kit) {
    const { ctx } = kit.canvas2d();
    const dots = [];

    kit.onTap((x, y) => {
      dots.push({ x, y, color: kit.randomColor() });
      kit.sound.randomNote();
    });

    kit.loop(() => {
      ctx.clearRect(0, 0, kit.width, kit.height);
      for (const d of dots) {
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 40, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },
};
