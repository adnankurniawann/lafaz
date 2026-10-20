# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = [
#   "optimum[exporters,onnxruntime]==1.19.2",
#   "transformers==4.40.2",
#   "torch==2.2.2",
#   "onnx==1.16.2",
#   "onnxruntime==1.20.1",
#   "numpy<2",
# ]
# ///
"""Converts the Cek Suara model to ONNX for transformers.js (ADR-0008).

Versions are pinned on purpose. From transformers 4.42 the Whisper decoder
takes a `cache_position` input that transformers.js never sends ("Missing the
following inputs: cache_position"), and 4.46 exports a decoder-with-past that
fails at runtime.

tarteel-ai/whisper-base-ar-quran (Apache 2.0) only ships PyTorch weights.
Run once:  uv run scripts/convert-speech-model.py
Output:    public/models/tarteel-ai/whisper-base-ar-quran/  (git-ignored)
For production, upload that folder to a Hugging Face model repo.
After a new conversion, bump MODEL_VERSION in src/lib/speech.ts so browsers drop the cached old model.

Ends by transcribing Al-Fatihah 1:1 from the qari audio with the exported
model, so a broken export shows up here and not in the app.
"""

import shutil
import subprocess
from pathlib import Path

import numpy as np
from onnxruntime.quantization import QuantType, quantize_dynamic
from optimum.exporters.onnx import main_export
from optimum.onnx import merge_decoders
from optimum.onnxruntime import ORTModelForSpeechSeq2Seq
from transformers import WhisperProcessor

MODEL = "tarteel-ai/whisper-base-ar-quran"
OUT = Path("public/models") / MODEL
EXPORT = OUT / "_export"
SAMPLE = "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"

if not (EXPORT / "decoder_with_past_model.onnx").exists():
    main_export(MODEL, output=EXPORT, task="automatic-speech-recognition-with-past", no_post_process=True)

# Check the export before shipping it.
mp3 = subprocess.run(["curl", "-sfL", SAMPLE], capture_output=True, check=True).stdout
audio = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], input=mp3, capture_output=True, check=True).stdout
processor = WhisperProcessor.from_pretrained(MODEL)
model = ORTModelForSpeechSeq2Seq.from_pretrained(EXPORT)
features = processor(np.frombuffer(audio, dtype=np.float32), sampling_rate=16000, return_tensors="pt").input_features
print("1:1 heard as:", processor.batch_decode(model.generate(features), skip_special_tokens=True)[0])

(OUT / "onnx").mkdir(parents=True, exist_ok=True)
for f in EXPORT.iterdir():
    if f.suffix != ".onnx":
        shutil.copy(f, OUT / f.name)

# Quantize each graph on its own, then merge: quantize_dynamic skips the If
# subgraphs of an already merged decoder and leaves it at full size.
q = lambda name: EXPORT / f"{name}_quantized.onnx"
for name in ["encoder_model", "decoder_model", "decoder_with_past_model"]:
    quantize_dynamic(EXPORT / f"{name}.onnx", q(name), weight_type=QuantType.QUInt8)
shutil.copy(q("encoder_model"), OUT / "onnx" / "encoder_model_quantized.onnx")
# Whisper's first decoder step also returns the encoder cache; the later steps reuse it.
merge_decoders(q("decoder_model"), q("decoder_with_past_model"), save_path=OUT / "onnx" / "decoder_model_merged_quantized.onnx", strict=False)

shutil.rmtree(EXPORT)
for f in sorted(OUT.rglob("*")):
    if f.is_file():
        print(f"{f.stat().st_size / 1e6:8.1f} MB  {f.relative_to(OUT)}")
