/**
 * Botlu oyun: oda bellekte tutulur, internet gerekmez. Botlar src/game/bots.ts'te.
 */
import type { Ctl, RoomState } from '../engine/types';
import { applyPatch, type Transport } from './transport';

export class LocalTransport implements Transport {
  readonly kind = 'local' as const;
  readonly me: string;
  readonly code = 'BOT';
  private state: RoomState;
  private ink: Record<string, Record<string, Record<string, string>>> = {};
  private listeners = new Set<(s: RoomState | null) => void>();
  private queued = false;
  private closed = false;
  onLeave?: () => void;

  constructor(state: RoomState, me: string) {
    this.state = state;
    this.me = me;
  }

  /** Botlar için anlık durum (kopya değil; değiştirmeyin). */
  peek(): RoomState {
    return this.state;
  }

  subscribe(cb: (s: RoomState | null) => void) {
    this.listeners.add(cb);
    cb(structuredClone(this.state));
    return () => void this.listeners.delete(cb);
  }

  private emit() {
    if (this.queued || this.closed) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      const snap = structuredClone(this.state);
      this.listeners.forEach((l) => l(snap));
    });
  }

  now() {
    return Date.now();
  }

  async update(patch: Record<string, unknown>) {
    if (this.closed) return;
    applyPatch(this.state as unknown as Record<string, unknown>, structuredClone(patch));
    this.emit();
  }

  async transactCtl(fn: (ctl: Ctl) => Ctl | undefined) {
    if (this.closed) return false;
    const next = fn(structuredClone(this.state.ctl));
    if (!next) return false;
    this.state.ctl = next;
    this.emit();
    return true;
  }

  async setInk(round: number, catId: string, path: string | null) {
    const r = (this.ink[`r${round}`] ??= {});
    const mine = (r[this.me] ??= {});
    if (path) mine[catId] = path;
    else delete mine[catId];
  }

  async getInk(round: number) {
    return structuredClone(this.ink[`r${round}`] ?? {});
  }

  async clearInk() {
    this.ink = {};
  }

  async leave() {
    this.closed = true;
    this.listeners.clear();
    this.onLeave?.();
  }
}
