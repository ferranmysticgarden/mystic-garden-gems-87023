export type ProceduralMusicPreset = 'harp_bells' | 'flute_pads' | 'enchanted_bells';

type StopFn = () => void;

export interface ProceduralMusicPlayer {
  play: (preset: ProceduralMusicPreset, opts?: { volume?: number }) => void;
  stop: () => void;
  setVolume: (volume: number) => void;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const nowPlus = (ctx: AudioContext, seconds: number) => ctx.currentTime + seconds;

const createBell = (ctx: AudioContext, dest: AudioNode, freq: number, t: number, amp: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, amp), t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(t);
  osc.stop(t + 0.85);

  // disconnect later to keep graph clean
  osc.onended = () => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // ignore
    }
  };
};

const startPad = (
  ctx: AudioContext,
  dest: AudioNode,
  chord: number[],
  opts: { amp: number; filterHz: number }
): StopFn => {
  const out = ctx.createGain();
  out.gain.value = opts.amp;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = opts.filterHz;
  filter.Q.value = 0.7;

  out.connect(filter);
  filter.connect(dest);

  // Slow tremolo
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.06; // very slow
  lfoGain.gain.value = 0.25; // depth
  lfo.connect(lfoGain);
  lfoGain.connect(out.gain);

  const oscs = chord.map((f) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    osc.detune.value = (Math.random() - 0.5) * 8; // gentle chorus
    osc.connect(out);
    osc.start();
    return osc;
  });

  lfo.start();

  return () => {
    const t = nowPlus(ctx, 0);
    try {
      out.gain.cancelScheduledValues(t);
      out.gain.setValueAtTime(out.gain.value, t);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    } catch {
      // ignore
    }

    oscs.forEach((o) => {
      try {
        o.stop(t + 0.2);
      } catch {
        // ignore
      }
    });
    try {
      lfo.stop(t + 0.2);
    } catch {
      // ignore
    }

    // Disconnect a bit later
    window.setTimeout(() => {
      try {
        oscs.forEach((o) => o.disconnect());
        lfo.disconnect();
        lfoGain.disconnect();
        out.disconnect();
        filter.disconnect();
      } catch {
        // ignore
      }
    }, 350);
  };
};

export const createProceduralMusicPlayer = (ctx: AudioContext): ProceduralMusicPlayer => {
  // One master node we keep connected
  const master = ctx.createGain();
  master.gain.value = 0.25;
  master.connect(ctx.destination);

  let stopCurrent: StopFn | null = null;
  let intervalIds: number[] = [];

  const clearIntervals = () => {
    intervalIds.forEach((id) => window.clearInterval(id));
    intervalIds = [];
  };

  const stop = () => {
    clearIntervals();
    if (stopCurrent) {
      stopCurrent();
      stopCurrent = null;
    }
  };

  const setVolume = (volume: number) => {
    master.gain.value = clamp01(volume);
  };

  const play = (preset: ProceduralMusicPreset, opts?: { volume?: number }) => {
    if (ctx.state === 'suspended') {
      // best-effort; caller should also resume on user gesture
      ctx.resume().catch(() => undefined);
    }

    if (typeof opts?.volume === 'number') setVolume(opts.volume);

    stop();

    // Background pad per preset
    const chordByPreset: Record<ProceduralMusicPreset, number[]> = {
      harp_bells: [523.25, 659.25, 783.99], // C5 E5 G5
      flute_pads: [587.33, 698.46, 880], // D5 F5 A5 (soft)
      enchanted_bells: [493.88, 659.25, 783.99], // B4 E5 G5
    };

    const padStop = startPad(ctx, master, chordByPreset[preset], {
      amp: 0.18,
      filterHz: preset === 'enchanted_bells' ? 2200 : 1800,
    });

    // Gentle bell pulses
    const bpm = preset === 'flute_pads' ? 82 : 74;
    const beatMs = (60 / bpm) * 1000;
    const bellScale =
      preset === 'flute_pads'
        ? [659.25, 783.99, 880, 1046.5] // E G A C
        : [523.25, 587.33, 659.25, 783.99, 880]; // C D E G A

    let bellStep = 0;
    intervalIds.push(
      window.setInterval(() => {
        const t = nowPlus(ctx, 0.02);
        const f = bellScale[bellStep % bellScale.length] * (preset === 'enchanted_bells' ? 1.5 : 1);
        const amp = preset === 'enchanted_bells' ? 0.06 : 0.04;
        createBell(ctx, master, f, t, amp);
        bellStep++;
      }, beatMs * (preset === 'enchanted_bells' ? 1 : 2))
    );

    // Flute-ish simple melody (only for flute_pads)
    if (preset === 'flute_pads') {
      const melody = [880, 783.99, 698.46, 659.25];
      let m = 0;
      intervalIds.push(
        window.setInterval(() => {
          const t = nowPlus(ctx, 0.02);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(melody[m % melody.length], t);
          osc.frequency.linearRampToValueAtTime(melody[m % melody.length] * 1.02, t + 0.2);
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

          filter.type = 'lowpass';
          filter.frequency.value = 2400;
          filter.Q.value = 0.5;

          osc.connect(gain);
          gain.connect(filter);
          filter.connect(master);

          osc.start(t);
          osc.stop(t + 0.6);
          osc.onended = () => {
            try {
              osc.disconnect();
              gain.disconnect();
              filter.disconnect();
            } catch {
              // ignore
            }
          };

          m++;
        }, beatMs * 2)
      );
    }

    stopCurrent = () => {
      padStop();
    };
  };

  return { play, stop, setVolume };
};
