type AudioContextCtor = typeof AudioContext;

function getAudioContext(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

export class Sfx {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private seq = 0;

  unlock(): void {
    const Ctor = getAudioContext();
    if (!Ctor) return;
    if (!this.ctx) {
      this.ctx = new Ctor({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.bus = this.ctx.createGain();
      this.bus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.master.gain.value = this.muted ? 0 : 0.8;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  resume(): void {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  begin(): void {
    this.seq += 1;
    this.tone(440, 0.08, "triangle", 0.1, 0);
    const id = this.seq;
    window.setTimeout(() => {
      if (this.seq === id) this.tone(660, 0.1, "triangle", 0.1, 70);
    }, 90);
  }

  catch(streak: number): void {
    const wobble = 0.94 + Math.random() * 0.12;
    const base = (520 + Math.min(streak, 12) * 28) * wobble;
    this.tone(base, 0.09, "triangle", 0.16, 160);
    this.tone(base * 1.5, 0.06, "sine", 0.05, 0);
  }

  miss(): void {
    this.tone(196, 0.14, "sine", 0.1, -70);
  }

  tick(): void {
    this.tone(880, 0.05, "sine", 0.06, 0);
  }

  end(): void {
    const id = ++this.seq;
    this.tone(523, 0.12, "triangle", 0.1, 0);
    window.setTimeout(() => {
      if (this.seq === id) this.tone(392, 0.14, "triangle", 0.09, 0);
    }, 110);
    window.setTimeout(() => {
      if (this.seq === id) this.tone(262, 0.22, "sine", 0.09, -30);
    }, 240);
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slide: number,
  ): void {
    if (!this.ctx || !this.bus || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(48, freq + slide), t + dur);
    }
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp);
    amp.connect(this.bus);
    osc.start(t);
    osc.stop(t + dur + 0.03);
    osc.onended = () => {
      osc.disconnect();
      amp.disconnect();
    };
  }
}
