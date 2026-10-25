/**
 * Sinema Bilmecesi skor kartı: Instagram hikâyesi boyutunda (1080×1920) görsel çizer ve paylaşır.
 * Uygulamada (Android/iOS) dosya önbelleğe yazılıp sistem paylaşım penceresiyle gönderilir;
 * web'de destekleniyorsa Web Share ile, değilse indirme olarak verilir.
 */
import artFilm from '../assets/home/film.webp';
import tiger from '../assets/home/tiger.webp';
import { shareImage } from './shareCard';

export interface StoryInfo {
  name: string;
  pts: number;
  rank: number;
  players: number;
  films: number;
}

const W = 1080;
const H = 1920;

const img = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

/** Kartı çizer, PNG olarak (data URL) döner. */
/** Hikâye zemini (sinema salonu) + altın degrade yardımcısı. */
async function stage() {
  await Promise.all([document.fonts.load('400 120px "Bebas Neue"'), document.fonts.load('700 40px Fredoka'), document.fonts.load('800 40px Nunito')]).catch(() => {});
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;

  // Salon: koyu degrade, tepede mor ışık, iki spot
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1b1640');
  bg.addColorStop(0.55, '#0e0b27');
  bg.addColorStop(1, '#06051a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, -100, 50, W / 2, -100, 1100);
  glow.addColorStop(0, 'rgba(130,100,230,0.55)');
  glow.addColorStop(1, 'rgba(130,100,230,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);
  for (const [x, dir] of [[180, 1], [900, -1]] as const) {
    const beam = g.createLinearGradient(0, 0, 0, H * 0.9);
    beam.addColorStop(0, 'rgba(255,236,190,0.28)');
    beam.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = beam;
    g.beginPath();
    g.moveTo(x - 30, 0);
    g.lineTo(x + 30, 0);
    g.lineTo(x + dir * 520 + 300, H * 0.9);
    g.lineTo(x + dir * 520 - 300, H * 0.9);
    g.closePath();
    g.fill();
  }
  // Perdeler
  for (const side of [0, 1]) {
    const cg = g.createLinearGradient(side ? W - 120 : 0, 0, side ? W : 120, 0);
    cg.addColorStop(0, '#5e1023');
    cg.addColorStop(0.5, '#a52540');
    cg.addColorStop(1, '#4a0d1e');
    g.fillStyle = cg;
    g.beginPath();
    if (side) {
      g.moveTo(W, 0);
      g.lineTo(W - 130, 0);
      g.bezierCurveTo(W - 100, 600, W - 70, 1200, W - 90, H);
      g.lineTo(W, H);
    } else {
      g.moveTo(0, 0);
      g.lineTo(130, 0);
      g.bezierCurveTo(100, 600, 70, 1200, 90, H);
      g.lineTo(0, H);
    }
    g.closePath();
    g.fill();
  }

  const gold = (y0: number, y1: number) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, '#fff3c9');
    gr.addColorStop(0.55, '#f3c35b');
    gr.addColorStop(1, '#c8902b');
    return gr;
  };
  return { c, g, gold };
}

export async function drawStory(info: StoryInfo): Promise<string> {
  const { c, g, gold } = await stage();
  g.textAlign = 'center';

  g.font = '800 44px Nunito';
  g.fillStyle = 'rgba(246,239,226,0.85)';
  g.fillText('İSİM ŞEHİR SUNAR', W / 2, 220);
  g.font = '400 200px "Bebas Neue"';
  g.shadowColor = 'rgba(243,195,91,0.45)';
  g.shadowBlur = 40;
  g.fillStyle = gold(240, 420);
  g.fillText('SİNEMA', W / 2, 410);
  g.fillStyle = gold(420, 600);
  g.fillText('BİLMECESİ', W / 2, 590);
  g.shadowBlur = 0;

  // Skor kartı
  const cardY = 650;
  g.fillStyle = 'rgba(26,22,58,0.85)';
  g.strokeStyle = 'rgba(243,195,91,0.7)';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(150, cardY, W - 300, 560, 48);
  g.fill();
  g.stroke();
  g.font = '800 46px Nunito';
  g.fillStyle = 'rgba(246,239,226,0.9)';
  g.fillText(info.name.toLocaleUpperCase('tr-TR'), W / 2, cardY + 100);
  g.font = '400 300px "Bebas Neue"';
  g.fillStyle = gold(cardY + 120, cardY + 400);
  g.fillText(String(info.pts), W / 2, cardY + 390);
  g.font = '800 44px Nunito';
  g.fillStyle = '#f3c35b';
  g.fillText('PUAN', W / 2, cardY + 450);
  g.fillStyle = 'rgba(246,239,226,0.85)';
  g.font = '700 40px Nunito';
  const place = info.rank === 1 ? 'Birinci oldum!' : `${info.players} kişide ${info.rank}. oldum`;
  g.fillText(`${info.films} film · ${place}`, W / 2, cardY + 515);

  // Soru + maskot + film resmi
  g.font = '400 120px "Bebas Neue"';
  g.fillStyle = '#ffffff';
  g.fillText('SEN KAÇ FİLM', W / 2, 1360);
  g.fillText('BİLİRSİN?', W / 2, 1465);
  try {
    const [t, f] = await Promise.all([img(tiger), img(artFilm)]);
    g.drawImage(f, 640, 1460, 300, (300 * f.height) / f.width);
    g.drawImage(t, 130, 1480, 470, (470 * t.height) / t.width);
  } catch {
    /* resim yüklenemezse kart yine de paylaşılır */
  }
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect(0, H - 170, W, 170);
  g.font = '800 40px Nunito';
  g.fillStyle = '#f3c35b';
  g.fillText('Google Play\'de “İsim Şehir” · Sinema Bilmecesi', W / 2, H - 92);
  return c.toDataURL('image/png');
}

