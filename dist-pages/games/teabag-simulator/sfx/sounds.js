// Teabag Simulator — Sound Definitions
// 10 game SFX (combo/chainCombo excluded)
// Used by the inline SFX engine in teabag-simulator.html
/* exported SOUND_DEFS */
const SOUND_DEFS = {
  jump: {
    layers: [
      {
        enabled: true,
        source: { type: 'sine', freqStart: 300, freqEnd: 600, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      }
    ],
    envelope: { attack: 0.005, decay: 0.06, sustain: 0, release: 0.04 },
    delay: { enabled: false, time: 0.15, feedback: 0.3, mix: 0.3 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.1,
    masterVolume: 0.6
  },

  doubleJump: {
    layers: [
      {
        enabled: true,
        source: { type: 'sine', freqStart: 400, freqEnd: 900, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      },
      {
        enabled: true,
        source: { type: 'triangle', freqStart: 800, freqEnd: 1400, detune: 5 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.3
      }
    ],
    envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.04 },
    delay: { enabled: false, time: 0.15, feedback: 0.3, mix: 0.3 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.12,
    masterVolume: 0.6
  },

  land: {
    "layers": [
      {
        "enabled": true,
        "source": { "type": "brown", "freqStart": 1927, "freqEnd": 600, "detune": -109 },
        "fm": { "enabled": false, "ratio": 2, "depth": 100 },
        "waveshaper": { "enabled": false, "curve": "bitcrush", "drive": 4.9 },
        "filter": { "enabled": true, "type": "lowpass", "freq": 2000, "Q": 1, "envAmount": 0 },
        "lfo": { "enabled": false, "rate": 14, "depth": 0.18, "dest": "gain", "wave": "triangle" },
        "gain": 0.164
      },
      {
        "enabled": true,
        "source": { "type": "sine", "freqStart": 112.46826503806983, "freqEnd": 56.367658625289074, "detune": 0 },
        "fm": { "enabled": false, "ratio": 2, "depth": 100 },
        "waveshaper": { "enabled": false, "curve": "softclip", "drive": 2 },
        "filter": { "enabled": true, "type": "highpass", "freq": 731.1895832262499, "Q": 1, "envAmount": 0 },
        "lfo": { "enabled": false, "rate": 5, "depth": 0.3, "dest": "gain", "wave": "sine" },
        "gain": 0.179
      },
      {
        "enabled": false,
        "source": { "type": "sine", "freqStart": 440, "freqEnd": 440, "detune": 0 },
        "fm": { "enabled": false, "ratio": 2, "depth": 100 },
        "waveshaper": { "enabled": false, "curve": "softclip", "drive": 2 },
        "filter": { "enabled": false, "type": "lowpass", "freq": 2000, "Q": 1, "envAmount": 0 },
        "lfo": { "enabled": false, "rate": 5, "depth": 0.3, "dest": "gain", "wave": "sine" },
        "gain": 0.5
      },
      {
        "enabled": false,
        "source": { "type": "sine", "freqStart": 440, "freqEnd": 440, "detune": 0 },
        "fm": { "enabled": false, "ratio": 2, "depth": 100 },
        "waveshaper": { "enabled": false, "curve": "softclip", "drive": 2 },
        "filter": { "enabled": false, "type": "lowpass", "freq": 2000, "Q": 1, "envAmount": 0 },
        "lfo": { "enabled": false, "rate": 5, "depth": 0.3, "dest": "gain", "wave": "sine" },
        "gain": 0.5
      }
    ],
    "envelope": { "attack": 0.0039810717055349725, "decay": 0.014387985782558456, "sustain": 0.143, "release": 0.001386577950786654 },
    "delay": { "enabled": false, "time": 0.275, "feedback": 0.22, "mix": 0.47 },
    "duration": 0.10642000000000001,
    "masterVolume": 0.3,
    "reverb": { "enabled": false, "decay": 1.5, "mix": 0.3 },
    "chorus": { "enabled": false, "rate": 1.5, "depth": 0.005, "mix": 0.5 },
    "phaser": { "enabled": false, "rate": 0.5, "depth": 2000, "stages": 4, "feedback": 0.5 },
    "compressor": { "enabled": false, "threshold": -24, "knee": 12, "ratio": 4, "attack": 0.003, "release": 0.25 },
    "distortion": { "enabled": false, "curve": "softclip", "drive": 4, "mix": 0.5 },
    "eq": { "enabled": false, "lowFreq": 200, "lowGain": 0, "midFreq": 1000, "midGain": 0, "midQ": 1, "highFreq": 5000, "highGain": 0 },
    "bitcrusher": { "enabled": false, "bits": 8, "sampleRate": 0.5 },
    "tremolo": { "enabled": false, "rate": 5, "depth": 0.5, "wave": "sine" }
  },

  mount: {
    layers: [
      {
        enabled: true,
        source: { type: 'square', freqStart: 200, freqEnd: 350, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: true, curve: 'softclip', drive: 2 },
        filter: { enabled: true, type: 'lowpass', freq: 3000, Q: 2, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      },
      {
        enabled: true,
        source: { type: 'white', freqStart: 440, freqEnd: 440, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: true, type: 'lowpass', freq: 2000, Q: 1, envAmount: -1500 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.25
      }
    ],
    envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.05 },
    delay: { enabled: false, time: 0.15, feedback: 0.3, mix: 0.3 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.12,
    masterVolume: 0.6
  },

  teabagHit: {
    layers: [
      {
        enabled: true,
        source: { type: 'sawtooth', freqStart: 150, freqEnd: 80, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: true, curve: 'softclip', drive: 3 },
        filter: { enabled: true, type: 'lowpass', freq: 2500, Q: 3, envAmount: 2000 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      },
      {
        enabled: true,
        source: { type: 'white', freqStart: 440, freqEnd: 440, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: true, type: 'highpass', freq: 1500, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.3
      }
    ],
    envelope: { attack: 0.003, decay: 0.06, sustain: 0, release: 0.03 },
    delay: { enabled: false, time: 0.15, feedback: 0.3, mix: 0.3 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.07,
    masterVolume: 0.6
  },

  ko: {
    layers: [
      {
        enabled: true,
        source: { type: 'sawtooth', freqStart: 300, freqEnd: 100, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: true, curve: 'softclip', drive: 3 },
        filter: { enabled: true, type: 'lowpass', freq: 4000, Q: 2, envAmount: 3000 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      },
      {
        enabled: true,
        source: { type: 'white', freqStart: 440, freqEnd: 440, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: true, type: 'bandpass', freq: 3000, Q: 2, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.35
      },
      {
        enabled: true,
        source: { type: 'sine', freqStart: 500, freqEnd: 200, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.3
      }
    ],
    envelope: { attack: 0.005, decay: 0.15, sustain: 0.1, release: 0.1 },
    delay: { enabled: false, time: 0.15, feedback: 0.3, mix: 0.3 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.25,
    masterVolume: 0.6
  },

  menuSelect: {
    layers: [
      {
        enabled: true,
        source: { type: 'sine', freqStart: 600, freqEnd: 800, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      },
      {
        enabled: true,
        source: { type: 'triangle', freqStart: 1200, freqEnd: 1600, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.25
      }
    ],
    envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.04 },
    delay: { enabled: false, time: 0.15, feedback: 0.3, mix: 0.3 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.1,
    masterVolume: 0.6
  },

  menuNav: {
    layers: [
      {
        enabled: true,
        source: { type: 'sine', freqStart: 500, freqEnd: 520, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      }
    ],
    envelope: { attack: 0.005, decay: 0.04, sustain: 0, release: 0.03 },
    delay: { enabled: false, time: 0.15, feedback: 0.3, mix: 0.3 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.06,
    masterVolume: 0.6
  },

  zoneTransition: {
    layers: [
      {
        enabled: true,
        source: { type: 'sine', freqStart: 400, freqEnd: 800, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.5
      },
      {
        enabled: true,
        source: { type: 'triangle', freqStart: 600, freqEnd: 1200, detune: 7 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.3
      }
    ],
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.15 },
    delay: { enabled: true, time: 0.12, feedback: 0.3, mix: 0.25 },
    reverb: { enabled: false, decay: 1.5, mix: 0.3 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.35,
    masterVolume: 0.6
  },

  prestige: {
    layers: [
      {
        enabled: true,
        source: { type: 'sawtooth', freqStart: 300, freqEnd: 600, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: true, curve: 'softclip', drive: 2 },
        filter: { enabled: true, type: 'lowpass', freq: 6000, Q: 2, envAmount: 4000 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.4
      },
      {
        enabled: true,
        source: { type: 'sine', freqStart: 600, freqEnd: 1200, detune: 0 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.35
      },
      {
        enabled: true,
        source: { type: 'triangle', freqStart: 900, freqEnd: 1800, detune: 5 },
        fm: { enabled: false, ratio: 2, depth: 100 },
        waveshaper: { enabled: false, curve: 'softclip', drive: 2 },
        filter: { enabled: false, type: 'lowpass', freq: 2000, Q: 1, envAmount: 0 },
        lfo: { enabled: false, rate: 5, depth: 0.3, dest: 'gain', wave: 'sine' },
        gain: 0.25
      }
    ],
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.15, release: 0.25 },
    delay: { enabled: true, time: 0.15, feedback: 0.4, mix: 0.3 },
    reverb: { enabled: true, decay: 2.0, mix: 0.35 },
    chorus: { enabled: false, rate: 1.5, depth: 0.005, mix: 0.5 },
    phaser: { enabled: false, rate: 0.5, depth: 2000, stages: 4, feedback: 0.5 },
    compressor: { enabled: false, threshold: -24, knee: 12, ratio: 4, attack: 0.003, release: 0.25 },
    distortion: { enabled: false, curve: 'softclip', drive: 4, mix: 0.5 },
    eq: { enabled: false, lowFreq: 200, lowGain: 0, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 5000, highGain: 0 },
    bitcrusher: { enabled: false, bits: 8, sampleRate: 0.5 },
    tremolo: { enabled: false, rate: 5, depth: 0.5, wave: 'sine' },
    duration: 0.5,
    masterVolume: 0.6
  }
};
