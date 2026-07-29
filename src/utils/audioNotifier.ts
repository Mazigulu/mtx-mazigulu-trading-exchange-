export type NotificationSoundType = 'chime' | 'digital_bell' | 'radar_pulse' | 'quantum_ping' | 'subtle_beep' | 'synth_cascade';

export interface NotificationSoundOption {
  id: NotificationSoundType;
  label: string;
  description: string;
}

export const NOTIFICATION_SOUND_OPTIONS: NotificationSoundOption[] = [
  { id: 'chime', label: 'Cosmic Chime', description: 'Bright multi-tone harmonic arpeggio' },
  { id: 'digital_bell', label: 'Digital Bell', description: 'Crisp metallic bell sound with smooth decay' },
  { id: 'radar_pulse', label: 'Radar Pulse', description: 'Dual sine pulse sweep with subtle resonance' },
  { id: 'quantum_ping', label: 'Quantum Ping', description: 'High frequency crystal blip' },
  { id: 'subtle_beep', label: 'Subtle Beep', description: 'Soft warm low-profile studio blip' },
  { id: 'synth_cascade', label: 'Synth Cascade', description: 'Descending synth chord cascade' },
];

export function playNotificationSound(soundType: NotificationSoundType = 'chime', enabled: boolean = true) {
  if (!enabled) return;
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    // Helper to resume audio context if browser suspended it
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    switch (soundType) {
      case 'digital_bell': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(1046.5, now);
        osc2.frequency.setValueAtTime(2093, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);
        break;
      }

      case 'radar_pulse': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'quantum_ping': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.setValueAtTime(2637, now + 0.08);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }

      case 'subtle_beep': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      case 'synth_cascade': {
        const frequencies = [523.25, 659.25, 783.99, 1046.50];
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.06;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.16, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.25);
        });
        break;
      }

      case 'chime':
      default: {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startTime = now + idx * 0.08;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0.18, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + 0.35);
        });
        break;
      }
    }
  } catch (err) {
    console.warn('Audio notification trigger error:', err);
  }
}
