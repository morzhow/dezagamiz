import type { MelodyNote, MelodySynthPreset, PersonalTrack } from '../types/dezagamiz';

export const PRESET_MELODIES: PersonalTrack[] = [
  {
    id: 'preset-tashkent-night',
    title: 'Ташкент · Нео-соул круиз',
    subtitle: 'Тёплый Rhodes с аккордами Dmaj9/Gm9, басом и мягким эхо',
    kind: 'melody',
    source: 'preset',
    bpm: 96,
    keySignature: 'D minor 9',
    synthPreset: 'rhodes',
    durationSeconds: 10.4,
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: [
      // Bar 1: Dm9 chord warmth + singing top melody
      { freqHz: 146.83, offsetBeats: 0, durationBeats: 3.5, velocity: 0.72 },
      { freqHz: 261.63, offsetBeats: 0, durationBeats: 1.75, velocity: 0.42 },
      { freqHz: 329.63, offsetBeats: 0.12, durationBeats: 1.75, velocity: 0.45 },
      { freqHz: 440.0, offsetBeats: 0.25, durationBeats: 1.25, velocity: 0.76 },
      { freqHz: 523.25, offsetBeats: 1.25, durationBeats: 0.75, velocity: 0.72 },
      { freqHz: 587.33, offsetBeats: 2.0, durationBeats: 1.25, velocity: 0.84 },
      { freqHz: 523.25, offsetBeats: 3.25, durationBeats: 0.75, velocity: 0.68 },
      // Bar 2: Bbmaj7 -> A7sus4
      { freqHz: 116.54, offsetBeats: 4, durationBeats: 3.5, velocity: 0.74 },
      { freqHz: 220.0, offsetBeats: 4, durationBeats: 1.75, velocity: 0.44 },
      { freqHz: 293.66, offsetBeats: 4.1, durationBeats: 1.75, velocity: 0.46 },
      { freqHz: 440.0, offsetBeats: 4.0, durationBeats: 1.5, velocity: 0.78 },
      { freqHz: 392.0, offsetBeats: 5.5, durationBeats: 1.0, velocity: 0.7 },
      { freqHz: 349.23, offsetBeats: 6.5, durationBeats: 1.25, velocity: 0.74 },
      { freqHz: 440.0, offsetBeats: 7.5, durationBeats: 0.5, velocity: 0.62 },
      // Bar 3: Gm9 -> C13 lifting resolution
      { freqHz: 196.0, offsetBeats: 8, durationBeats: 3.5, velocity: 0.7 },
      { freqHz: 293.66, offsetBeats: 8, durationBeats: 1.75, velocity: 0.44 },
      { freqHz: 349.23, offsetBeats: 8.1, durationBeats: 1.75, velocity: 0.45 },
      { freqHz: 587.33, offsetBeats: 8.0, durationBeats: 1.25, velocity: 0.85 },
      { freqHz: 659.25, offsetBeats: 9.25, durationBeats: 0.75, velocity: 0.8 },
      { freqHz: 587.33, offsetBeats: 10.0, durationBeats: 1.0, velocity: 0.74 },
      { freqHz: 523.25, offsetBeats: 11.0, durationBeats: 1.0, velocity: 0.76 },
      // Bar 4: Am7 -> Dm9 turnaround
      { freqHz: 130.81, offsetBeats: 12, durationBeats: 3.5, velocity: 0.72 },
      { freqHz: 220.0, offsetBeats: 12, durationBeats: 1.75, velocity: 0.44 },
      { freqHz: 329.63, offsetBeats: 12.1, durationBeats: 1.75, velocity: 0.44 },
      { freqHz: 440.0, offsetBeats: 12.0, durationBeats: 1.5, velocity: 0.8 },
      { freqHz: 392.0, offsetBeats: 13.5, durationBeats: 0.75, velocity: 0.7 },
      { freqHz: 349.23, offsetBeats: 14.25, durationBeats: 0.75, velocity: 0.68 },
      { freqHz: 329.63, offsetBeats: 15.0, durationBeats: 1.0, velocity: 0.66 },
    ],
  },
  {
    id: 'preset-samarkand-dawn',
    title: 'Самарканд · Утренний ветер',
    subtitle: 'Светлый акустический перебор с гармоникой шёлкового пути',
    kind: 'melody',
    source: 'preset',
    bpm: 108,
    keySignature: 'D major pentatonic',
    synthPreset: 'pluck',
    durationSeconds: 9.2,
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: [
      { freqHz: 146.83, offsetBeats: 0, durationBeats: 2.0, velocity: 0.7 },
      { freqHz: 293.66, offsetBeats: 0, durationBeats: 1.0, velocity: 0.72 },
      { freqHz: 440.0, offsetBeats: 0.5, durationBeats: 0.75, velocity: 0.74 },
      { freqHz: 587.33, offsetBeats: 1.0, durationBeats: 1.0, velocity: 0.82 },
      { freqHz: 659.25, offsetBeats: 2.0, durationBeats: 1.0, velocity: 0.84 },
      { freqHz: 587.33, offsetBeats: 3.0, durationBeats: 1.0, velocity: 0.75 },
      // Second phrase
      { freqHz: 196.0, offsetBeats: 4, durationBeats: 2.0, velocity: 0.7 },
      { freqHz: 493.88, offsetBeats: 4.0, durationBeats: 1.0, velocity: 0.78 },
      { freqHz: 587.33, offsetBeats: 5.0, durationBeats: 0.75, velocity: 0.76 },
      { freqHz: 739.99, offsetBeats: 5.75, durationBeats: 1.25, velocity: 0.86 },
      { freqHz: 659.25, offsetBeats: 7.0, durationBeats: 1.0, velocity: 0.74 },
      // Third phrase
      { freqHz: 220.0, offsetBeats: 8, durationBeats: 2.0, velocity: 0.72 },
      { freqHz: 440.0, offsetBeats: 8.0, durationBeats: 1.0, velocity: 0.74 },
      { freqHz: 587.33, offsetBeats: 9.0, durationBeats: 1.0, velocity: 0.8 },
      { freqHz: 659.25, offsetBeats: 10.0, durationBeats: 0.75, velocity: 0.84 },
      { freqHz: 739.99, offsetBeats: 10.75, durationBeats: 1.25, velocity: 0.88 },
      // Resolution
      { freqHz: 146.83, offsetBeats: 12, durationBeats: 3.5, velocity: 0.74 },
      { freqHz: 587.33, offsetBeats: 12.0, durationBeats: 1.5, velocity: 0.84 },
      { freqHz: 440.0, offsetBeats: 13.5, durationBeats: 1.0, velocity: 0.72 },
      { freqHz: 587.33, offsetBeats: 14.5, durationBeats: 1.5, velocity: 0.78 },
    ],
  },
  {
    id: 'preset-dezagamiz-chime',
    title: 'Сигнал заправки dezagamiz',
    subtitle: 'Фирменный хрустальный перезвон умного салона',
    kind: 'melody',
    source: 'preset',
    bpm: 120,
    keySignature: 'C major 9',
    synthPreset: 'chime',
    durationSeconds: 3.4,
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: [
      { freqHz: 261.63, offsetBeats: 0, durationBeats: 3.0, velocity: 0.52 },
      { freqHz: 523.25, offsetBeats: 0, durationBeats: 0.9, velocity: 0.76 },
      { freqHz: 659.25, offsetBeats: 0.45, durationBeats: 0.9, velocity: 0.8 },
      { freqHz: 783.99, offsetBeats: 0.9, durationBeats: 1.0, velocity: 0.84 },
      { freqHz: 987.77, offsetBeats: 1.45, durationBeats: 1.3, velocity: 0.86 },
      { freqHz: 1174.66, offsetBeats: 2.0, durationBeats: 1.9, velocity: 0.82 },
      { freqHz: 1567.98, offsetBeats: 2.55, durationBeats: 2.2, velocity: 0.64 },
    ],
  },
  {
    id: 'preset-silk-road-drive',
    title: 'Регистан · Драйв на трассе',
    subtitle: 'Бодрый синт-грув с плотным басом и лёгкой мелодией для дороги',
    kind: 'melody',
    source: 'preset',
    bpm: 114,
    keySignature: 'A minor 7',
    synthPreset: 'warm_pad',
    durationSeconds: 8.8,
    createdAt: '2026-01-01T00:00:00.000Z',
    notes: [
      { freqHz: 110.0, offsetBeats: 0, durationBeats: 2.0, velocity: 0.74 },
      { freqHz: 440.0, offsetBeats: 0, durationBeats: 0.75, velocity: 0.78 },
      { freqHz: 523.25, offsetBeats: 0.75, durationBeats: 0.75, velocity: 0.8 },
      { freqHz: 659.25, offsetBeats: 1.5, durationBeats: 1.0, velocity: 0.85 },
      { freqHz: 587.33, offsetBeats: 2.5, durationBeats: 0.75, velocity: 0.76 },
      { freqHz: 523.25, offsetBeats: 3.25, durationBeats: 0.75, velocity: 0.74 },
      { freqHz: 174.61, offsetBeats: 4, durationBeats: 2.0, velocity: 0.72 },
      { freqHz: 440.0, offsetBeats: 4, durationBeats: 1.25, velocity: 0.8 },
      { freqHz: 523.25, offsetBeats: 5.5, durationBeats: 1.0, velocity: 0.78 },
      { freqHz: 659.25, offsetBeats: 6.5, durationBeats: 1.5, velocity: 0.84 },
      { freqHz: 196.0, offsetBeats: 8, durationBeats: 2.0, velocity: 0.74 },
      { freqHz: 783.99, offsetBeats: 8, durationBeats: 1.0, velocity: 0.86 },
      { freqHz: 659.25, offsetBeats: 9.0, durationBeats: 1.0, velocity: 0.8 },
      { freqHz: 587.33, offsetBeats: 10.0, durationBeats: 1.25, velocity: 0.78 },
      { freqHz: 523.25, offsetBeats: 11.25, durationBeats: 0.75, velocity: 0.74 },
      { freqHz: 164.81, offsetBeats: 12, durationBeats: 3.5, velocity: 0.72 },
      { freqHz: 440.0, offsetBeats: 12, durationBeats: 1.75, velocity: 0.82 },
      { freqHz: 523.25, offsetBeats: 13.75, durationBeats: 1.0, velocity: 0.76 },
      { freqHz: 440.0, offsetBeats: 14.75, durationBeats: 1.25, velocity: 0.72 },
    ],
  },
];

