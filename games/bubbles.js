// 2D canvas example: bubbles float up, tap them to pop.

export default {
  start(stage, kit) {
    stage.style.background = 'linear-gradient(#5ec8f2, #1b6fb5)';
    const { ctx } = kit.canvas2d();
    const bubbles = [];
    const particles = [];
    const minSide = () => Math.min(kit.width, kit.height);

    function spawn() {
      const r = kit.random(0.08, 0.14) * minSide(); // big targets
      bubbles.push({
        x: kit.random(r, kit.width - r),
        y: kit.height + r,
        r,
        speed: kit.random(40, 90),
        wobble: kit.random(0, Math.PI * 2),
        color: kit.randomColor(),
      });
    }

    function pop(i) {
      const b = bubbles[i];
      bubbles.splice(i, 1);
      kit.sound.pop();
      kit.vibrate(20);
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        const v = kit.random(150, 350);
        particles.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6, color: b.color });
      }
    }

    kit.onTap((x, y) => {
      // Generous hit area: 1.3x the radius, so near-misses still count
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (Math.hypot(b.x - x, b.y - y) < b.r * 1.3) return pop(i);
      }
    });

    let spawnTimer = 0;
    for (let i = 0; i < 4; i++) spawn();

    kit.loop((dt, t) => {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && bubbles.length < 8) { spawn(); spawnTimer = 0.9; }

      ctx.clearRect(0, 0, kit.width, kit.height);

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.speed * dt;
        const x = b.x + Math.sin(t * 2 + b.wobble) * 10;
        if (b.y < -b.r) { bubbles.splice(i, 1); continue; }

        ctx.globalAlpha = 0.85;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = p.life / 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  },
};
