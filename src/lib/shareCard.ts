/**
 * Görselli paylaşım kartları (uygulamanın temasında): davet kartı (oda kodu) ve oyun sonu sonuç kartı.
 * Düz metin yerine bu görseller gönderilir; metne Play Store bağlantısı eklenir.
 * Sinema Bilmecesi kartları sinema temasında, öbürleri nane zeminde (çalı, bulut, kaplan).
 * Paylaşım: uygulamada dosya önbelleğe yazılıp sistem paylaşımıyla, web'de Web Share ya da indirme ile.
 * Skor hikâyesi (1080×1920) ayrı: src/lib/storyCard.ts.
 */
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { avatarIcon, iconSvg } from '../art/icons';
import artFilm from '../assets/home/film.webp';
import artIsim from '../assets/home/isim.webp';
import artSiram from '../assets/home/siram.webp';
import tiger from '../assets/home/tiger.webp';

export type Game = 'isim' | 'siram' | 'film' | 'quiz';
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ahmetercikan.isimsehir';

const GAMES: Record<Game, { name: string; color: string; art: string }> = {
  isim: { name: 'İsim Şehir', color: '#f24d40', art: artIsim },
  siram: { name: 'Sıra Sende', color: '#1fa9cf', art: artSiram },
  film: { name: 'Sinema Bilmecesi', color: '#7d58ee', art: artFilm },
  quiz: { name: 'Sahneyi Hatırla', color: '#7d58ee', art: artFilm },
};

const W = 1080;
const H = 1350;

const img = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

async function fonts() {
  await Promise.all([
    document.fonts.load('700 80px Fredoka'),
    document.fonts.load('800 40px Nunito'),
    document.fonts.load('400 80px "Bebas Neue"'),
  ]).catch(() => {});
}

function canvas(h = H) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

/** Nane zemin: gökyüzü degradesi, bulutlar, alt kenarda çalı şeridi. */
function mintScene(g: CanvasRenderingContext2D, h: number) {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#dcf7f0');
  sky.addColorStop(1, '#c3eadf');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, h);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [x, y, k] of [[150, 120, 1], [860, 80, 0.8]] as const) {
    g.beginPath();
    g.ellipse(x, y + 20 * k, 110 * k, 44 * k, 0, 0, Math.PI * 2);
    g.ellipse(x + 40 * k, y - 10 * k, 64 * k, 52 * k, 0, 0, Math.PI * 2);
    g.ellipse(x + 110 * k, y + 22 * k, 90 * k, 36 * k, 0, 0, Math.PI * 2);
    g.fill();
  }
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 16; i++) {
      const x = i * 74 - 20 + (row % 2) * 37;
      const y = h - 150 + row * 55 + ((i * 7) % 3) * 8;
      const r = 62 - row * 6;
      const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      gr.addColorStop(0, row === 0 ? '#6fd6b0' : '#9eebc8');
      gr.addColorStop(0.55, row === 0 ? '#33ad8c' : '#4cc69c');
      gr.addColorStop(1, row === 0 ? '#1d8a71' : '#24a07f');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }
}

