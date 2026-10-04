// One shared Web Audio context for the synth tones.
// Browsers keep it suspended until a user gesture, so call getAudio() from a tap once.

let audioCtx = null;

export function getAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  // 'suspended' until the first tap; iOS can also leave it 'interrupted' (e.g. after
  // the built-in voice speaks or a call), so wake it up whenever it isn't running.
  if (audioCtx && audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
  return audioCtx;
}
