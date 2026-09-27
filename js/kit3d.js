// Helper for 3D games. three.js is loaded lazily here, so the menu and 2D games
// never download it.
//
//   const { THREE, scene, camera, pickAt } = await create3D(kit);
//   kit.onTap((x, y) => { const hit = pickAt(x, y, meshes); ... });
//   kit.loop((dt) => { mesh.rotation.y += dt; });   // rendering happens automatically

// `view` is the width/height (in world units, at z = 0) that must always be
// visible — the camera backs up automatically in portrait so nothing is cut off.
export async function create3D(kit, { background = '#1b1f3b', fov = 50, view = { width: 8, height: 8 } } = {}) {
  const THREE = await import('three');

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // cap for battery
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  kit.stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 1000);

  // Friendly default lighting
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(5, 10, 7);
  scene.add(sun);

  kit.onResize((w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.position.z = Math.max(view.height / 2 / tan, view.width / 2 / (tan * camera.aspect));
    camera.updateProjectionMatrix();
  });

  // Render every frame; games just mutate the scene in their own kit.loop()
  kit.loop(() => renderer.render(scene, camera));

  kit.addCleanup(() => {
    scene.traverse((obj) => {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m?.dispose());
    });
    renderer.dispose();
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  /** Returns the first object (from `objects`) under stage coords x,y, or null. */
  function pickAt(x, y, objects = scene.children) {
    ndc.set((x / kit.width) * 2 - 1, -(y / kit.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(objects, true)[0];
    if (!hit) return null;
    // Walk up to the top-level object that was passed in
    let obj = hit.object;
    while (obj.parent && !objects.includes(obj)) obj = obj.parent;
    return { object: obj, point: hit.point };
  }

  /** Converts stage coords to a world point on the z = `z` plane (handy for spawning). */
  function worldAt(x, y, z = 0) {
    ndc.set((x / kit.width) * 2 - 1, -(y / kit.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -z);
    return raycaster.ray.intersectPlane(plane, new THREE.Vector3());
  }

  return { THREE, renderer, scene, camera, pickAt, worldAt };
}
