// The Velvet Vault — sound, synthesized with WebAudio.
// No audio files ship with the game: every effect is an oscillator shaped
// in code, and the room tone is two detuned sines through a low pass.

export function createSound() {
  let ctx = null;
  let master = null;
  let muted = false;
  let padNodes = null;

  /** Build the context on the first user gesture; silent until then. */
  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return true;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!ctx || muted) return;
    try {
      const t0 = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  }

  /** A quiet two-note room tone that starts once the player moves. */
  function startPad() {
    if (!ctx || muted || padNodes) return;
    try {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const padGain = ctx.createGain();
      padGain.gain.value = 0.05;
      filter.connect(padGain);
      padGain.connect(master);
      const oscA = ctx.createOscillator();
      oscA.type = 'sine';
      oscA.frequency.value = 55;
      const oscB = ctx.createOscillator();
      oscB.type = 'sine';
      oscB.frequency.value = 55 * 1.5;
      oscA.connect(filter);
      oscB.connect(filter);
      oscA.start();
      oscB.start();
      padNodes = { oscA, oscB, padGain };
    } catch {
      // Ignore.
    }
  }

  return {
    ensure,
    startPad,
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    coin() {
      tone(1320, 0.09, 'triangle', 0.22);
      tone(1760, 0.12, 'triangle', 0.18, 0.06);
    },
    grab() {
      tone(660, 0.1, 'triangle', 0.25);
      tone(880, 0.1, 'triangle', 0.25, 0.09);
      tone(1320, 0.22, 'triangle', 0.25, 0.18);
    },
    dash() {
      tone(300, 0.16, 'sine', 0.16, 0, 90);
    },
    spotted() {
      tone(880, 0.08, 'square', 0.08);
      tone(880, 0.08, 'square', 0.08, 0.12);
    },
    caught() {
      tone(220, 0.5, 'sawtooth', 0.22, 0, 55);
      tone(110, 0.7, 'sawtooth', 0.2, 0.1, 40);
    },
    clear() {
      tone(523, 0.12, 'triangle', 0.25);
      tone(659, 0.12, 'triangle', 0.25, 0.11);
      tone(784, 0.3, 'triangle', 0.25, 0.22);
    },
  };
}