export interface QuizStoryInfo {
  title: string;
  ask: string;
  pct: number;
  tier: string;
  line: string;
  name: string;
}

/** "Sen Ne Kadar…?" sonuç hikâyesi: soru başlığı, büyük yüzde, unvan, espri cümlesi. */
export async function drawQuizStory(o: QuizStoryInfo): Promise<string> {
  const { c, g, gold } = await stage();
  g.textAlign = 'center';
  g.font = '800 44px Nunito';
  g.fillStyle = 'rgba(246,239,226,0.85)';
  g.fillText('SİNEMA BİLMECESİ · SEN NE KADAR…?', W / 2, 210);
  g.font = '400 120px "Bebas Neue"';
  g.fillStyle = gold(230, 360);
  g.fillText(o.title.toLocaleUpperCase('tr-TR'), W / 2, 350, W - 240);
  g.font = '700 50px Fredoka';
  g.fillStyle = '#ffffff';
  g.fillText(o.ask, W / 2, 440, W - 260);
  // Sonuç kartı
  const y = 520;
  g.fillStyle = 'rgba(26,22,58,0.85)';
  g.strokeStyle = 'rgba(243,195,91,0.7)';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(150, y, W - 300, 760, 48);
  g.fill();
  g.stroke();
  g.font = '800 44px Nunito';
  g.fillStyle = 'rgba(246,239,226,0.9)';
  g.fillText(o.name.toLocaleUpperCase('tr-TR'), W / 2, y + 100);
  g.font = '400 330px "Bebas Neue"';
  g.fillStyle = gold(y + 120, y + 420);
  g.fillText(`%${o.pct}`, W / 2, y + 420);
  g.font = '800 40px Nunito';
  g.fillStyle = '#f3c35b';
  g.fillText('UNVANIM', W / 2, y + 500);
  g.font = '400 96px "Bebas Neue"';
  g.fillStyle = '#ffffff';
  g.fillText(o.tier.toLocaleUpperCase('tr-TR'), W / 2, y + 600, W - 340);
  g.font = '700 36px Nunito';
  g.fillStyle = 'rgba(246,239,226,0.85)';
  const words = o.line.split(' ');
  let line = '';
  let ly = y + 672;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > W - 380 && line) {
      g.fillText(line, W / 2, ly);
      line = w;
      ly += 46;
    } else line = t;
  }
  if (line) g.fillText(line, W / 2, ly);
  g.font = '400 110px "Bebas Neue"';
  g.fillStyle = '#ffffff';
  g.fillText('SEN NE KADARSIN?', W / 2, 1390);
  try {
    const t = await img(tiger);
    g.drawImage(t, W / 2 - 200, 1410, 400, (400 * t.height) / t.width);
  } catch {
    /* resimsiz de olur */
  }
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.fillRect(0, H - 170, W, 170);
  g.font = '800 40px Nunito';
  g.fillStyle = '#f3c35b';
  g.fillText('Google Play\'de “İsim Şehir” · Sinema Bilmecesi', W / 2, H - 92);
  return c.toDataURL('image/png');
}

export async function shareQuizStory(o: QuizStoryInfo): Promise<void> {
  const url = await drawQuizStory(o);
  await shareImage(url, `sen-ne-kadar-${o.pct}.png`, `${o.ask} Ben %${o.pct} çıktım: ${o.tier}! Sen ne kadarsın?`, 'Sonucunu paylaş');
}

/** Kartı çizip paylaşır (metne Play bağlantısı eklenir). Paylaşım iptal edilirse sessizce döner. */
export async function shareStory(info: StoryInfo): Promise<void> {
  const url = await drawStory(info);
  await shareImage(url, 'sinema-bilmecesi-skor.png', `Sinema Bilmecesi'nde ${info.pts} puan yaptım! Sen kaç film bilirsin?`, 'Skorunu paylaş');
}
