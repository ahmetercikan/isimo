/**
 * Sunucunun sesi (Çizio ile aynı yöntem): sabit cümleler geliştirme sırasında Gemini TTS ile MP3'e çevrilir
 * (scripts/generate-voice.mts → public/voice/<anahtar>.mp3 + manifest.json). Çalışma anında cümlenin kaydı varsa
 * ses motorundan (müziği kısarak) çalınır; yoksa cihazın metin okuma sesine düşülür.
 */
import { lineKey } from '../voice/hash';
import { speak } from './feel';
import { audio, voiceOut } from './sfx';

let enabled = true;
let manifest: Record<string, string> | null = null;
let loading: Promise<void> | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let current: AudioBufferSourceNode | null = null;

export function setVoiceEnabled(v: boolean) {
  enabled = v;
  if (!v) stopVoice();
}

function loadManifest() {
  if (!loading)
    loading = fetch('voice/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => void (manifest = j?.lines ?? {}))
      .catch(() => void (manifest = {}));
  return loading;
}

function buffer(key: string): Promise<AudioBuffer | null> {
  let b = buffers.get(key);
  if (!b) {
    b = fetch(`voice/${key}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then((data) => audio()!.decodeAudioData(data))
      .catch(() => null);
    buffers.set(key, b);
  }
  return b;
}

/** Cümlelerin kayıtlarını önceden indir (harf anonsu gecikmesin). */
export async function preloadVoice(texts: string[]) {
  await loadManifest();
  if (!audio()) return;
  for (const t of texts) if (manifest?.[lineKey(t)]) void buffer(lineKey(t));
}

export function stopVoice() {
  try {
    current?.stop();
  } catch {
    /* zaten bitti */
  }
  current = null;
}

/** Cümleyi söyle (kaydı yoksa cihaz sesiyle). */
export async function say(text: string, delayMs = 0) {
  if (!enabled) return;
  await loadManifest();
  const key = lineKey(text);
  if (!manifest?.[key]) {
    if (delayMs) setTimeout(() => speak(text), delayMs);
    else speak(text);
    return;
  }
  const a = audio();
  const buf = await buffer(key);
  if (!a || !buf || !enabled) return;
  stopVoice();
  const src = a.createBufferSource();
  src.buffer = buf;
  src.connect(voiceOut(buf.duration + delayMs / 1000));
  src.start(a.currentTime + delayMs / 1000);
  current = src;
  src.onended = () => {
    if (current === src) current = null;
  };
}
