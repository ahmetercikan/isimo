"""
Ses kayıtlarını Whisper ile yazıya döker ve beklenen cümleyle karşılaştırır (Çizio'daki doğrulamanın sade hali).
Kullanım: python scripts/voice-verify.py      (pip install faster-whisper)
Benzerliği düşük ya da süresi anormal olan kayıtları listeler; silinip `npx tsx scripts/generate-voice.mts` ile yeniden üretilir.
"""
import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent
VOICE = ROOT / "public" / "voice"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFC", s).replace("I", "ı").replace("İ", "i").lower()
    return re.sub(r"[^a-zçğıöşü0-9 ]", "", s).strip()


lines = json.loads((VOICE / "manifest.json").read_text(encoding="utf-8"))["lines"]
model = WhisperModel("small", device="cpu", compute_type="int8")
bad = []
for key, text in lines.items():
    f = VOICE / f"{key}.mp3"
    if not f.exists():
        continue
    segs, info = model.transcribe(str(f), language="tr", beam_size=5)
    heard = " ".join(s.text for s in segs).strip()
    ratio = SequenceMatcher(None, norm(text), norm(heard)).ratio()
    letter = text.startswith("Harfimiz")
    ok = info.duration < 6 and (norm(heard).startswith("harfimiz") if letter else ratio >= 0.7)
    print(f"{'tamam' if ok else 'HATALI'}  {info.duration:4.1f} sn  {ratio:.2f}  {text}  →  {heard}", flush=True)
    if not ok:
        bad.append(key)
print("hatalı:", ",".join(bad) if bad else "yok")
