/**
 * Maskot kaplan: hafifçe sallanır, arada bir açık gözünü kırpar.
 * Göz kırpma: kırpan gözün aynalanmış hâli (tiger-blink.webp) açık gözün üstünde kısa süre görünür.
 * Konumu resmin piksellerine göre (380×326 resimde 98,120 noktası, 84 px kare).
 */
import blink from '../assets/home/tiger-blink.webp';
import tiger from '../assets/home/tiger.webp';

export function Mascot({ className }: { className?: string }) {
  return (
    <div className={`mascot ${className ?? ''}`} aria-hidden="true">
      <img className="mascot__img" src={tiger} alt="" draggable={false} />
      <img className="mascot__blink" src={blink} alt="" draggable={false} />
    </div>
  );
}