export const MELODY_SCALE_NOTES: ReadonlyArray<{ label: string; freqHz: number }> = [
  { label: 'D5', freqHz: 587.33 },
  { label: 'C5', freqHz: 523.25 },
  { label: 'A4', freqHz: 440.0 },
  { label: 'G4', freqHz: 392.0 },
  { label: 'F4', freqHz: 349.23 },
  { label: 'D4', freqHz: 293.66 },
];

export function midiToFreqHz(midi: number): number {
  const clamped = Math.max(24, Math.min(108, midi));
  return Math.round(440 * Math.pow(2, (clamped - 69) / 12) * 100) / 100;
}

export function sanitizeMelodyNotes(raw: unknown): MelodyNote[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: MelodyNote[] = [];
  for (const item of raw.slice(0, 64)) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const freqHz = Number(rec.freqHz);
    const offsetBeats = Number(rec.offsetBeats);
    const durationBeats = Number(rec.durationBeats);
    const velocity =
      rec.velocity !== undefined ? Number(rec.velocity) : 0.75;
    if (
      !Number.isFinite(freqHz) ||
      !Number.isFinite(offsetBeats) ||
      !Number.isFinite(durationBeats)
    ) {
      continue;
    }
    cleaned.push({
      freqHz: Math.max(65, Math.min(2093, Math.round(freqHz * 100) / 100)),
      offsetBeats: Math.max(0, Math.min(32, Math.round(offsetBeats * 1000) / 1000)),
      durationBeats: Math.max(0.125, Math.min(8, Math.round(durationBeats * 1000) / 1000)),
      velocity: Number.isFinite(velocity)
        ? Math.max(0.15, Math.min(1, Math.round(velocity * 100) / 100))
        : 0.75,
    });
  }
  return cleaned.sort((a, b) => a.offsetBeats - b.offsetBeats);
}

