"""Generate the app's voice clips with open neural TTS models (runs offline).

    pip install sherpa-onnx kokoro-onnx soundfile numpy   # plus ffmpeg on PATH
    node tools/voice/phrases.mjs                          # collect phrases -> phrases.json
    python tools/voice/generate.py --kokoro DIR --kokoro-v1 DIR [--lang id]

Models (all Kokoro, Apache-2.0):
  English:    kokoro-multi-lang-v1_1 (sherpa-onnx), speaker 0
              https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models
  Indonesian: kokoro-v1.0.onnx + voices-v1.0.bin (kokoro-onnx)
              https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
              Kokoro has no Indonesian voice, so we give it Indonesian phonemes
              from id_g2p.py (which fixes e vs ə etc.) and a voice blended from
              af_heart (expressive) and hf_alpha (closer vowels/consonants).
              This blend scored best when the clips were checked with Whisper ASR.

Writes voice/<lang>/<slug>.mp3 and voice/manifest.js. Existing clips are kept
unless --force is given, so re-running only renders new phrases.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
import sherpa_onnx as so
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Post-processing: trim silence, make it a touch brighter/livelier, even out loudness.
TRIM = ("silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.06,"
        "areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.12,areverse")
FILTERS = {
    "en": f"{TRIM},loudnorm=I=-16:TP=-1.5",
    "id": f"{TRIM},loudnorm=I=-16:TP=-1.5",
}


def kokoro(d, speaker, speed):
    cfg = so.OfflineTtsConfig(model=so.OfflineTtsModelConfig(
        kokoro=so.OfflineTtsKokoroModelConfig(
            model=f"{d}/model.onnx", voices=f"{d}/voices.bin", tokens=f"{d}/tokens.txt",
            data_dir=f"{d}/espeak-ng-data", dict_dir=f"{d}/dict",
            lexicon=f"{d}/lexicon-us-en.txt,{d}/lexicon-zh.txt"),
        num_threads=4))
    tts = so.OfflineTts(cfg)
    return lambda text: tts.generate(text, sid=speaker, speed=speed)


class Samples:
    def __init__(self, samples, sample_rate):
        self.samples, self.sample_rate = samples, sample_rate


def kokoro_indonesian(d, speed, blend=0.7):
    from kokoro_onnx import Kokoro
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from id_g2p import to_ipa

    tts = Kokoro(f"{d}/kokoro-v1.0.onnx", f"{d}/voices-v1.0.bin")
    voices = np.load(f"{d}/voices-v1.0.bin")
    voice = (voices["af_heart"] * blend + voices["hf_alpha"] * (1 - blend)).astype(np.float32)

    def speak(text):
        # Final glottal stops come out unclear, so a light k is used instead.
        phonemes = to_ipa(text).replace("ʔ", "k")
        # Single words: stretch the stressed vowel, like excited talk to a toddler
        # ("Payuuung!"). This also made short words much clearer to Whisper.
        if " " not in phonemes.strip("!?.,"):
            phonemes = re.sub(r"ˈ([^aiueoəɛ]*)([aiueoəɛ])", r"\1\2ː", phonemes, count=1)
        # Stress marks make Kokoro add a stray vowel, so drop them.
        phonemes = phonemes.replace("ˈ", "")
        samples, rate = tts.create(phonemes, voice=voice, speed=speed, is_phonemes=True)
        return Samples(samples, rate)
    return speak


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kokoro", required=True)
    ap.add_argument("--kokoro-v1", required=True, help="dir with kokoro-v1.0.onnx + voices-v1.0.bin")
    ap.add_argument("--lang", help="only render this language (en or id)")
    ap.add_argument("--en-speaker", type=int, default=0)
    ap.add_argument("--ffmpeg", default="ffmpeg")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--only", help="comma-separated keys to (re)render")
    args = ap.parse_args()

    phrases = json.load(open(os.path.join(ROOT, "tools/voice/phrases.json"), encoding="utf-8"))
    engines = {
        "en": kokoro(args.kokoro, args.en_speaker, speed=0.9),
        "id": kokoro_indonesian(args.kokoro_v1, speed=0.92),
    }
    only = set(args.only.split(",")) if args.only else None
    manifest = {"en": [], "id": []}

    with tempfile.TemporaryDirectory() as tmp:
        for i, p in enumerate(phrases):
            lang, key, text = p["lang"], p["key"], p["text"]
            out = os.path.join(ROOT, "voice", lang, f"{key}.mp3")
            manifest[lang].append(key)
            if os.path.exists(out) and not args.force and not (only and key in only):
                continue
            if only and key not in only:
                continue
            if args.lang and lang != args.lang:
                continue
            # e.g. English song titles stay English in the Indonesian set
            audio = engines[p.get("engine", lang)](text)
            wav = os.path.join(tmp, "a.wav")
            sf.write(wav, np.asarray(audio.samples), audio.sample_rate)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            subprocess.run([args.ffmpeg, "-loglevel", "error", "-y", "-i", wav, "-af", FILTERS[lang],
                            "-ac", "1", "-ar", "24000", "-b:a", "48k", out], check=True)
            print(f"[{i + 1}/{len(phrases)}] {lang} {key}: {text}", file=sys.stderr)

    with open(os.path.join(ROOT, "voice", "manifest.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by tools/voice/generate.py - lists the recorded voice clips.\n")
        f.write("export default " + json.dumps(manifest, separators=(",", ":")) + ";\n")


if __name__ == "__main__":
    main()
