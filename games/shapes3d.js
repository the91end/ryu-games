// 3D example (three.js): spinning shapes. Tap a shape to make it jump and
// sing; tap empty space to add a new shape there.

import { create3D } from '../js/kit3d.js';

export default {
  async start(stage, kit) {
    const { THREE, scene, pickAt, worldAt } = await create3D(kit, { background: '#1b1f3b', view: { width: 7, height: 8 } });

    const geometries = [
      new THREE.BoxGeometry(1.6, 1.6, 1.6),
      new THREE.SphereGeometry(1, 32, 16),
      new THREE.ConeGeometry(1, 1.8, 32),
      new THREE.TorusGeometry(0.8, 0.35, 16, 48),
      new THREE.IcosahedronGeometry(1.1),
    ];
    const shapes = [];

    function addShape(pos) {
      const i = shapes.length;
      const mesh = new THREE.Mesh(
        kit.pick(geometries),
        new THREE.MeshStandardMaterial({ color: kit.randomColor(), roughness: 0.4 }),
      );
      mesh.position.copy(pos);
      mesh.userData = { baseY: pos.y, jump: 0, spin: kit.random(0.4, 1), note: i };
      mesh.scale.setScalar(0.01);
      scene.add(mesh);
      shapes.push(mesh);
      // Keep it from getting crowded
      if (shapes.length > 12) scene.remove(shapes.shift());
    }

    addShape(new THREE.Vector3(-1.8, 1.8, 0));
    addShape(new THREE.Vector3(1.8, 1.8, 0));
    addShape(new THREE.Vector3(0, -1.8, 0));

    kit.onTap((x, y) => {
      const hit = pickAt(x, y, shapes);
      if (hit) {
        hit.object.userData.jump = 1;
        kit.sound.note(hit.object.userData.note);
        kit.vibrate(20);
      } else {
        const p = worldAt(x, y, 0);
        if (p) { addShape(p); kit.sound.pop(); }
      }
    });

    kit.loop((dt) => {
      for (const m of shapes) {
        const u = m.userData;
        m.rotation.x += dt * u.spin * 0.6;
        m.rotation.y += dt * u.spin;
        // Pop-in scale
        m.scale.setScalar(Math.min(1, m.scale.x + dt * 4));
        // Jump arc + extra spin
        if (u.jump > 0) {
          u.jump = Math.max(0, u.jump - dt * 1.8);
          const s = Math.sin((1 - u.jump) * Math.PI);
          m.position.y = u.baseY + s * 1.5;
          m.rotation.y += dt * 10 * u.jump;
        }
      }
    });
  },
};
