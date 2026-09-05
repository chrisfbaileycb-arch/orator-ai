/**
 * Orator.AI — Web Audio Synthesizer & "Wizard of Oz" Voice Engine
 *
 * All oscillators route THROUGH the AnalyserNode so FFT data
 * drives the orb in real-time during speech and tones.
 * Includes persistent idle ambient drone (30 Hz sub-bass)
 * that keeps the orb subtly alive even without user interaction.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx       = null;
    this.analyser  = null;
    this.freqData  = null;
    this.waveData  = null;
    this.isMuted   = false;
    this.isSpeaking = false;

    // Persistent idle drone node
    this._idleDroneNode  = null;
    this._idleDroneGain  = null;
    this._ambientStarted = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      // DJ Analyser — 128 FFT → 64 bins
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.80;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.waveData = new Uint8Array(this.analyser.frequencyBinCount);

      // Analyser → speakers
      this.analyser.connect(this.ctx.destination);

      // Start persistent idle ambient drone
      this._startIdleAmbientDrone();
    } catch (e) {
      console.warn('[AudioSynth] Web Audio init failed:', e);
    }
  }

  /**
   * Persistent 30 Hz sub-bass drone — keeps orb gently alive even at idle.
   * Very low gain (0.018) — felt, not heard.
   */
  _startIdleAmbientDrone() {
    if (!this.ctx || this._ambientStarted) return;
    try {
      this._idleDroneNode = this.ctx.createOscillator();
      this._idleDroneGain = this.ctx.createGain();
      const filter        = this.ctx.createBiquadFilter();

      this._idleDroneNode.type = 'sine';
      this._idleDroneNode.frequency.setValueAtTime(30, this.ctx.currentTime); // Sub-bass

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(80, this.ctx.currentTime);

      // Very quiet — orb detects it but users won't notice
      this._idleDroneGain.gain.setValueAtTime(this.isMuted ? 0 : 0.018, this.ctx.currentTime);

      this._idleDroneNode.connect(filter);
      filter.connect(this._idleDroneGain);
      this._idleDroneGain.connect(this.analyser);

      this._idleDroneNode.start();
      this._ambientStarted = true;
    } catch (e) {}
  }

  getFrequencyData() {
    if (!this.analyser || !this.freqData) return null;
    this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  getWaveformData() {
    if (!this.analyser || !this.waveData) return null;
    this.analyser.getByteTimeDomainData(this.waveData);
    return this.waveData;
  }

  toggle() {
    this.isMuted = !this.isMuted;
    // Mute/unmute the persistent drone
    if (this._idleDroneGain && this.ctx) {
      this._idleDroneGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 0.018,
        this.ctx.currentTime,
        0.1
      );
    }
    // Mute speech synthesis
    if (this.isMuted) window.speechSynthesis.cancel();
    return !this.isMuted;
  }

  /**
   * "Wizard of Oz" — Deep, resonant, authoritative voice.
   * Routes carrier drone through AnalyserNode for real-time FFT.
   */
  speak(text, mood = 'NORMAL') {
    if (this.isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Wizard of Oz vocal signature
    utterance.pitch  = 0.60;  // Deep, commanding
    utterance.rate   = 0.86;  // Measured, deliberate cadence
    utterance.volume = 1.0;

    // Prefer deep male voices with fallback chain
    const tryGetVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      return voices.find(v => v.name === 'Google US English')
        || voices.find(v => v.name.includes('David'))
        || voices.find(v => v.name.includes('Alex'))
        || voices.find(v => v.name.toLowerCase().includes('male') && v.lang.startsWith('en'))
        || voices.find(v => v.lang === 'en-US')
        || voices.find(v => v.lang.startsWith('en'))
        || null;
    };

    const voice = tryGetVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      this.isSpeaking = true;
      // Carrier drone through AnalyserNode — drives orb FFT during speech
      this._playVoiceCarrierDrone();
    };
    utterance.onend = () => { this.isSpeaking = false; };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Low carrier drone that feeds into the AnalyserNode while speaking.
   * This is what makes the orb dance during voice output.
   */
  _playVoiceCarrierDrone() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc    = this.ctx.createOscillator();
      const gain   = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);

      // Route THROUGH analyser — FFT picks this up
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.analyser);   // ← key: goes through analyser, not direct to destination

      osc.start();
      osc.stop(this.ctx.currentTime + 1.4);
    } catch (e) {}
  }

  /** Short high-pitched UI click — routes through analyser */
  playClick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.10, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.analyser);  // through analyser
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  /** A Major chord chime — scope locked / blueprint confirmed */
  playBlueprintChime() {
    if (!this.ctx || this.isMuted) return;
    try {
      [220, 277.18, 329.63, 440].forEach((freq, idx) => {
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 1.0);
        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start(this.ctx.currentTime + idx * 0.09);
        osc.stop(this.ctx.currentTime + idx * 0.09 + 1.0);
      });
    } catch (e) {}
  }

  /** Ominous descending saw — moat challenge / crimson phase */
  playVelvetAlarm() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(55, this.ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(this.analyser);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {}
  }

  /** Triangle pulse — each manufacturing skill step */
  playManufacturingPulse() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(340, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(170, this.ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.10, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.analyser);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch (e) {}
  }

  /** Ascending fanfare — final ZIP delivery */
  playDeliveryFanfare() {
    if (!this.ctx || this.isMuted) return;
    try {
      [440, 554.37, 659.25, 880, 1046.5].forEach((freq, idx) => {
        const osc  = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.11);
        gain.gain.setValueAtTime(0.16, this.ctx.currentTime + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.11 + 1.2);
        osc.connect(gain);
        gain.connect(this.analyser);
        osc.start(this.ctx.currentTime + idx * 0.11);
        osc.stop(this.ctx.currentTime + idx * 0.11 + 1.2);
      });
    } catch (e) {}
  }

  playNodeLock() { this.playClick(); }
}

window.audioSynth = new AudioSynthesizer();