/** Sinema salonu zemini: koyu degrade, mor ışık, iki spot, perdeler. */
function cinemaScene(g: CanvasRenderingContext2D, h: number) {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#1b1640');
  bg.addColorStop(0.55, '#0e0b27');
  bg.addColorStop(1, '#06051a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, h);
  const glow = g.createRadialGradient(W / 2, -100, 50, W / 2, -100, 1000);
  glow.addColorStop(0, 'rgba(130,100,230,0.55)');
  glow.addColorStop(1, 'rgba(130,100,230,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, h);
  for (const [x, dir] of [[200, 1], [880, -1]] as const) {
    const beam = g.createLinearGradient(0, 0, 0, h * 0.9);
    beam.addColorStop(0, 'rgba(255,236,190,0.25)');
    beam.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = beam;
    g.beginPath();
    g.moveTo(x - 26, 0);
    g.lineTo(x + 26, 0);
    g.lineTo(x + dir * 420 + 260, h * 0.9);
    g.lineTo(x + dir * 420 - 260, h * 0.9);
    g.closePath();
    g.fill();
  }
  for (const side of [0, 1]) {
    const cg = g.createLinearGradient(side ? W - 110 : 0, 0, side ? W : 110, 0);
    cg.addColorStop(0, '#5e1023');
    cg.addColorStop(0.5, '#a52540');
    cg.addColorStop(1, '#4a0d1e');
    g.fillStyle = cg;
    g.beginPath();
    const s = side ? -1 : 1;
    const x0 = side ? W : 0;
    g.moveTo(x0, 0);
    g.lineTo(x0 + s * 115, 0);
    g.bezierCurveTo(x0 + s * 90, h * 0.3, x0 + s * 62, h * 0.65, x0 + s * 80, h);
    g.lineTo(x0, h);
    g.closePath();
    g.fill();
  }
}

/** Avatar: renkli halka + açık zemin + çizim (uygulamadaki Avatar'ın aynısı). */
async function avatar(g: CanvasRenderingContext2D, emoji: string, color: string, cx: number, cy: number, r: number) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.22)';
  g.shadowBlur = 18;
  g.shadowOffsetY = 6;
  g.fillStyle = color;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(cx, cy, r - r * 0.09, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = color + '38';
  g.fill();
  const name = avatarIcon(emoji);
  if (name) {
    try {
      const svg = iconSvg(name, 256);
      const i = await img(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
      const s = r * 1.55;
      g.drawImage(i, cx - s / 2, cy - s / 2, s, s);
    } catch {
      /* çizim yüklenemezse renkli daire kalır */
    }
  }
}

function pill(g: CanvasRenderingContext2D, text: string, cx: number, y: number, bg: string, fg = '#fff', size = 40) {
  g.font = `700 ${size}px Fredoka`;
  const w = g.measureText(text).width + size * 1.4;
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect(cx - w / 2, y - size * 0.95, w, size * 1.45, size * 0.72);
  g.fill();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.fillText(text, cx, y + size * 0.05);
}

function footer(g: CanvasRenderingContext2D, h: number, cinema: boolean) {
  g.fillStyle = cinema ? 'rgba(0,0,0,0.55)' : 'rgba(16,96,80,0.85)';
  g.fillRect(0, h - 96, W, 96);
  g.font = '800 34px Nunito';
  g.textAlign = 'center';
  g.fillStyle = cinema ? '#f3c35b' : '#ffffff';
  g.fillText('Google Play\'de “İsim Şehir” · Ücretsiz', W / 2, h - 36);
}

async function drawArt(g: CanvasRenderingContext2D, game: Game, h: number) {
  try {
    const [t, a] = await Promise.all([img(tiger), img(GAMES[game].art)]);
    g.drawImage(a, 70, h - 400, 270, (270 * a.height) / a.width);
    g.drawImage(t, W - 470, h - 470, 440, (440 * t.height) / t.width);
  } catch {
    /* resimsiz de olur */
  }
}

/** Davet kartı: oyunun adı, "Seni oyuna çağırıyorum", büyük oda kodu. */
export async function drawInvite(o: { game: Game; code: string; from: string }): Promise<string> {
  await fonts();
  const [c, g] = canvas();
  const cinema = o.game === 'film' || o.game === 'quiz';
  (cinema ? cinemaScene : mintScene)(g, H);
  const G = GAMES[o.game];
  g.textAlign = 'center';
  g.font = '700 74px Fredoka';
  g.fillStyle = cinema ? '#f6efe2' : '#3a2b27';
  g.fillText('İsim Şehir', W / 2, 190);
  pill(g, o.game === 'isim' ? 'Klasik İsim Şehir' : G.name, W / 2, 285, cinema ? '#f3c35b' : G.color, cinema ? '#2a1a05' : '#fff', 44);
  g.font = '800 46px Nunito';
  g.fillStyle = cinema ? 'rgba(246,239,226,0.9)' : '#5b463f';
  g.fillText(`${o.from} seni oyuna çağırıyor!`, W / 2, 420);
  // Oda kodu: harf kutuları
  const n = o.code.length;
  const tw = 150;
  const gap = 18;
  const x0 = W / 2 - (n * tw + (n - 1) * gap) / 2;
  g.font = '700 110px Fredoka';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (tw + gap);
    const y = 480;
    g.fillStyle = cinema ? '#8a5a12' : '#c8d9d3';
    g.beginPath();
    g.roundRect(x, y + 12, tw, 180, 32);
    g.fill();
    g.fillStyle = cinema ? '#f3c35b' : '#ffffff';
    g.beginPath();
    g.roundRect(x, y, tw, 180, 32);
    g.fill();
    g.fillStyle = cinema ? '#2a1a05' : '#3a2b27';
    g.fillText(o.code[i], x + tw / 2, y + 132);
  }
  g.font = '800 38px Nunito';
  g.fillStyle = cinema ? 'rgba(246,239,226,0.85)' : '#5b463f';
  g.fillText('Uygulamada “Katıl”a bas, bu kodu yaz', W / 2, 760);
  await drawArt(g, o.game, H - 96);
  footer(g, H, cinema);
  return c.toDataURL('image/png');
}

export interface ResultRow {
  name: string;
  avatar: string;
  color: string;
  pts: number;
  rank: number;
  me?: boolean;
}

/** Sonuç kartı: ilk üç kürsüde (avatarlı), altında kalan sıralama. */
export async function drawResults(o: { game: Game; rows: ResultRow[]; sub?: string }): Promise<string> {
  await fonts();
  const [c, g] = canvas();
  const cinema = o.game === 'film' || o.game === 'quiz';
  (cinema ? cinemaScene : mintScene)(g, H);
  const G = GAMES[o.game];
  const ink = cinema ? '#f6efe2' : '#3a2b27';
  g.textAlign = 'center';
  pill(g, G.name, W / 2, 120, cinema ? '#f3c35b' : G.color, cinema ? '#2a1a05' : '#fff', 40);
  const winner = o.rows[0];
  if (cinema) {
    g.font = '400 110px "Bebas Neue"';
    g.fillStyle = '#f3c35b';
    g.fillText('YILIN SİNEMASEVERİ', W / 2, 255);
  } else {
    g.font = '700 84px Fredoka';
    g.fillStyle = ink;
    g.fillText(`Kazanan: ${winner?.name ?? ''}`, W / 2, 255);
  }
  if (o.sub) {
    g.font = '800 34px Nunito';
    g.fillStyle = cinema ? 'rgba(246,239,226,0.75)' : '#8c766e';
    g.fillText(o.sub, W / 2, 315);
  }
  // Kürsü: 2 · 1 · 3 (adlar avatarın üstünde, puan kürsünün içinde)
  const pod = [o.rows[1], o.rows[0], o.rows[2]];
  const cols = [W / 2 - 300, W / 2, W / 2 + 300];
  const hs = [170, 240, 120];
  const colors = ['#d9dde6', '#ffd23f', '#f2a974'];
  const base = 900;
  for (let i = 0; i < 3; i++) {
    const r = pod[i];
    if (!r) continue;
    const x = cols[i];
    const top = base - hs[i];
    const ar = i === 1 ? 82 : 70;
    g.fillStyle = colors[i];
    g.beginPath();
    g.roundRect(x - 120, top, 240, hs[i] + 20, [24, 24, 0, 0]);
    g.fill();
    g.font = '700 64px Fredoka';
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillText(String(r.rank), x, top + 70);
    g.font = '800 34px Nunito';
    g.fillStyle = '#3a2b27';
    g.fillText(`${r.pts} puan`, x, top + (hs[i] > 150 ? 140 : 108));
    await avatar(g, r.avatar, r.color, x, top - ar - 18, ar);
    g.font = '700 40px Fredoka';
    g.fillStyle = ink;
    const nm = r.name.length > 11 ? `${r.name.slice(0, 10)}…` : r.name;
    g.fillText(nm, x, top - ar * 2 - 40);
  }
  // Kalanlar (en fazla üç satır)
  g.textAlign = 'left';
  let y = 1000;
  for (const r of o.rows.slice(3, 6)) {
    g.fillStyle = cinema ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)';
    g.beginPath();
    g.roundRect(170, y - 48, W - 340, 70, 35);
    g.fill();
    g.font = '700 36px Fredoka';
    g.fillStyle = ink;
    g.fillText(`${r.rank}.  ${r.name}`, 210, y);
    g.textAlign = 'right';
    g.fillStyle = cinema ? '#f3c35b' : '#de4d2d';
    g.fillText(String(r.pts), W - 210, y);
    g.textAlign = 'left';
    y += 82;
  }
  g.textAlign = 'center';
  footer(g, H, cinema);
  return c.toDataURL('image/png');
}

/** Görseli paylaşır (uygulamada dosya + sistem paylaşımı, web'de Web Share ya da indirme). */
export async function shareImage(dataUrl: string, file: string, text: string, title: string): Promise<void> {
  const body = `${text}\n${PLAY_URL}`;
  if (Capacitor.isNativePlatform()) {
    const w = await Filesystem.writeFile({ path: file, data: dataUrl.split(',')[1], directory: Directory.Cache });
    await Share.share({ title, text: body, files: [w.uri], dialogTitle: title });
    return;
  }
  const blob = await (await fetch(dataUrl)).blob();
  const f = new File([blob], file, { type: 'image/png' });
  if (navigator.canShare?.({ files: [f] })) {
    await navigator.share({ files: [f], text: body, title });
    return;
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = file;
  a.click();
  await navigator.clipboard?.writeText(body).catch(() => {});
}
