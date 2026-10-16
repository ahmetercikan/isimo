import { Doodles } from '../components/Doodles';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/ui';
import { PTS } from '../engine/scoring';

const STEPS = [
  { e: 'harf', t: 'Harf çevrilir', d: 'Sayaç A’dan Z’ye sayar. Sırası gelen oyuncu "DUR!" der ve o harf seçilir. Aynı oyunda bir harf iki kez çıkmaz.' },
  { e: 'kalem', t: 'Elinle yaz', d: 'Her kategoriye o harfle başlayan bir kelimeyi parmağınla yaz. Uygulama el yazını okur. İstersen klavyeyle de yazabilirsin.' },
  { e: 'stop', t: 'STOP de!', d: 'Bütün kutuları dolduran STOP diyebilir. Diğerlerinin son 10 saniyesi başlar.' },
  { e: 'oy', t: 'Birlikte kontrol edin', d: 'Cevaplar herkesin ekranına gelir, el yazısıyla birlikte. Uydurma bir cevap mı var? Başparmak düğmesiyle oyla. Çoğunluk derse cevap iptal olur.' },
  { e: 'kupa', t: 'Puanlar', d: `Tek senin cevabınsa ${PTS.unique}, başkası da yazdıysa ${PTS.shared} puan. O kategoride geçerli cevabı olan tek kişi sensen ${PTS.alone} puan!` },
];

export default function HowTo() {
  return (
    <main className="bg page howto">
      <Doodles variant={1} />
      <TopBar title="Nasıl Oynanır?" />
      <ol className="howto__list">
        {STEPS.map((s, i) => (
          <li key={s.t} className="paper-card howto__step rise" style={{ animationDelay: `${i * 0.07}s` }}>
            <span className="howto__emoji"><Icon name={s.e} size={44} /></span>
            <div>
              <h2 className="title-md">{i + 1}. {s.t}</h2>
              <p>{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="howto__tip">İpucu: ✓ işareti, cevabın uygulamanın sözlüğünde olduğunu gösterir. Sözlükte olmayan cevaplar da geçerlidir; son kararı oyuncular verir.</p>
    </main>
  );
}
