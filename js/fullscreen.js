// Fullscreen + wake lock helpers with vendor fallbacks.
// Note: iPhone Safari has no element fullscreen API. There, "Add to Home Screen"
// launches the app standalone (see manifest + apple-mobile-web-app-capable).

const docEl = document.documentElement;

export function isFullscreen() {
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches ||
    window.navigator.standalone
  );
}

export async function enterFullscreen() {
  try {
    if (docEl.requestFullscreen) await docEl.requestFullscreen({ navigationUI: 'hide' });
    else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
  } catch { /* not supported or denied: keep playing in the browser */ }
}

export async function exitFullscreen() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  } catch { /* ignore */ }
}

export function toggleFullscreen() {
  return document.fullscreenElement || document.webkitFullscreenElement
    ? exitFullscreen()
    : enterFullscreen();
}

// Keep the screen from dimming while a toddler is playing
let wakeLock = null;
export async function keepAwake() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch { /* ignore */ }
}
document.addEventListener('visibilitychange', () => {
  if (wakeLock && document.visibilityState === 'visible') keepAwake();
});
