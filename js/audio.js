// One shared Web Audio context for the synth tones.
// Browsers keep it suspended until a user gesture, so call getAudio() from a tap once.

let audioCtx = null;

export function getAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
