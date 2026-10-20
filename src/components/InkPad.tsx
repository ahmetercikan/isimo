/**
 * El yazısı defteri: parmakla ya da kalemle yazılır, çizgiler perfect-freehand ile mürekkep gibi çizilir.
 * Tek parmak takip edilir (avuç içi ve ikinci parmak yok sayılır). Çizgiler üst bileşende tutulur.
 */
import getStroke from 'perfect-freehand';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Stroke } from '../lib/ink';
import { sfx } from '../lib/sfx';

const PEN = { size: 7, thinning: 0.6, smoothing: 0.55, streamline: 0.4, simulatePressure: true };

function outline(s: Stroke, last: boolean): Path2D {
  const pts = s.x.map((x, i) => [x, s.y[i]]);
  const o = getStroke(pts, { ...PEN, last });
  const p = new Path2D();
  if (!o.length) return p;
  p.moveTo(o[0][0], o[0][1]);
  for (let i = 1; i < o.length; i++) {
    const [a, b] = [o[i - 1], o[i]];
    p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
  }
  p.closePath();
  return p;
}

export function InkPad({ strokes, onChange, onStart, color = '#3a2b27', disabled, hint }: {
  strokes: Stroke[];
  onChange: (s: Stroke[]) => void;
  onStart?: () => void;
  color?: string;
  disabled?: boolean;
  hint?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const live = useRef<Stroke | null>(null);
  const pointer = useRef<number | null>(null);
  const raf = useRef(0);
  const latest = useRef(strokes);
  latest.current = strokes;
  /**
   * Biten çizgilerin yolu bir daha değişmez; her karede yeniden hesaplamak yerine saklanır.
   * Yoksa her karede bütün noktalar yeniden işlenir ve yazdıkça ekran takılır.
   */
  const paths = useRef(new WeakMap<Stroke, Path2D>());
  const pathOf = (s: Stroke) => {
    let p = paths.current.get(s);
    if (!p) {
      p = outline(s, true);
      paths.current.set(s, p);
    }
    return p;
  };

  const draw = () => {
    const c = cv.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    const dpr = c.width / (c.clientWidth || 1);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = color;
    for (const s of latest.current) g.fill(pathOf(s));
    if (live.current) g.fill(outline(live.current, false));
  };

  // Boyut: cihaz piksel oranına göre keskin
  useLayoutEffect(() => {
    const el = wrap.current, c = cv.current;
    if (!el || !c) return;
    const ro = new ResizeObserver(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      c.width = Math.round(el.clientWidth * dpr);
      c.height = Math.round(el.clientHeight * dpr);
      draw();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(draw, [strokes, color]);

  const pos = (e: { clientX: number; clientY: number }) => {
    const r = cv.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  const add = (e: { clientX: number; clientY: number; timeStamp: number }) => {
    const s = live.current;
    if (!s) return;
    const [x, y] = pos(e);
    const n = s.x.length;
    if (n && Math.abs(s.x[n - 1] - x) < 0.6 && Math.abs(s.y[n - 1] - y) < 0.6) return;
    s.x.push(x);
    s.y.push(y);
    s.t.push(Math.round(performance.timeOrigin + e.timeStamp));
  };

  const finish = () => {
    sfx.scribble(0);
    const s = live.current;
    live.current = null;
    pointer.current = null;
    if (s && s.x.length) onChange([...latest.current, s]);
    else draw();
  };

  return (
    <div className={`inkpad ${disabled ? 'inkpad--off' : ''}`} ref={wrap}>
      {!strokes.length && hint && <span className="inkpad__hint">{hint}</span>}
      <canvas
        ref={cv}
        className="inkpad__canvas"
        onPointerDown={(e) => {
          if (disabled || pointer.current !== null || e.button > 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          pointer.current = e.pointerId;
          live.current = { x: [], y: [], t: [] };
          add(e.nativeEvent);
          onStart?.();
          draw();
        }}
        onPointerMove={(e) => {
          if (e.pointerId !== pointer.current) return;
          const evs = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
          for (const ev of evs.length ? evs : [e.nativeEvent]) add(ev);
          // Kalem hışırtısı: hızla orantılı
          const s = live.current;
          if (s && s.x.length > 2) {
            const n = s.x.length - 1;
            const dt = Math.max(1, s.t[n] - s.t[n - 2]);
            sfx.scribble(Math.hypot(s.x[n] - s.x[n - 2], s.y[n] - s.y[n - 2]) / dt);
          }
          cancelAnimationFrame(raf.current);
          raf.current = requestAnimationFrame(draw);
        }}
        onPointerUp={(e) => e.pointerId === pointer.current && finish()}
        onPointerCancel={(e) => e.pointerId === pointer.current && finish()}
      />
    </div>
  );
}

/** Herkese gösterilen el yazısı ("genişlik|yol", bkz. inkToPath). */
export function InkView({ ink, height = 34, color = '#3a2b27' }: { ink?: string; height?: number; color?: string }) {
  if (!ink) return null;
  const [w, d] = ink.split('|');
  const width = Math.max(30, Number(w) || 100);
  return (
    <svg className="inkview" viewBox={`0 0 ${width} 100`} style={{ height, width: (height * width) / 100 }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
