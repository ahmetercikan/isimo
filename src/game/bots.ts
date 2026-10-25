/**
 * Botlar: harfi durdurur, sözlükten cevap yazar, değerlendirmede "tamam" der.
 * Sıra Sende'de sırası gelince kelime havuzundan hamle bulur (zorluk: bulma şansı ve hız).
 * Sinema Bilmecesi'nde filmi bir ipucunda bilir: zor bot erken, kolay bot geç (bazen hiç); zor filmde bir ipucu geç.
 * Zorluk: 1 kolay (az ve geç yazar), 2 orta, 3 zor (çok ve hızlı yazar, STOP der).
 *
 * Hem botlu oyunda (bellekteki oda) hem çevrimiçi odada çalışır. Çevrimiçi odada botları
 * yalnızca **yöneten cihaz** oynatır (bkz. src/store/useGame.ts): iki cihaz aynı botu oynatmaz.
 * Bot kimlikleri "bot-" ile başlar; veritabanı kuralları bot düğümlerini bu önekten tanır.
 */
import { botMove, chainList, loadWords, ruleOf, wordsReady } from '../engine/chain';
import { CLUES, filmById } from '../engine/film';
import { CATEGORIES, hasDict } from '../engine/categories';
import { lookup, wordsFor } from '../engine/dict';
import { capitalize, startsWithLetter } from '../engine/tr';
import { rKey, type Player, type RoomState } from '../engine/types';
import type { Transport } from '../online/transport';
import { missTurn, playWord } from './chainDirector';
import { guessFilm, stepMs } from './filmDirector';
import { stopLetter } from './director';

/** Bot oyuncu kimliği (önek kuralların da tanıdığı "bot-"). */
export const botId = (i: number) => `bot-${i}`;
/** Odadaki ilk boş bot sırası (-1: bütün yüzler kullanılmış). */
export const freeBotSlot = (taken: Iterable<string>) => {
  const used = new Set(taken);
  return BOT_PROFILES.findIndex((_, i) => !used.has(botId(i)));
};
/** Odada bot var mı. */
export const hasBots = (s: RoomState) => Object.values(s.players).some((p) => !!p.bot);

export const BOT_PROFILES: Pick<Player, 'name' | 'avatar' | 'color'>[] = [
  { name: 'Robo Ramiz', avatar: 'robot', color: '#5b6cff' },
  { name: 'Bilge Baykuş', avatar: 'baykus', color: '#e8a200' },
  { name: 'Kurnaz Tilki', avatar: 'tilki', color: '#ff6b4a' },
  { name: 'Hızlı Çita', avatar: 'cita', color: '#f2711c' },
  { name: 'Zeki Ahtapot', avatar: 'ahtapot', color: '#e9487d' },
  { name: 'Tospik', avatar: 'kaplumbaga', color: '#2bb673' },
  { name: 'Pofuduk', avatar: 'panda', color: '#3ea6f0' },
  { name: 'Uzaylı Zıpzıp', avatar: 'uzayli', color: '#0ca678' },
  { name: 'Ejder Ece', avatar: 'ejderha', color: '#7c5cff' },
];

export const BOT_LEVELS = [
  { level: 1 as const, label: 'Kolay', fill: 0.5, from: 0.55, to: 0.95, strict: 0.5 },
  { level: 2 as const, label: 'Orta', fill: 0.75, from: 0.35, to: 0.85, strict: 0.8 },
  { level: 3 as const, label: 'Zor', fill: 0.93, from: 0.18, to: 0.55, strict: 1 },
];

