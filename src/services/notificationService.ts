// Web Notification & Audio Alert Service

class NotificationService {
  private audioCtx: AudioContext | null = null;

  private initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  public playChime() {
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Primary oscillator - High bell chime (E5 -> B5 harmonic)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.12); // B5

      gain1.gain.setValueAtTime(0.35, now); // Boosted volume
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.8);

      // Secondary oscillator - Warm resonance (E4 harmonic)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(329.63, now + 0.05); // E4
      gain2.gain.setValueAtTime(0.2, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc2.start(now + 0.05);
      osc2.stop(now + 0.9);
    } catch {
      // Audio playback fallback ignored
    }
  }

  public requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return Promise.resolve(false);
    if (Notification.permission === 'granted') return Promise.resolve(true);

    return Notification.requestPermission().then((permission) => permission === 'granted');
  }

  public sendNotification(title: string, body: string) {
    this.playChime();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/vite.svg',
      });
    }
  }
}

export const notificationService = new NotificationService();
