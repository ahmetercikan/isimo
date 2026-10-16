/** Tur sonu: puan tablosu (bu turun puanı + toplam), turun öne çıkanları ve sonraki tur. */
import { ChevronRight, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { CatIcon, Icon } from '../../components/Icon';
import { Avatar, Modal, useNow } from '../../components/ui';
import { judgeRound, ranking, scoreRound } from '../../engine/scoring';
import { capitalize } from '../../engine/tr';
import { rKey, type RoomState } from '../../engine/types';
import { sfx } from '../../lib/sfx';
import type { Transport } from '../../online/transport';
import { actingHost, nextRound } from '../director';
import { Reactions } from './Reactions';
import { say } from '../../lib/voice';
import { VOICE } from '../../voice/lines';

export function Scores({ t, s }: { t: Transport; s: RoomState }) {
  const now = useNow(() => t.now(), 500);
  const c = s.ctl;
  const k = rKey(c.round);
  // Sonuç henüz yazılmadıysa aynı hesap burada yapılır (herkes aynı sonucu bulur).
  const result = s.results?.[k] ?? scoreRound(s, c.round);
  const withThis = useMemo(() => (s.results?.[k] ? s : { ...s, results: { ...s.results, [k]: result } }), [s, k, result]);
  const rank = ranking(withThis);
  const max = Math.max(1, ...rank.map((r) => r.total));
  const isHost = actingHost(s) === t.me;
  const last = c.round >= s.settings.rounds;
  const [open, setOpen] = useState<string | null>(null);
  const auto = Math.max(0, Math.ceil((c.nextAt - now) / 1000));

  useEffect(() => {
    rank.forEach((_, i) => setTimeout(() => sfx.coin(i), 300 + i * 110));
    void say(VOICE.scores, 200);
  }, []);

  // Turun yıldızı: 20 puanlık (tek kalan) cevaplar
  const judged = useMemo(() => judgeRound(withThis, c.round, result.letter), [withThis, c.round, result.letter]);
  const stars: { pid: string; text: string; cat: string; catId: string }[] = [];
  for (const cat of s.settings.cats)
    for (const [pid, v] of Object.entries(judged[cat.id] ?? {})) if (v.pts === 20) stars.push({ pid, text: v.text, cat: cat.label, catId: cat.id });

  return (
    <div className="scores">
      <header className="scores__head pop-in">
        <div className="letter-badge letter-badge--sm">{result.letter}</div>
        <div>
          <h2 className="title-lg">{last ? 'Son tur bitti!' : `${c.round}. tur bitti`}</h2>
          <p className="muted">{s.settings.rounds - c.round > 0 ? `${s.settings.rounds - c.round} tur kaldı` : 'Kazanan belli oluyor…'}</p>
        </div>
      </header>

      {(result.stopBy || stars.length > 0) && (
        <div className="highlights rise">
          {result.stopBy && s.players[result.stopBy] && (
            <span className="hl-chip"><span className="stop-mini">STOP</span> {s.players[result.stopBy].name}</span>
          )}
          {stars.slice(0, 3).map((x) => (
            <span key={x.pid + x.cat} className="hl-chip"><Icon name="yildiz" size={20} /> {s.players[x.pid]?.name}: <b>{capitalize(x.text)}</b> <CatIcon cat={{ id: x.catId }} size={18} /><small>{x.cat}</small></span>
          ))}
        </div>
      )}

      <ol className="board">
        {rank.map((r, i) => {
          const p = s.players[r.pid];
          if (!p) return null;
          const gain = result.sum?.[r.pid] ?? 0;
          return (
            <li key={r.pid} className={`board-row ${r.pid === t.me ? 'is-me' : ''}`} style={{ animationDelay: `${0.1 + i * 0.08}s` } as CSSProperties}>
              <button className="board-row__btn" onClick={() => (sfx.tap(), setOpen(r.pid))}>
                <span className={`rank rank--${r.rank}`}>{r.rank <= 3 ? <Icon name={`m${r.rank}`} size={30} /> : r.rank}</span>
                <Avatar emoji={p.avatar} color={p.color} size={40} off={!p.on && !p.bot} />
                <span className="board-row__main">
                  <span className="board-row__name">{r.pid === t.me ? `${p.name} (sen)` : p.name}</span>
                  <span className="board-row__bar"><span style={{ width: `${(r.total / max) * 100}%`, background: p.color }} /></span>
                </span>
                <span className="gain">+{gain}</span>
                <span className="board-row__total">{r.total}</span>
                <ChevronRight size={18} className="muted" />
              </button>
            </li>
          );
        })}
      </ol>

      <footer className="scores__foot">
        <Reactions t={t} s={s} />
        {isHost ? (
          <button className="pill pill--big" onClick={() => (sfx.pop(), void nextRound(t, s))}>
            {last ? (<><Trophy size={24} /> Sonuçlar</>) : 'Sonraki Tur'}
            {auto > 0 && <small className="pill__auto">{auto}</small>}
          </button>
        ) : (
          <p className="waiting">
            <span className="dots"><i /><i /><i /></span> {last ? 'Sonuçlar' : 'Sonraki tur'} {auto} sn içinde
          </p>
        )}
      </footer>

      {open && s.players[open] && (
        <Modal onClose={() => setOpen(null)}>
          <div className="detail__head">
            <Avatar emoji={s.players[open].avatar} color={s.players[open].color} size={52} />
            <h2 className="title-lg">{s.players[open].name}</h2>
            <span className="gain gain--lg">+{result.sum?.[open] ?? 0}</span>
          </div>
          <ul className="detail">
            {s.settings.cats.map((cat) => {
              const v = judged[cat.id]?.[open];
              return (
                <li key={cat.id}>
                  <span className="detail__cat"><CatIcon cat={cat} size={20} /> {cat.label}</span>
                  <span className={`detail__ans ${v?.valid ? '' : 'is-bad'}`}>{v?.text ? capitalize(v.text) : '—'}</span>
                  <span className={`pts pts--${v?.pts ?? 0}`}>{v?.pts ? `+${v.pts}` : '0'}</span>
                </li>
              );
            })}
          </ul>
        </Modal>
      )}
    </div>
  );
}
