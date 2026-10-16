/**
 * El çizimi simgeler (emoji yerine) — Çizio'nun simge diliyle aynı: koyu mürekkep kontur (2,6), yuvarlak uçlar,
 * palet renkleri, hafif beyaz parlama. 48×48. Kategoriler, avatarlar, botlar, tepkiler, ödüller.
 * Kullanım: <Icon name="aslan" /> (src/components/Icon.tsx).
 */
const INK = '#3a2b27';
const S = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
const p = (d: string, f = 'none') => `<path d="${d}" fill="${f}" ${S}/>`;
const c = (x: number, y: number, r: number, f: string) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${S}/>`;
const e = (x: number, y: number, rx: number, ry: number, f: string, rot = 0) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${S}${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}/>`;
const r = (x: number, y: number, w: number, h: number, rx: number, f: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${S}/>`;
/** Konturu olmayan dolgu. */
const fp = (d: string, f: string, o = 1) => `<path d="${d}" fill="${f}"${o < 1 ? ` opacity="${o}"` : ''}/>`;
const dot = (x: number, y: number, rr: number, f: string, o = 1) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${f}"${o < 1 ? ` opacity="${o}"` : ''}/>`;
const ln = (d: string, col = INK, w = 2.6) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
/** Parlama. */
const hl = (x: number, y: number, rx: number, ry: number, rot = -30) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".55" transform="rotate(${rot} ${x} ${y})"/>`;
const eyes = (x1: number, x2: number, y: number, rr = 2.4) => dot(x1, y, rr, INK) + dot(x2, y, rr, INK) + dot(x1 + 0.8, y - 0.9, 0.8, '#fff') + dot(x2 + 0.8, y - 0.9, 0.8, '#fff');
const smile = (cx: number, y: number, w = 3.5) => ln(`M${cx - w} ${y}Q${cx} ${y + w * 0.9} ${cx + w} ${y}`);
const cheeks = (x1: number, x2: number, y: number) => `<ellipse cx="${x1}" cy="${y}" rx="2.8" ry="1.8" fill="#ff8fa3" opacity=".6"/><ellipse cx="${x2}" cy="${y}" rx="2.8" ry="1.8" fill="#ff8fa3" opacity=".6"/>`;
const txt = (x: number, y: number, s: string, size: number, fill = '#fff') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="Fredoka, Nunito, sans-serif" font-weight="700" font-size="${size}" fill="${fill}">${s}</text>`;
const star = (cx: number, cy: number, R: number, f: string) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? R * 0.48 : R;
    return `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`;
  });
  return p(`M${pts.join('L')}Z`, f);
};

const LEAF = '#5fae6e';
const SKIN = '#f6c9a0';
const YEL = '#ffd43b';

