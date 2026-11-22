class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainLevel = 0.14,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainLevel, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump() {
    this.playTone(260, 440, 0.13, 'triangle', 0.12);
  }

  public playDoubleJump() {
    this.playTone(392, 659, 0.14, 'sine', 0.11);
    this.playTone(587, 784, 0.12, 'triangle', 0.06, 0.03);
  }

  public playBounceDrum() {
    this.playTone(130, 320, 0.2, 'sine', 0.2);
    this.playTone(260, 520, 0.14, 'triangle', 0.09, 0.02);
  }

  public playSilkShoot() {
    this.playTone(620, 940, 0.11, 'sine', 0.09);
    this.playTone(930, 1240, 0.09, 'triangle', 0.05, 0.02);
  }

  public playGrappleLatch() {
    this.playTone(523.25, 783.99, 0.12, 'triangle', 0.12);
    this.playTone(1046.5, 1046.5, 0.16, 'sine', 0.08, 0.03);
  }

  public playDash() {
    this.playTone(320, 160, 0.13, 'sawtooth', 0.05);
    this.playTone(480, 220, 0.11, 'sine', 0.07);
  }

  public playCollectBead(combo: number) {
    // Caribbean pentatonic marimba scale: C5, D5, E5, G5, A5, C6
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const note = scale[Math.min(scale.length - 1, Math.max(0, combo % scale.length))];
    this.playTone(note, note * 1.02, 0.14, 'sine', 0.12);
    this.playTone(note * 2, note * 2, 0.08, 'triangle', 0.04, 0.01);
  }

  public playCollectShard() {
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
    notes.forEach((n, idx) => {
      this.playTone(n, n, 0.26, 'sine', 0.11, idx * 0.055);
      this.playTone(n * 1.5, n * 1.5, 0.15, 'triangle', 0.035, idx * 0.055);
    });
  }

  public playHeal() {
    this.playTone(440, 554.37, 0.14, 'sine', 0.11);
    this.playTone(659.25, 880, 0.2, 'sine', 0.11, 0.08);
  }

  public playEnemyBind() {
    this.playTone(220, 440, 0.16, 'triangle', 0.13);
    this.playTone(660, 990, 0.18, 'sine', 0.09, 0.03);
  }

  public playTrickVault() {
    this.playTone(180, 90, 0.12, 'triangle', 0.18);
    this.playTone(587.33, 880, 0.16, 'sine', 0.12, 0.02);
  }

  public playBossStagger() {
    this.playTone(150, 72, 0.25, 'sawtooth', 0.12);
    this.playTone(392, 587.33, 0.22, 'triangle', 0.11, 0.04);
  }

  public playHurt() {
    this.playTone(170, 68, 0.22, 'sawtooth', 0.13);
    this.playTone(110, 55, 0.26, 'sine', 0.16);
  }

  public playChapterClear() {
    const chord = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
    chord.forEach((freq, i) => {
      this.playTone(freq, freq, 0.34, 'sine', 0.12, i * 0.07);
    });
  }
}

export const soundEngine = new SoundEngine();
