# -*- coding: utf-8 -*-
"""Sıra Sende kelime havuzunu açık listelerden üretir (bkz. CLAUDE.md).

Kaynaklar (repoda tutulmaz, gerekince indirilir):
  zemberek.dict  https://raw.githubusercontent.com/ahmetaa/zemberek-nlp/master/
                 morphology/src/main/resources/tr/master-dictionary.dict   (~369 KB, Apache-2.0)
  tdk-words.txt  https://raw.githubusercontent.com/mertemin/turkish-word-list/master/words.txt  (~701 KB)

Kullanım (proje kökünden):
  mkdir -p /tmp/kelime-kaynak && cd /tmp/kelime-kaynak
  curl -sLO <yukarıdaki iki adres>
  python3 -I scripts/dict-src/kelime-uret.py /tmp/kelime-kaynak/zemberek.dict \
      /tmp/kelime-kaynak/tdk-words.txt src/data/dict/kelime.json scripts/dict-src/kelime.txt
  node scripts/dict-src/build.cjs kelime

Mevcut kelime.json da kaynağa katılır: elle derlenen eski kelimeler kaybolmaz.
"""
import sys, re, json, collections

ZEM, TDK, CUR, OUT = sys.argv[1:5]

# Oyunda çekilebilen harfler (src/engine/chain.ts → LETTERS). Havuzdaki her kelime
# yalnız bu harflerden olmalı: q/w/x ya da â/î/û içeren kelimeye oyunda ULAŞILAMAZ.
LETTERS = set('abcçdefgğhıijklmnoöprsştuüvyz')
MINLEN, MAXLEN = 3, 6

def tr_lower(s):
    return s.replace('I', 'ı').replace('İ', 'i').lower()

def clean(raw):
    """Kelimeyi havuz biçimine çevirir; uygun değilse None."""
    w = raw.strip()
    if not w or ' ' in w or '-' in w or "'" in w or '.' in w:
        return None
    if w[0] != tr_lower(w[0]):          # özel ad (Abana, Ahmet)
        return None
    w = tr_lower(w)
    if not (MINLEN <= len(w) <= MAXLEN):
        return None
    if not set(w) <= LETTERS:
        return None
    return w

# ---- Küfür/argo ve 13+ için uygunsuz kelimeler: havuza girmez ----
BLOCK = set("""
sik sike siki siko siker sikim sikiş sikme sikti sikik am amcık amcik got göt gotu götü
göte götte yarak yarrak taşak tasak kıç kic kıçı piç pic piçi orospu oruspu kahpe kaltak
fahişe fahise ibne ibine gavat pezo pezevenk kerhane genelev puşt pust yavşak yavsak
dalyarak dallama meme memeli zubuk zıkkım zikkim bok boku boklu bokla bokluk osuruk
osurma osurmak kaka cibilliyet kancık kancik sürtük surtuk
penis vajina meni sperm seks sex porno zina fuhuş fuhus zeker testis kondom
libido orgazm döl dölüt pipi kuku apış apis oynaş oynas sürtme surtme
sidik sidikli çiş cis dışkı diski gaita işemek isemek
nonoş nonos zenci eroin kokain
""".split())

# Not: tıbbi/tarihsel ya da birinci anlamı masum olan kelimeler havuzda KALIR
# (dalak, hıyar, kaşar, kart, köle, cariye, dönme, rahim, cinsel, esrar, afyon, haşhaş…):
# bunlar sözlük kelimesi ve oyunda sorun çıkarmaz.

pool = set()
src = collections.Counter()

# 1) Mevcut havuz (elle derlenen kelimeler kaybolmasın)
cur = json.load(open(CUR, encoding='utf-8'))
for w in (cur if isinstance(cur, list) else cur['words']):
    c = clean(w)
    if c:
        pool.add(c); src['mevcut'] += 1
onceki = set(pool)

# 2) Zemberek kök sözlüğü: "kelime [P:Noun]" / etiketsiz
for ln in open(ZEM, encoding='utf-8'):
    ln = ln.strip()
    if not ln or ln.startswith('#'):
        continue
    m = re.match(r'^(.*?)\s*\[(.*)\]$', ln)
    word, tags = (m.group(1), m.group(2)) if m else (ln, '')
    if 'Prop' in tags or 'Abbrv' in tags or 'Punc' in tags or 'Num' in tags:
        continue
    c = clean(word)
    if c and c not in pool:
        pool.add(c); src['zemberek'] += 1

# 3) TDK türevi düz liste
for ln in open(TDK, encoding='utf-8'):
    c = clean(ln)
    if c and c not in pool:
        pool.add(c); src['tdk'] += 1

atilan = pool & BLOCK
pool -= BLOCK

# ---- Zincir sağlığı ----
def neighbours(words):
    s = set(words)
    out = {}
    for w in words:
        n = []
        for i in range(len(w)):
            for ch in LETTERS:
                if ch != w[i]:
                    y = w[:i] + ch + w[i+1:]
                    if y in s:
                        n.append(y)
        out[w] = n
    return out

def rapor(words, baslik):
    print('\n%s' % baslik)
    nb = neighbours(words)
    for ln_ in (3, 4, 5, 6):
        g = [w for w in words if len(w) == ln_]
        if not g:
            continue
        dead = [w for w in g if not nb[w]]
        avg = sum(len(nb[w]) for w in g) / len(g)
        print('  %d harfli: %5d kelime | çıkmaz %4d (%%%2d) | ortalama komşu %.2f'
              % (ln_, len(g), len(dead), round(100 * len(dead) / len(g)), avg))

print('Kaynak katkısı:', dict(src))
print('Küfür süzgecinde atılan: %d %s' % (len(atilan), sorted(atilan) if atilan else ''))
rapor(sorted(onceki), 'ÖNCE (mevcut havuz, %d kelime)' % len(onceki))
rapor(sorted(pool), 'SONRA (yeni havuz, %d kelime)' % len(pool))

# ---- kelime.txt yaz: ilk harfe + uzunluğa göre gruplar, satırda | ile ----
groups = collections.OrderedDict()
for w in sorted(pool, key=lambda x: (x[0], len(x), x)):
    groups.setdefault((w[0], len(w)), []).append(w)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write('# Genel Türkçe kelime havuzu: "Sıra Sende" (harf değiştir) oyunu için.\n')
    f.write('# Yalnızca %d-%d harfli, sözlükte olan kelimeler; yalnız oyunda çekilebilen harfler\n' % (MINLEN, MAXLEN))
    f.write('# (q/w/x ve â/î/û içeren kelime havuza girmez: oyunda o kelimeye ulaşılamaz).\n')
    f.write('# Kaynak: Zemberek kök sözlüğü + TDK türevi açık liste + elle derlenen eski havuz.\n')
    f.write('# Özel adlar, kısaltmalar, çok kelimeli girişler ve argo/küfür ayıklandı.\n')
    f.write('# Üretim: scripts/dict-src/kelime-uret.py (bkz. CLAUDE.md). Her satır bir grup; kelimeler düşey çizgiyle ayrılır.\n')
    for (letter, n), ws in groups.items():
        f.write('|'.join(ws) + '\n')
print('\nYazıldı: %s (%d kelime, %d satır)' % (OUT, len(pool), len(groups)))