export function computeMelodyDurationSeconds(
  notes: MelodyNote[],
  bpm: number,
): number {
  if (!notes.length) return 4;
  const safeBpm = Math.max(50, Math.min(180, bpm || 100));
  const beatSec = 60 / safeBpm;
  const maxBeats = notes.reduce(
    (max, n) => Math.max(max, n.offsetBeats + n.durationBeats),
    0,
  );
  return Math.max(1.5, Math.round((maxBeats * beatSec + 0.35) * 10) / 10);
}

export function formatAudioTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Pure PCM RIFF WAVE (.wav) synthesizer with subtle studio echo & soft saturation
 * for downloading personal AI or custom melodies.
 */
export function exportMelodyWavBytes(track: PersonalTrack): Uint8Array {
  const sampleRate = 22050;
  const bpm = Math.max(50, Math.min(180, track.bpm || 100));
  const beatSec = 60 / bpm;
  const notes = track.notes?.length ? track.notes : PRESET_MELODIES[2].notes || [];
  const totalSec = computeMelodyDurationSeconds(notes, bpm);
  const numSamples = Math.max(sampleRate, Math.floor(totalSec * sampleRate));
  const pcm = new Float32Array(numSamples);

  const preset: MelodySynthPreset = track.synthPreset || 'rhodes';

  for (const note of notes) {
    const startSample = Math.floor(note.offsetBeats * beatSec * sampleRate);
    const durSamples = Math.floor((note.durationBeats * beatSec + 0.28) * sampleRate);
    const endSample = Math.min(numSamples, startSample + durSamples);
    const vel = note.velocity ?? 0.75;
    const attackSamples = Math.max(1, Math.floor((preset === 'warm_pad' ? 0.08 : 0.015) * sampleRate));
    const releaseSamples = Math.max(1, Math.floor(0.24 * sampleRate));

    for (let i = startSample; i < endSample; i++) {
      const local = i - startSample;
      const t = local / sampleRate;
      const attack = local < attackSamples ? local / attackSamples : 1;
      const remaining = endSample - i;
      const release = remaining < releaseSamples ? remaining / releaseSamples : 1;
      const env = attack * release;

      const phase = 2 * Math.PI * note.freqHz * t;
      let sample = 0;
      if (preset === 'chime') {
        sample =
          Math.sin(phase) * 0.62 +
          Math.sin(phase * 2) * 0.24 * Math.exp(-t * 3.8) +
          Math.sin(phase * 3) * 0.14 * Math.exp(-t * 6.5);
      } else if (preset === 'pluck') {
        sample =
          (Math.sin(phase) * 0.58 + Math.sin(phase * 2) * 0.28 + Math.sin(phase * 3) * 0.14) *
          Math.exp(-t * 2.2);
      } else if (preset === 'warm_pad') {
        sample =
          Math.sin(phase) * 0.52 +
          Math.sin(phase * 1.003) * 0.26 +
          Math.sin(phase * 0.5) * 0.22;
      } else if (preset === 'bass_groove') {
        sample =
          Math.sin(phase * 0.5) * 0.68 +
          Math.sin(phase) * 0.26 +
          Math.sin(phase * 1.5) * 0.08;
      } else {
        // Warm Rhodes electric piano timbre with gentle tine bell
        sample =
          Math.sin(phase) * 0.68 +
          Math.sin(phase * 1.002) * 0.16 +
          Math.sin(phase * 2) * 0.18 * Math.exp(-t * 2.6) +
          Math.sin(phase * 4) * 0.07 * Math.exp(-t * 8);
      }

      pcm[i] += sample * env * vel * 0.3;
    }
  }

  // Add subtle musical space echo tap (220ms)
  const delaySamples = Math.floor(0.22 * sampleRate);
  for (let i = delaySamples; i < numSamples; i++) {
    pcm[i] += pcm[i - delaySamples] * 0.22;
  }

  const dataByteLength = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataByteLength, true);

  for (let i = 0; i < numSamples; i++) {
    const warm = Math.tanh(pcm[i] * 1.15);
    view.setInt16(44 + i * 2, Math.round(warm * 32767), true);
  }

  return new Uint8Array(buffer);
}