export const ICONS: Record<string, string> = {
  // ------------------------------------------------------------------------------- kategoriler
  isim:
    c(24, 26, 15, SKIN) + p('M9 26c-1-11 6-17 15-17s16 6 15 17c-2-3-5-5-8-6-3 2-8 3-13 2-3 1-6 2-9 4z', '#9a6234') +
    eyes(19, 29, 27) + smile(24, 32) + cheeks(15, 33, 31),
  sehir:
    r(5, 18, 12, 24, 2, '#14a89a') + r(17, 8, 14, 34, 2, '#ff6b4a') + r(31, 22, 12, 20, 2, '#ffc83d') +
    [12, 18, 24, 30].map((y) => dot(21, y, 1.6, '#fff') + dot(27, y, 1.6, '#fff')).join('') +
    [23, 29, 35].map((y) => dot(11, y, 1.5, '#d4f3ee')).join('') + [27, 33].map((y) => dot(37, y, 1.5, '#fff6d6')).join('') +
    ln('M3 42h42') + ln('M24 8V4'),
  hayvan:
    // Yele: önce kalın mürekkep dış hat, üstüne konturu olmayan dolgu (iç çizgi kalmaz)
    Array.from({ length: 10 }, (_, i) => dot(24 + Math.cos((i * Math.PI) / 5) * 14, 25 + Math.sin((i * Math.PI) / 5) * 14, 8.3, INK)).join('') +
    Array.from({ length: 10 }, (_, i) => dot(24 + Math.cos((i * Math.PI) / 5) * 14, 25 + Math.sin((i * Math.PI) / 5) * 14, 7, '#e8892b')).join('') +
    dot(24, 25, 14, '#e8892b') + c(14, 15, 3.6, '#ffc83d') + c(34, 15, 3.6, '#ffc83d') + c(24, 26, 12, '#ffc83d') +
    eyes(19.5, 28.5, 23, 2.1) + e(21, 31, 3.4, 2.8, '#fff6ea') + e(27, 31, 3.4, 2.8, '#fff6ea') + p('M21.5 27.5h5l-2.5 3z', '#8a4b23') + ln('M24 30.5v3'),
  bitki:
    ln('M24 42V20', '#3d8f4f', 3) + p('M24 32c-8 0-12-5-13-11 7 0 12 4 13 11z', LEAF) + p('M24 28c7-1 11-6 11-12-7 1-11 6-11 12z', LEAF) +
    Array.from({ length: 6 }, (_, i) => e(24 + Math.cos((i * Math.PI) / 3) * 5, 12 + Math.sin((i * Math.PI) / 3) * 5, 4, 2.6, '#ff8fb8', i * 60)).join('') +
    c(24, 12, 3.2, '#ffc83d') + p('M14 42h20l-2 4H16z', '#c96f3b'),
  esya:
    r(12, 6, 24, 20, 5, '#ff8a3d') + r(9, 24, 30, 7, 3, '#e8692a') + ln('M13 31v12M35 31v12M13 38h22') + hl(17, 12, 2, 4, 0),
  ulke:
    c(24, 24, 18, '#4dabf7') +
    fp('M14 12c4 0 6 3 5 6s-5 2-6 5 2 6 0 8-6-1-7-5c-1-6 3-13 8-14z', '#69db7c') + fp('M28 9c5 1 10 5 12 11-3 0-5-2-7-1s-2 4-5 4-3-4-2-7-1-5 2-7z', '#69db7c') +
    fp('M27 30c3-1 7 0 8 3s-2 7-6 8-6-2-5-5 0-5 3-6z', '#69db7c') +
    `<circle cx="24" cy="24" r="18" fill="none" ${S}/>` + hl(15, 13, 3, 6),
  meslek:
    p('M12 27c-5-1-7-7-3-11 2-2 5-2 7-1 1-5 5-8 8-8s7 3 8 8c2-1 5-1 7 1 4 4 2 10-3 11z', '#ffffff') +
    r(13, 27, 22, 12, 3, '#ffffff') + ln('M20 30v6M28 30v6') + ln('M13 33h22', '#14a89a', 3),
  yemek:
    p('M6 24h36c0 10-8 16-18 16S6 34 6 24z', '#ff6b4a') + e(24, 24, 18, 4, '#ffc83d') + ln('M5 24h38') +
    ln('M17 18c-2-3 2-5 0-8M24 18c-2-3 2-5 0-8M31 18c-2-3 2-5 0-8', '#8c766e', 2.2) + r(18, 40, 12, 3, 1.5, '#de4d2d') + hl(13, 30, 2, 4, 30),
  unlu: star(24, 25, 19, '#ffc83d') + eyes(19.5, 28.5, 25, 2) + smile(24, 29, 3) + hl(18, 17, 2, 4),
  marka:
    p('M8 10h16l18 18-14 14L10 24z', '#e9487d') + c(15, 16, 3, '#fff') + ln('M15 16c-6-8-12-3-9 2', INK, 2) +
    ln('M21 27l8 8M24 23l8 8', '#ffd1df', 2.6),
  dizi:
    r(6, 18, 36, 24, 3, '#3a3f4a') + p('M6 18l2-9 34-5 2 9z', '#3a3f4a') +
    fp('M11 8.5l6-1-4 9-6 1zM23 6.8l6-0.9-4 9-6 0.9zM35 5l6-0.9-4 9-6 0.9z', '#fff') +
    fp('M20 23.5v13l11-6.5z', '#ffc83d'),
  spor:
    c(24, 24, 18, '#ffffff') + p('M24 16l7 5-3 8h-8l-3-8z', INK) +
    ln('M24 16V7M31 21l8-3M28 29l5 8M20 29l-5 8M17 21l-8-3') + hl(16, 14, 2.5, 5),
  renk:
    p('M24 6C12 6 5 14 5 23c0 9 7 15 15 15 4 0 4-3 3-5-1-3 1-5 4-5h6c6 0 10-4 10-9C43 12 34 6 24 6z', '#f5e6c8') +
    dot(14, 20, 3.2, '#ef4b4b') + dot(20, 13, 3.2, '#ffc83d') + dot(29, 12, 3.2, '#2bb673') + dot(36, 19, 3.2, '#4dabf7') +
    `<circle cx="14" cy="20" r="3.2" fill="none" ${S}/><circle cx="20" cy="13" r="3.2" fill="none" ${S}/><circle cx="29" cy="12" r="3.2" fill="none" ${S}/><circle cx="36" cy="19" r="3.2" fill="none" ${S}/>`,
  vucut:
    p('M16 44V26l-5-6c-2-3 2-6 4-3l4 5V9c0-3 4-3 4 0v12V6c0-3 4-3 4 0v15V8c0-3 4-3 4 0v14-10c0-3 4-3 4 0v19c0 7-4 13-10 13z', SKIN) + hl(30, 30, 2, 5, 0),
  ozel: star(24, 24, 18, '#7c5cff') + star(38, 9, 5, '#ffc83d') + hl(18, 16, 2, 4),

  // ------------------------------------------------------------------------------- avatarlar
  tilki:
    p('M9 22L10 5l11 10z', '#ff8a3d') + p('M39 22L38 5 27 15z', '#ff8a3d') + fp('M12 16l1-6 5 5z', '#ffe3c2') + fp('M36 16l-1-6-5 5z', '#ffe3c2') +
    p('M6 22c0-8 8-11 18-11s18 3 18 11c0 10-9 19-18 21C15 41 6 32 6 22z', '#ff8a3d') +
    fp('M9 26c5 0 10 3 15 12 5-9 10-12 15-12-1 7-7 14-15 15C16 40 10 33 9 26z', '#fff6ea') +
    eyes(17, 31, 24) + c(24, 37, 2.2, INK),
  panda:
    c(12, 12, 6, '#2f3640') + c(36, 12, 6, '#2f3640') + c(24, 26, 17, '#ffffff') +
    e(17, 25, 4.5, 6, '#2f3640', -30) + e(31, 25, 4.5, 6, '#2f3640', 30) + dot(17.5, 24.5, 1.8, '#fff') + dot(30.5, 24.5, 1.8, '#fff') +
    e(24, 31, 2.8, 2, INK) + ln('M21 34q3 2 6 0') + cheeks(12.5, 35.5, 32),
  kurbaga:
    c(14, 15, 7, '#7ed957') + c(34, 15, 7, '#7ed957') + e(24, 29, 20, 14, '#7ed957') + c(14, 15, 4, '#fff') + c(34, 15, 4, '#fff') +
    dot(14.5, 15.5, 2, INK) + dot(34.5, 15.5, 2, INK) + ln('M13 31q11 9 22 0') + cheeks(10, 38, 30) + dot(21, 25, 0.9, INK) + dot(27, 25, 0.9, INK),
  kaplan:
    c(12, 13, 5.5, '#ff9f1c') + c(36, 13, 5.5, '#ff9f1c') + c(24, 26, 17, '#ff9f1c') +
    ln('M24 10v5M19 11l1 4M29 11l-1 4M8 23h5M8 28h4M40 23h-5M40 28h-4') + e(24, 33, 9, 6.5, '#fff6ea') +
    eyes(18, 30, 23) + fp('M21.5 29h5l-2.5 3z', '#ff8fa3') + ln('M24 32v2M21 35q3 2 6 0'),
  ahtapot:
    p('M9 30c-2 6-6 8-5 11 3 1 6-2 8-6 0 5-1 8 1 9 3 0 4-4 5-8 1 4 2 8 6 8s5-4 6-8c1 4 2 8 5 8 2-1 1-4 1-9 2 4 5 7 8 6 1-3-3-5-5-11z', '#b197fc') +
    p('M8 28C8 14 15 6 24 6s16 8 16 22z', '#b197fc') + eyes(18, 30, 21) + smile(24, 25, 3) + cheeks(13, 35, 25) + hl(16, 12, 2.5, 4),
  tekboynuz:
    p('M24 3l4 13h-8z', '#ffd43b') + ln('M21.5 9.5l5-1.5M20.8 12.5l6-1.6', '#e8a200', 1.6) +
    p('M14 14l-1-8 7 5zM34 14l1-8-7 5z', '#fff') + e(24, 27, 14, 15, '#ffffff') +
    p('M10 20c-5 4-5 13 1 18 0-6 2-11 5-14z', '#ff8fb8') + p('M12 16c2-5 7-6 11-4-4 1-7 4-8 8z', '#b197fc') +
    eyes(19, 29, 25) + e(24, 36, 8, 5, '#ffd6e4') + dot(21, 36, 1, INK) + dot(27, 36, 1, INK) + cheeks(14.5, 33.5, 30),
  maymun:
    c(8, 24, 6, '#9a6234') + c(40, 24, 6, '#9a6234') + dot(8, 24, 3, '#e8c39e') + dot(40, 24, 3, '#e8c39e') + c(24, 24, 16, '#9a6234') +
    p('M24 41c-8 0-13-5-13-11 0-4 3-7 6-7 3 0 5 2 7 2s4-2 7-2c3 0 6 3 6 7 0 6-5 11-13 11z', '#e8c39e') +
    e(19, 20, 5, 5.5, '#e8c39e') + e(29, 20, 5, 5.5, '#e8c39e') + eyes(19, 29, 21) + dot(22.5, 30, 1, INK) + dot(25.5, 30, 1, INK) + smile(24, 34, 4),
  koala:
    c(9, 17, 8, '#a7b1bd') + c(39, 17, 8, '#a7b1bd') + dot(9, 17, 4.5, '#f3c6d0') + dot(39, 17, 4.5, '#f3c6d0') + c(24, 27, 15, '#a7b1bd') +
    eyes(18, 30, 24) + e(24, 31, 4, 5.5, '#3a3f4a') + hl(23, 29, 0.8, 1.6, 0) + cheeks(14, 34, 32),
  tavsan:
    e(17, 12, 4.5, 11, '#ffffff', -8) + e(31, 12, 4.5, 11, '#ffffff', 8) + fp('M15.5 5c2 0 3 4 2 12-2 0-3-4-2-12z', '#ffc2d1') + fp('M32.5 5c-2 0-3 4-2 12 2 0 3-4 2-12z', '#ffc2d1') +
    c(24, 31, 13, '#ffffff') + eyes(19, 29, 29) + fp('M22 33h4l-2 2z', '#ff8fa3') + ln('M24 35v1.5M21.5 37q2.5 1.5 5 0') +
    ln('M12 33l5 0.5M12 37l5-1M36 33l-5 0.5M36 37l-5-1', INK, 1.6) + cheeks(16, 32, 35),
  penguen:
    c(24, 25, 18, '#2f3640') + p('M24 41c-8 0-13-6-13-12 0-6 4-12 8-12 2 0 4 1 5 3 1-2 3-3 5-3 4 0 8 6 8 12 0 6-5 12-13 12z', '#ffffff') +
    eyes(19, 29, 25) + p('M21 30h6l-3 4z', '#ff9f1c') + cheeks(15, 33, 32),
  aslan: '',
  kopek:
    e(10, 24, 5.5, 11, '#9a6234', 15) + e(38, 24, 5.5, 11, '#9a6234', -15) + c(24, 25, 15, '#f2c48d') + e(30, 21, 5, 5.5, '#c98a4b') +
    eyes(19, 30, 22) + e(24, 32, 8.5, 6.5, '#fff6ea') + e(24, 29, 3.4, 2.4, INK) + ln('M24 31.5v2M21 34q3 2 6 0') + fp('M22.5 35h3v3a1.5 1.5 0 0 1-3 0z', '#ff6b81'),
  kedi:
    p('M9 22L11 6l10 9z', '#ffb366') + p('M39 22L37 6 27 15z', '#ffb366') + fp('M12.5 16l1-6 4.5 4z', '#ffd6e4') + fp('M35.5 16l-1-6-4.5 4z', '#ffd6e4') +
    c(24, 27, 15, '#ffb366') + ln('M24 13v4M20 14l1 3M28 14l-1 3', '#e07b1a', 2) +
    eyes(18.5, 29.5, 26) + fp('M22.5 30h3l-1.5 2z', '#ff8fa3') + ln('M24 32q-2 2.5-4 1M24 32q2 2.5 4 1') +
    ln('M8 29l7 1M8 33l7-1M40 29l-7 1M40 33l-7-1', INK, 1.6),
  ayi:
    c(11, 13, 6.5, '#a0673b') + c(37, 13, 6.5, '#a0673b') + dot(11, 13, 3, '#e8c39e') + dot(37, 13, 3, '#e8c39e') + c(24, 26, 16, '#a0673b') +
    e(24, 32, 8, 6, '#e8c39e') + eyes(18, 30, 23) + e(24, 29.5, 3.2, 2.3, INK) + ln('M24 32v1.5M21.5 34.5q2.5 1.5 5 0'),
  balina:
    ln('M24 13c0-4-3-6-6-6M24 13c0-4 3-6 6-6M24 13V7', '#4dabf7', 2.4) +
    p('M5 30c0-10 8-16 19-16s19 6 19 16c0 6-5 10-12 10H17C10 40 5 36 5 30z', '#4dabf7') +
    fp('M10 34c5 3 23 3 28 0-2 4-5 6-9 6H19c-4 0-7-2-9-6z', '#d0ebff') + eyes(16, 32, 27) + smile(24, 31, 4) + cheeks(12, 36, 31) + hl(14, 19, 2.5, 5),
  dino:
    p('M14 12l3-7 3 6 4-7 4 7 3-6 3 7', '#ff9f1c') + c(24, 26, 16, '#69db7c') + e(24, 33, 11, 7, '#b2f2bb') +
    eyes(17, 31, 22) + dot(21, 30, 1, INK) + dot(27, 30, 1, INK) + ln('M16 35q8 6 16 0') + fp('M20 36.5l1.5 2.5 1.5-2.2zM25 36.8l1.5 2.2 1.5-2.5z', '#fff'),
  ari:
    e(13, 13, 6, 8, '#d0ebff', -30) + e(35, 13, 6, 8, '#d0ebff', 30) + ln('M20 10l-3-6M28 10l3-6') + dot(17, 4, 1.8, INK) + dot(31, 4, 1.8, INK) +
    c(24, 27, 16, YEL) + fp('M9.5 22h29a16 16 0 0 1 1.3 5H8.2a16 16 0 0 1 1.3-5zM8.3 31h31.4a16 16 0 0 1-2.2 5H10.5a16 16 0 0 1-2.2-5z', '#3a2b27') +
    `<circle cx="24" cy="27" r="16" fill="none" ${S}/>` + dot(18, 18, 2.2, INK) + dot(30, 18, 2.2, INK) + dot(18.8, 17.2, 0.8, '#fff') + dot(30.8, 17.2, 0.8, '#fff'),
  ugur:
    c(24, 12, 7, '#2f3640') + dot(21, 11, 1.8, '#fff') + dot(27, 11, 1.8, '#fff') + dot(21.3, 11.2, 0.9, INK) + dot(27.3, 11.2, 0.9, INK) +
    c(24, 28, 16, '#ef4b4b') + ln('M24 13v31') + dot(16, 24, 3, INK) + dot(32, 24, 3, INK) + dot(17, 34, 2.6, INK) + dot(31, 34, 2.6, INK) + dot(24, 40, 1.8, INK) + hl(15, 20, 2, 4),
  papagan:
    p('M18 9c-1-4 2-6 5-5-1 3 1 5 1 5 1-3 4-4 6-2-2 2-2 4-2 4', '#69db7c') + c(24, 26, 16, '#ef4b4b') + e(30, 23, 7, 8, '#ffffff') +
    dot(31, 22, 2.6, INK) + dot(31.8, 21.2, 0.9, '#fff') + p('M18 25c4-2 9 0 9 6 0 4-3 7-6 7 1-3 0-6-3-6-2 0-3-4 0-7z', '#ffc83d') + fp('M8 32c2 4 5 7 9 8-4 1-8 0-10-3z', '#ffc83d'),
  kirpi:
    Array.from({ length: 11 }, (_, i) => {
      const a = Math.PI + (i * Math.PI) / 10;
      const [x1, y1] = [24 + Math.cos(a - 0.14) * 15, 28 + Math.sin(a - 0.14) * 15];
      const [x2, y2] = [24 + Math.cos(a) * 23, 28 + Math.sin(a) * 23];
      const [x3, y3] = [24 + Math.cos(a + 0.14) * 15, 28 + Math.sin(a + 0.14) * 15];
      return p(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${x3.toFixed(1)} ${y3.toFixed(1)}`, '#8a5a35');
    }).join('') +
    e(24, 30, 15, 12, '#e8c39e') + eyes(18.5, 29.5, 28) + c(24, 34, 2.4, INK) + cheeks(14, 34, 33),
  inek:
    p('M10 13c-3-1-5-4-4-7 3 0 5 2 6 4M38 13c3-1 5-4 4-7-3 0-5 2-6 4', '#fff6d6') + e(8, 21, 5, 3, '#ffffff', -20) + e(40, 21, 5, 3, '#ffffff', 20) +
    e(24, 24, 14, 15, '#ffffff') + fp('M14 14c4-1 7 2 6 6s-5 4-7 2-2-7 1-8z', INK) + fp('M33 25c3 0 4 3 3 5s-4 2-5 0 0-5 2-5z', INK) +
    eyes(19, 29, 23) + e(24, 35, 11, 7, '#ffb3c1') + dot(20, 35, 1.4, INK) + dot(28, 35, 1.4, INK),
  baykus:
    p('M9 14l3-9 6 6M39 14l-3-9-6 6', '#a0673b') + c(24, 26, 17, '#a0673b') + e(24, 32, 10, 9, '#e8c39e') +
    c(17, 22, 7, '#ffffff') + c(31, 22, 7, '#ffffff') + dot(17, 22, 3.2, INK) + dot(31, 22, 3.2, INK) + dot(18, 21, 1, '#fff') + dot(32, 21, 1, '#fff') +
    p('M21.5 27h5L24 32z', '#ff9f1c') + ln('M20 36l2 2 2-2 2 2 2-2', '#a0673b', 1.8),
  kaplumbaga:
    p('M3 44c0-11 9-17 21-17s21 6 21 17z', '#2bb673') + ln('M12 44l4-9h16l4 9M16 35l8-6 8 6', '#1c7c4d', 2) +
    c(24, 20, 12, '#a9e34b') + eyes(19.5, 28.5, 19) + smile(24, 23, 3) + cheeks(15, 33, 23),
  ejderha:
    p('M13 15c-3-5-2-10 1-12 0 4 2 7 5 8M35 15c3-5 2-10-1-12 0 4-2 7-5 8', '#ffd43b') +
    p('M7 22l-4-6 7 1M41 22l4-6-7 1', '#9775fa') + c(24, 26, 16, '#9775fa') + e(24, 33, 10, 7, '#d0bfff') +
    eyes(18, 30, 22) + dot(21, 31, 1.1, INK) + dot(27, 31, 1.1, INK) + ln('M17 35q7 5 14 0') + fp('M19.5 36l1.5 2.8 1.5-2.3z', '#fff') + ln('M19 12l2 3M24 11v3M29 12l-2 3', '#7048e8', 2),
  robot:
    ln('M24 13V6') + c(24, 5, 2.6, '#ef4b4b') + r(8, 13, 32, 27, 8, '#a5b4fc') + r(4, 22, 4, 9, 2, '#748ffc') + r(40, 22, 4, 9, 2, '#748ffc') +
    r(13, 18, 22, 12, 5, '#2f3640') + dot(19, 24, 2.6, '#66d9e8') + dot(29, 24, 2.6, '#66d9e8') + r(17, 33, 14, 4, 2, '#ffffff') + ln('M21.5 33v4M26.5 33v4', INK, 1.6),
  cita:
    p('M10 18L9 7l9 5M38 18l1-11-9 5', '#ffc861') + c(24, 26, 16, '#ffc861') +
    [[15, 17], [33, 17], [12, 27], [36, 27], [24, 13], [19, 13], [29, 13]].map(([x, y]) => dot(x, y, 1.5, INK)).join('') +
    eyes(18, 30, 22) + ln('M17 24.5q-1 6 3 10M31 24.5q1 6-3 10', INK, 1.8) + e(24, 33, 7, 5, '#fff6ea') + fp('M21.5 29.5h5L24 32z', INK) + ln('M24 32v1.5M22 35q2 1.5 4 0'),
  uzayli:
    ln('M17 11l-4-6M31 11l4-6') + c(13, 5, 2.6, '#ff8fb8') + c(35, 5, 2.6, '#ff8fb8') +
    p('M24 9c11 0 17 8 17 16 0 10-9 18-17 18S7 35 7 25c0-8 6-16 17-16z', '#8ce99a') +
    e(17, 25, 5, 7, INK, 30) + e(31, 25, 5, 7, INK, -30) + dot(16, 23, 1.5, '#fff') + dot(32, 23, 1.5, '#fff') + smile(24, 35, 2.5),

  // ------------------------------------------------------------------------------- tepkiler
  haha:
    c(24, 24, 19, YEL) + ln('M14 19q3-4 6 0M28 19q3-4 6 0') + p('M13 27h22c0 7-5 11-11 11s-11-4-11-11z', '#c92a2a') + fp('M18 33.5c3-2 9-2 12 0-2 3-10 3-12 0z', '#ff8fa3') +
    fp('M7 20c-3 3-3 6 0 7 2-1 2-4 0-7zM41 20c3 3 3 6 0 7-2-1-2-4 0-7z', '#4dabf7') + hl(15, 12, 2.5, 4),
  vay:
    c(24, 24, 19, YEL) + ln('M14 13q4-3 7-1M27 12q3-2 7 1') + c(18, 20, 3.5, '#fff') + c(30, 20, 3.5, '#fff') + dot(18, 20.5, 1.8, INK) + dot(30, 20.5, 1.8, INK) +
    e(24, 32, 4, 5, '#7a2a1a') + hl(15, 12, 2.5, 4),
  hmm:
    c(24, 24, 19, YEL) + ln('M14 15l7-2M27 16q3-2 7 0') + eyes(18, 30, 21) + ln('M18 32l12-2') + hl(15, 12, 2.5, 4),
  uzgun:
    c(24, 24, 19, YEL) + ln('M14 18l6-2.5M34 18l-6-2.5') + eyes(18, 30, 22) + ln('M17 33q7-6 14 0') + fp('M31 25c-2 3-2 6 0 7 2-1 2-4 0-7z', '#4dabf7') + hl(15, 12, 2.5, 4),
  kalp: p('M24 42C10 33 5 25 6 17c1-7 9-10 14-6 2 1 3 3 4 4 1-1 2-3 4-4 5-4 13-1 14 6 1 8-4 16-18 25z', '#ef4b4b') + hl(15, 16, 2.5, 5),
  ates:
    p('M24 44c-9 0-15-6-15-14 0-7 5-11 7-17 3 3 3 7 3 9 2-6 5-12 11-17 0 6 4 10 7 15 2 4 3 7 3 10 0 8-7 14-16 14z', '#ff6b4a') +
    p('M24 44c-5 0-8-3-8-8 0-4 3-6 4-10 2 2 3 4 3 6 2-3 4-5 6-7 0 4 3 6 3 10 0 5-3 9-8 9z', '#ffc83d'),

  // ------------------------------------------------------------------------------- ödül, kural, diğer
  kupa:
    p('M14 8h20v8c0 7-4 12-10 12S14 23 14 16z', '#ffc83d') + ln('M14 11H8c0 6 3 9 7 9M34 11h6c0 6-3 9-7 9') +
    p('M21 28h6l1 7h-8z', '#e8a200') + r(14, 35, 20, 6, 2, '#a0673b') + hl(19, 13, 2, 4, 0),
  m1: p('M16 4l6 14-4 2-7-14zM32 4l-6 14 4 2 7-14z', '#4dabf7') + c(24, 30, 13, '#ffc83d') + txt(24, 36, '1', 15, '#a86b00') + hl(18, 24, 2, 4),
  m2: p('M16 4l6 14-4 2-7-14zM32 4l-6 14 4 2 7-14z', '#e9487d') + c(24, 30, 13, '#dfe6ee') + txt(24, 36, '2', 15, '#6c7a89') + hl(18, 24, 2, 4),
  m3: p('M16 4l6 14-4 2-7-14zM32 4l-6 14 4 2 7-14z', '#2bb673') + c(24, 30, 13, '#e3965a') + txt(24, 36, '3', 15, '#7a4419') + hl(18, 24, 2, 4),
  yildiz: star(24, 25, 20, '#ffc83d') + hl(18, 17, 2, 4),
  simsek: p('M27 3L10 27h11l-4 18 20-26H25z', '#ffd43b') + hl(22, 13, 1.5, 4, 30),
  kitap:
    r(6, 30, 34, 9, 2, '#ff6b4a') + r(9, 21, 32, 9, 2, '#14a89a') + r(7, 12, 30, 9, 2, '#7c5cff') +
    ln('M33 33v3M36 24v3M31 15v3', '#fff', 2) + ln('M3 41h42'),
  konfeti:
    p('M6 44l8-22 14 14z', '#ffc83d') + ln('M10 33l5 5M12 27l9 9', '#e8a200', 2) +
    dot(30, 10, 2.6, '#ef4b4b') + dot(40, 18, 2.4, '#14a89a') + dot(36, 7, 2, '#7c5cff') + dot(42, 30, 2.2, '#e9487d') +
    ln('M21 17q2-6 7-6M28 22q6-1 8 3M30 30q5 1 6 5', '#ff6b4a', 2.4) + p('M24 5l1.5 3 3 .5-2.2 2 .5 3-2.8-1.4-2.8 1.4.5-3-2.2-2 3-.5z', '#ffd43b'),
  harf: r(6, 6, 36, 36, 10, '#ff6b4a') + fp('M8 36h32v1a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z', '#de4d2d', 0.55) + ln('M15.5 34l8.5-22 8.5 22M18.8 26.5h10.4', '#fff', 4.6) + hl(13, 12, 2, 4),
  kalem:
    p('M8 40l3-10L32 9l7 7-21 21z', '#ffc83d') + p('M8 40l3-10 7 7z', '#f3cf9e') + fp('M8 40l1.3-4.3 3 3z', INK) +
    p('M32 9l3-3c1.5-1.5 3.5-1.5 5 0l2 2c1.5 1.5 1.5 3.5 0 5l-3 3z', '#ff8fa3') + ln('M14 33l20-20', '#e8a200', 2),
  stop:
    p('M17 4h14l13 13v14L31 44H17L4 31V17z', '#ef4b4b') +
    `<path d="M18.5 8h11L40 18.5v11L29.5 40h-11L8 29.5v-11z" fill="none" stroke="#fff" stroke-width="2"/>` + txt(24, 28.5, 'STOP', 10.5),
  oy:
    p('M17 4h14v16H17z', '#ffffff') + ln('M20 9h8M20 13h6', '#8c766e', 2) + r(7, 18, 34, 24, 4, '#14a89a') + r(16, 18, 16, 4, 2, '#0d8074') + hl(13, 26, 2, 5, 0),
  fis: p('M12 20h24v8c0 7-5 12-12 12S12 35 12 28z', '#a5b4fc') + ln('M18 20V8M30 20V8') + ln('M24 40v6') + ln('M6 6l36 36', '#ef4b4b', 3),
  el: p('M16 44V26l-5-6c-2-3 2-6 4-3l4 5V9c0-3 4-3 4 0v12V6c0-3 4-3 4 0v15V8c0-3 4-3 4 0v14-10c0-3 4-3 4 0v19c0 7-4 13-10 13z', SKIN) + ln('M40 6q4 4 2 9M6 8q-3 4-1 8', '#8c766e', 2),
};

// Aslan: kategori simgesiyle aynı çizim (avatar olarak da)
ICONS.aslan = ICONS.hayvan;

/** SVG metni (boyutlu). */
export function iconSvg(name: string, size = 48): string {
  const body = ICONS[name];
  if (!body) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

export const hasIcon = (name: string) => !!ICONS[name];

/** Oyuncu avatarları (seçim sırasıyla). */
export const AVATAR_IDS = ['tilki', 'panda', 'kurbaga', 'kaplan', 'ahtapot', 'tekboynuz', 'maymun', 'koala', 'tavsan', 'penguen', 'aslan', 'kopek', 'kedi', 'ayi', 'balina', 'dino', 'ari', 'ugur', 'papagan', 'kirpi', 'inek', 'baykus', 'kaplumbaga', 'ejderha'];

/** Eski sürümlerdeki emoji avatarların karşılığı. */
export const EMOJI_AVATAR: Record<string, string> = {
  '🦊': 'tilki', '🐼': 'panda', '🐸': 'kurbaga', '🐯': 'kaplan', '🐙': 'ahtapot', '🦄': 'tekboynuz', '🐵': 'maymun', '🐨': 'koala', '🐰': 'tavsan',
  '🐧': 'penguen', '🦁': 'aslan', '🐶': 'kopek', '🐱': 'kedi', '🐻': 'ayi', '🐷': 'ayi', '🐳': 'balina', '🦖': 'dino', '🐝': 'ari', '🦋': 'ari',
  '🐞': 'ugur', '🦜': 'papagan', '🐬': 'balina', '🦔': 'kirpi', '🐮': 'inek', '🤖': 'robot', '🦉': 'baykus', '🐆': 'cita', '🐢': 'kaplumbaga',
  '👽': 'uzayli', '🐲': 'ejderha',
};

/** Avatar değerinin simge adı (yeni: simge adı; eski: emoji). */
export const avatarIcon = (v: string) => (ICONS[v] ? v : EMOJI_AVATAR[v] ?? '');
