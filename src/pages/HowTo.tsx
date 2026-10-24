import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Doodles } from '../components/Doodles';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/ui';
import { PTS } from '../engine/scoring';
import { PTS_WORD } from '../game/chainDirector';
import { CLUE_PTS } from '../engine/film';
import { sfx } from '../lib/sfx';

const ISIM = [
  { e: 'harf', t: 'Harf çevrilir', d: 'Sayaç A’dan Z’ye sayar. Sırası gelen oyuncu "DUR!" der ve o harf seçilir. Aynı oyunda bir harf iki kez çıkmaz.' },
  { e: 'kalem', t: 'Elinle yaz', d: 'Her kategoriye o harfle başlayan bir kelimeyi parmağınla yaz. Uygulama el yazını okur. İstersen klavyeyle de yazabilirsin.' },
  { e: 'stop', t: 'STOP de!', d: 'Bütün kutuları dolduran STOP diyebilir. Diğerlerinin son 10 saniyesi başlar. Kutunun dolu sayılması için cevabın turun harfiyle başlaması ve en az iki harfli olması gerekir.' },
  { e: 'oy', t: 'Birlikte kontrol edin', d: 'Cevaplar herkesin ekranına gelir, el yazısıyla birlikte. Uydurma bir cevap mı var? Başparmak düğmesiyle oyla. Çoğunluk derse cevap iptal olur.' },
  { e: 'kupa', t: 'Puanlar', d: `Tek senin cevabınsa ${PTS.unique}, başkası da yazdıysa ${PTS.shared} puan. O kategoride geçerli cevabı olan tek kişi sensen ${PTS.alone} puan!` },
];

const SIRAM = [
  { e: 'harf', t: 'Masaya bir kelime gelir', d: 'Örneğin AYAR. Oyun kelimeyi herkese gösterir ve sıra ilk oyuncuda başlar.' },
  { e: 'kalem', t: 'Tek bir harf değiştir', d: 'AYAR → AYAK. Yeni kelimeyi parmağınla ya da klavyeyle yaz. Ayarlardan "harf ekle/çıkar" da açılabilir (AYAR → AYARI gibi).' },
  { e: 'kitap', t: 'Kelime gerçek olmalı', d: 'Yazdığın kelime uygulamanın sözlüğünde olmalı ve o oyunda daha önce kullanılmamış olmalı. Düğme ancak kural uyunca açılır.' },
  { e: 'kalp', t: 'Süreyi kaçıran can kaybeder', d: 'Bulamazsan ya da pas geçersen bir canın gider. Canı biten elenir, son kalan kazanır. Bu kelimeden gidilecek yer kalmazsa masaya yeni kelime gelir.' },
  { e: 'kupa', t: 'Puanlar', d: `Her doğru kelime ${PTS_WORD} puan. Oyun sonunda zincirin tamamını ve sıralamayı görürsün.` },
];

const FILM = [
  { e: 'dizi', t: 'Gizli bir film var', d: 'Her turda oyun bir film seçer. Herkes aynı anda tahmin eder; sıra beklemek yok.' },
  { e: 'kitap', t: 'İpuçları birer birer açılır', d: 'Önce tür ve yıl, sonra yönetmen, oyuncular, konu ve en sonda adın ilk harfleri. Altı ipucu var.' },
  { e: 'kalem', t: 'Adını yaz', d: 'İlk harfleri yazınca altta film önerileri çıkar; doğru filme dokun. Türkçe adı da orijinal adı da olur, küçük yazım hataları sayılmaz.' },
  { e: 'uzgun', t: 'Yanlış tahmin bekletir', d: 'Yanlış film yazarsan birkaç saniye tahmin edemezsin. Emin olmadan yazma!' },
  { e: 'kupa', t: 'Puanlar', d: `İlk ipucunda bilirsen ${CLUE_PTS[0]}, son ipucunda ${CLUE_PTS[CLUE_PTS.length - 1]} puan. Erken bilen kazanır.` },
];

const GAMES = [
  { key: 'isim', label: 'İsim Şehir', steps: ISIM, tip: 'İpucu: ✓ işareti, cevabın uygulamanın sözlüğünde olduğunu gösterir. Sözlükte olmayan cevaplar da geçerlidir; son kararı oyuncular verir.' },
  { key: 'siram', label: 'Sıra Sende', steps: SIRAM, tip: 'İpucu: Kelimeyi bulmak zorlaşınca sondaki harfi değiştirmeyi dene: KAR → KAZ → KÖZ…' },
  { key: 'film', label: 'Film Avı', steps: FILM, tip: 'İpucu: Uzun film adlarını baştan sona yazmana gerek yok; ilk kelimeyi yaz, listeden seç.' },
] as const;

export default function HowTo() {
  // Ana sayfadaki kartın ">" düğmesi o oyunla açar (?oyun=siram).
  const asked = useSearchParams()[0].get('oyun');
  const [game, setGame] = useState<(typeof GAMES)[number]['key']>(GAMES.find((x) => x.key === asked)?.key ?? 'isim');
  const g = GAMES.find((x) => x.key === game)!;
  const steps = g.steps;
  return (
    <main className="bg page howto">
      <Doodles variant={1} />
      <TopBar title="Nasıl Oynanır?" />
      <div className="seg howto__seg">
        {GAMES.map((x) => (
          <button key={x.key} className={`seg__btn ${game === x.key ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setGame(x.key))}>{x.label}</button>
        ))}
      </div>
      <ol className="howto__list">
        {steps.map((s, i) => (
          <li key={s.t} className="paper-card howto__step rise" style={{ animationDelay: `${i * 0.07}s` }}>
            <span className="howto__emoji"><Icon name={s.e} size={44} /></span>
            <div>
              <h2 className="title-md">{i + 1}. {s.t}</h2>
              <p>{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="howto__tip">{g.tip}</p>
    </main>
  );
}
