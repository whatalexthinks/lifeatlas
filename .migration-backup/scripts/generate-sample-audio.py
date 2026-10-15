#!/usr/bin/env python3
"""
Generate the synthetic sample narration used by the LifeAtlas demo.

The clips are read aloud by Kokoro-82M (Apache-2.0), an open text-to-speech
model. They are NOT recordings of real people, and the product labels them as
"Synthetic sample narration" everywhere they appear.

Inputs
  --model   path to Kokoro-82M ONNX weights (e.g. the q8 build, sha256
            fbae9257e1e05ffc727e951ef9b9c98418e6d79f1c9b6b13bd59f5c9028a1478)
  --voices  path to an .npz of Kokoro voice styles
  --spec    JSON list of {id, memoryId, voice, speed, text}
Outputs
  public/media/audio/<id>.mp3 and src/data/fixtures/audio-manifest.json
  (duration, byte size, sha256 and 96 normalised waveform peaks per clip)

Requires: kokoro-onnx, soundfile, numpy, and ffmpeg on PATH.
"""
import argparse, hashlib, json, os, subprocess, tempfile
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

PEAKS = 96

def peaks(samples: np.ndarray, n: int = PEAKS) -> list:
    chunks = np.array_split(np.abs(samples), n)
    raw = np.array([float(np.sqrt(np.mean(c ** 2))) if len(c) else 0.0 for c in chunks])
    top = raw.max() or 1.0
    return [round(float(v / top), 3) for v in raw]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    ap.add_argument("--spec", required=True)
    ap.add_argument("--out", default="public/media/audio")
    ap.add_argument("--manifest", default="src/data/fixtures/audio-manifest.json")
    a = ap.parse_args()

    spec = json.load(open(a.spec))
    kokoro = Kokoro(a.model, a.voices)
    os.makedirs(a.out, exist_ok=True)
    clips = []
    for item in spec:
        text = item["text"].replace("\n\n", " ").replace("—", ", ")
        samples, sr = kokoro.create(text, voice=item["voice"], speed=item.get("speed", 0.92), lang="en-us")
        pad = np.zeros(int(sr * 0.45), dtype=samples.dtype)
        samples = np.concatenate([pad, samples, pad])
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            sf.write(tmp.name, samples, sr)
            dest = os.path.join(a.out, f"{item['id']}.mp3")
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name,
                 "-af", "highpass=f=70,lowpass=f=11000,loudnorm=I=-19:TP=-2:LRA=9",
                 "-ac", "1", "-ar", "44100", "-b:a", "72k", dest],
                check=True,
            )
            os.unlink(tmp.name)
        data = open(dest, "rb").read()
        clips.append({
            "id": item["id"],
            "memoryId": item["memoryId"],
            "voice": f"kokoro-82m:{item['voice']}",
            "file": "/" + os.path.relpath(dest, "public").replace(os.sep, "/"),
            "durationSec": round(len(samples) / sr, 2),
            "byteSize": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "peaks": peaks(samples),
        })
        print(f"{item['id']}: {clips[-1]['durationSec']}s, {len(data)//1024} KB")

    json.dump({
        "generator": "scripts/generate-sample-audio.py",
        "model": "Kokoro-82M (Apache-2.0)",
        "notice": "Synthetic sample narration. Not a real person's voice.",
        "clips": clips,
    }, open(a.manifest, "w"), indent=1)

if __name__ == "__main__":
    main()
