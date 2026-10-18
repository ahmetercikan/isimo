import { useState } from 'react';
import { Doodles } from '../components/Doodles';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/ui';
import { PTS } from '../engine/scoring';
import { PTS_WORD } from '../game/chainDirector';
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

export default function HowTo() {
  const [siram, setSiram] = useState(false);
  const steps = siram ? SIRAM : ISIM;
  return (
    <main className="bg page howto">
      <Doodles variant={1} />
      <TopBar title="Nasıl Oynanır?" />
      <div className="seg howto__seg">
        <button className={`seg__btn ${siram ? '' : 'is-on'}`} onClick={() => (sfx.tap(), setSiram(false))}>İsim Şehir</button>
        <button className={`seg__btn ${siram ? 'is-on' : ''}`} onClick={() => (sfx.tap(), setSiram(true))}>Sıra Sende</button>
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
      <p className="howto__tip">
        {siram
          ? 'İpucu: Kelimeyi bulmak zorlaşınca sondaki harfi değiştirmeyi dene: KAR → KAZ → KÖZ…'
          : 'İpucu: ✓ işareti, cevabın uygulamanın sözlüğünde olduğunu gösterir. Sözlükte olmayan cevaplar da geçerlidir; son kararı oyuncular verir.'}
      </p>
    </main>
  );
}