export class MelodySynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dryBus: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private timers: number[] = [];
  private progressTimer: number | null = null;
  private volume = 0.75;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      // Soft studio limiter so lush chord voicings never clip
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.006;
      compressor.release.value = 0.18;

      this.dryBus = this.ctx.createGain();
      this.dryBus.gain.value = 0.92;

      // Musical warmth echo bus
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.24;
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 1800;
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.24;
      const delayWet = this.ctx.createGain();
      delayWet.gain.value = 0.24;

      this.dryBus.connect(this.masterGain);
      this.dryBus.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(delayFeedback);
      delayFeedback.connect(delay);
      delayFilter.connect(delayWet);
      delayWet.connect(this.masterGain);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    }
  }

  public stop() {
    for (const id of this.timers) {
      window.clearTimeout(id);
    }
    this.timers = [];
    if (this.progressTimer !== null) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped
      }
    }
    this.activeOscillators = [];
  }

  public previewSingleNote(freqHz: number, preset: MelodySynthPreset = 'rhodes') {
    const ctx = this.ensureContext();
    const dest = this.dryBus || this.masterGain;
    if (!ctx || !dest) return;
    this.scheduleNote(
      ctx,
      dest,
      { freqHz, offsetBeats: 0, durationBeats: 0.65, velocity: 0.72 },
      ctx.currentTime + 0.01,
      0.5,
      preset,
    );
  }

  private scheduleNote(
    ctx: AudioContext,
    dest: AudioNode,
    note: MelodyNote,
    startTime: number,
    beatSec: number,
    preset: MelodySynthPreset,
  ) {
    const durationSec = Math.max(0.08, note.durationBeats * beatSec);
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const noteGain = ctx.createGain();

    if (preset === 'chime') {
      osc.type = 'sine';
      osc2.type = 'triangle';
      osc3.type = 'sine';
      osc.frequency.setValueAtTime(note.freqHz, startTime);
      osc2.frequency.setValueAtTime(note.freqHz * 2, startTime);
      osc3.frequency.setValueAtTime(note.freqHz * 3, startTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(5200, startTime);
    } else if (preset === 'pluck') {
      osc.type = 'triangle';
      osc2.type = 'sawtooth';
      osc3.type = 'sine';
      osc.frequency.setValueAtTime(note.freqHz, startTime);
      osc2.frequency.setValueAtTime(note.freqHz * 1.003, startTime);
      osc3.frequency.setValueAtTime(note.freqHz * 0.5, startTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, startTime);
      filter.frequency.exponentialRampToValueAtTime(620, startTime + durationSec);
    } else if (preset === 'warm_pad') {
      osc.type = 'sine';
      osc2.type = 'triangle';
      osc3.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freqHz, startTime);
      osc2.frequency.setValueAtTime(note.freqHz * 1.004, startTime);
      osc3.frequency.setValueAtTime(note.freqHz * 0.996, startTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1650, startTime);
    } else if (preset === 'bass_groove') {
      osc.type = 'triangle';
      osc2.type = 'sine';
      osc3.type = 'sine';
      osc.frequency.setValueAtTime(note.freqHz * 0.5, startTime);
      osc2.frequency.setValueAtTime(note.freqHz, startTime);
      osc3.frequency.setValueAtTime(note.freqHz * 1.5, startTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(980, startTime);
    } else {
      // Studio Rhodes: warm fundamental + slightly detuned chorus shimmer + soft octave tine
      osc.type = 'sine';
      osc2.type = 'triangle';
      osc3.type = 'sine';
      osc.frequency.setValueAtTime(note.freqHz, startTime);
      osc2.frequency.setValueAtTime(note.freqHz * 1.0025, startTime);
      osc3.frequency.setValueAtTime(note.freqHz * 2, startTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, startTime);
      filter.frequency.exponentialRampToValueAtTime(1100, startTime + Math.max(0.25, durationSec));
    }

    const peak = Math.max(0.06, Math.min(0.36, (note.velocity ?? 0.75) * 0.3));
    const attack = preset === 'warm_pad' ? 0.12 : 0.016;
    const release = preset === 'chime' ? 0.38 : 0.24;

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peak, startTime + attack);
    noteGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, peak * 0.56),
      startTime + Math.max(attack + 0.02, durationSec * 0.75),
    );
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec + release);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = preset === 'rhodes' ? 0.26 : preset === 'chime' ? 0.25 : 0.32;
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.value = preset === 'rhodes' ? 0.12 : preset === 'chime' ? 0.1 : 0.16;

    osc.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    osc3.connect(osc3Gain);
    osc3Gain.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(dest);

    osc.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    const stopAt = startTime + durationSec + release + 0.06;
    osc.stop(stopAt);
    osc2.stop(stopAt);
    osc3.stop(stopAt);
    this.activeOscillators.push(osc, osc2, osc3);
  }

  public play(
    track: PersonalTrack,
    options: {
      loop?: boolean;
      onProgress?: (elapsedSec: number, durationSec: number) => void;
      onEnded?: () => void;
    } = {},
  ): boolean {
    this.stop();
    const ctx = this.ensureContext();
    const dest = this.dryBus || this.masterGain;
    if (!ctx || !dest) return false;

    const notes = track.notes?.length ? track.notes : PRESET_MELODIES[2].notes || [];
    const bpm = Math.max(50, Math.min(180, track.bpm || 100));
    const beatSec = 60 / bpm;
    const durationSec = computeMelodyDurationSeconds(notes, bpm);
    const preset: MelodySynthPreset = track.synthPreset || 'rhodes';

    const schedulePass = () => {
      if (!ctx || !dest) return;
      const baseTime = ctx.currentTime + 0.04;
      for (const note of notes) {
        this.scheduleNote(
          ctx,
          dest,
          note,
          baseTime + note.offsetBeats * beatSec,
          beatSec,
          preset,
        );
      }

      const startedMs = Date.now();
      if (this.progressTimer !== null) {
        window.clearInterval(this.progressTimer);
      }
      this.progressTimer = window.setInterval(() => {
        const elapsed = Math.min(durationSec, (Date.now() - startedMs) / 1000);
        options.onProgress?.(elapsed, durationSec);
      }, 150);

      const endTimer = window.setTimeout(() => {
        if (this.progressTimer !== null) {
          window.clearInterval(this.progressTimer);
          this.progressTimer = null;
        }
        this.activeOscillators = [];
        if (options.loop) {
          schedulePass();
        } else {
          options.onProgress?.(durationSec, durationSec);
          options.onEnded?.();
        }
      }, Math.round(durationSec * 1000));
      this.timers.push(endTimer);
    };

    schedulePass();
    return true;
  }
}