const REACT = ['haha', 'vay', 'ates', 'kalp', 'hmm'];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** Botları odaya bağlar (yalnızca bir cihazda çağrılmalı); döner: durdurma fonksiyonu. */
export function runBots(t: Transport): () => void {
  let timers: number[] = [];
  let lastKey = '';
  const later = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
  const clear = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };
  const bots = (s: RoomState) => Object.keys(s.players).filter((p) => s.players[p].bot);

  const off = t.subscribe((s) => {
    if (!s) return;
    const c = s.ctl;
    // STOP denince (seq değişir ama tur aynı) botlar yazmayı sürdürür: yalnızca aşama/tur/kategori değişince sıfırla.
    // Sıra Sende'de her hamle yeni bir sıra: seq ile izlenir.
    // Sinema Bilmecesi'nde başkası bilince (seq değişir) botlar beklemeyi sürdürür: tur ve açıklama değişince sıfırla.
    const key = c.phase === 'turn' ? `turn:${c.seq}` : c.phase === 'clue' ? `clue:${c.round}:${c.nextAt ? 1 : 0}` : `${c.phase}:${c.round}:${c.cat}`;
    if (key === lastKey) return;
    lastKey = key;
    clear();
    const now = t.now();
    if (c.phase === 'spin' && !c.letter && s.players[c.stopper]?.bot && s.settings.manualStop) {
      later(rand(1400, 3200), () => {
        const st = t.peek();
        if (st) void stopLetter(t, st);
      });
    }
    // ---- Sıra Sende: sırası gelen bot kelime arar ----
    if (c.phase === 'turn' && c.word && s.players[c.turn ?? '']?.bot) {
      const pid = c.turn!;
      const level = s.players[pid].bot ?? 2;
      const lv = BOT_LEVELS[level - 1];
      const rule = ruleOf(s.settings.free);
      const span = Math.max(1500, c.endAt - now);
      const play = () => {
        const st = t.peek();
        if (!st || st.ctl.phase !== 'turn' || st.ctl.turn !== pid || st.ctl.seq !== c.seq || !st.ctl.word) return;
        const w = Math.random() < lv.fill ? botMove(st.ctl.word, chainList(st.ctl.chain), rule, level) : null;
        if (w) void playWord(t, st, w, pid);
        else void missTurn(t, st, pid, 'pass');
      };
      later(span * rand(lv.from + 0.1, Math.min(0.85, lv.to)), () => (wordsReady() ? play() : void loadWords().then(play)));
    }

    // ---- Sinema Bilmecesi: her bot filmi bir ipucunda bilir ----
    if (c.phase === 'clue' && c.film && !c.nextAt) {
      const film = filmById(c.film);
      const step = stepMs(s);
      for (const b of bots(s)) {
        if (c.got?.[b]) continue;
        const level = s.players[b].bot ?? 2;
        if (level === 1 && Math.random() < 0.15) continue;
        // Zor bot 2-4., orta 3-5., kolay 4-6. ipucunda; zor filmde bir ipucu geç.
        const clue = 5 - level + Math.floor(Math.random() * 3) + (film?.lv === 2 ? 1 : 0);
        if (clue > CLUES) continue;
        const at = c.startAt + (clue - 1 + rand(0.25, 0.9)) * step - now;
        later(Math.max(300, at), () => {
          const st = t.peek();
          const f = st && filmById(st.ctl.film);
          if (!st || st.ctl.phase !== 'clue' || st.ctl.round !== c.round || st.ctl.nextAt || !f) return;
          void guessFilm(t, st, f.t, b);
        });
      }
    }

    if (c.phase === 'write') {
      const span = c.endAt - c.startAt;
      for (const b of bots(s)) {
        const lv = BOT_LEVELS[(s.players[b].bot ?? 2) - 1];
        const used = new Set<string>();
        const cats = s.settings.cats;
        let last = 0;
        cats.forEach((cat, i) => {
          if (!CATEGORIES.some((x) => x.id === cat.id) || Math.random() > lv.fill) return;
          const words = wordsFor(cat.id, c.letter).filter((w) => !used.has(w));
          if (!words.length) return;
          // Bazen herkesin aklına gelen ilk kelimeler: aynı cevap çıkabilsin diye listenin başından da seçer.
          const w = Math.random() < 0.35 ? pick(words.slice(0, 6)) : pick(words);
          used.add(w);
          const at = c.startAt - now + span * rand(lv.from, lv.to) * ((i + 1) / cats.length) ** 0.6;
          last = Math.max(last, at);
          later(Math.max(300, at), () => {
            const cur = t.peek()?.ctl;
            if (!cur || cur.phase !== 'write' || cur.round !== c.round || t.now() > cur.endAt) return;
            void t.update({ [`answers/${rKey(c.round)}/${b}/${cat.id}`]: capitalize(w) });
          });
        });
        // Zor bot her şeyi yazdıysa STOP der.
        if (lv.level === 3 && s.settings.stop && Math.random() < 0.6) {
          later(Math.max(500, last + rand(800, 2500)), () => {
            const st = t.peek();
            if (!st) return;
            const filled = Object.keys(st.answers?.[rKey(c.round)]?.[b] ?? {}).length;
            if (st.ctl.phase !== 'write' || st.ctl.stopBy || filled < st.settings.cats.length) return;
            void t.transactCtl((x) =>
              x.phase === 'write' && !x.stopBy && t.now() < x.endAt ? { ...x, stopBy: b, endAt: Math.min(x.endAt, t.now() + st.settings.grace * 1000), seq: x.seq + 1 } : undefined,
            );
          });
        }
      }
    }
    if (c.phase === 'review') {
      // Botlar hakemdir: sözlükte olmayan insan cevaplarına itiraz eder (sözlüğü olmayan özel kategorilerde etmez).
      const cat = s.settings.cats[c.cat];
      const k = rKey(c.round);
      if (cat && hasDict(cat.id))
        for (const [pid, p] of Object.entries(s.players)) {
          const text = s.answers?.[k]?.[pid]?.[cat.id]?.trim();
          if (p.bot || !text || !startsWithLetter(text, c.letter) || lookup(cat.id, text) !== null) continue;
          for (const b of bots(s))
            if (Math.random() < BOT_LEVELS[(s.players[b].bot ?? 2) - 1].strict)
              later(rand(900, 3500), () => void t.update({ [`votes/${k}/${cat.id}/${pid}/${b}`]: true }));
        }
      for (const b of bots(s)) {
        later(rand(3800, 6000), () => void t.update({ [`ready/${rKey(c.round)}/${b}`]: c.cat }));
        if (Math.random() < 0.18) later(rand(1200, 6000), () => void t.update({ [`reactions/${b}-${Date.now()}`]: { p: b, e: pick(REACT), t: t.now() } }));
      }
    }
  });
  return () => {
    off();
    clear();
  };
}
