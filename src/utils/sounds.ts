export type SoundType = 'correct' | 'incorrect' | 'streak' | 'victory' | 'click';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    // The AudioContext is created lazily on the first play() — browsers block audio
    // contexts created before the user has interacted with the page.
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedMuted = localStorage.getItem('soundMuted');
      const savedVolume = localStorage.getItem('soundVolume');
      
      this.isMuted = savedMuted === 'true';
      this.volume = savedVolume ? parseFloat(savedVolume) : 0.5;
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
  }

  private async ensureAudioContext(): Promise<AudioContext | null> {
    try {
      if (!this.audioContext) {
        const Ctor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.audioContext = new Ctor();
        await this.generateSounds();
      }
      if (this.audioContext.state === 'suspended') await this.audioContext.resume();
      return this.audioContext;
    } catch (error) {
      console.error('Error initializing audio context:', error);
      return null;
    }
  }

  private async generateSounds() {
    if (!this.audioContext) return;

    // Generate correct sound (pleasant chime)
    const correctBuffer = this.generateTone([523.25, 659.25, 783.99], 0.3);
    this.sounds.set('correct', correctBuffer);

    // Generate incorrect sound (low buzz)
    const incorrectBuffer = this.generateTone([200, 150], 0.4);
    this.sounds.set('incorrect', incorrectBuffer);

    // Generate streak sound (fanfare)
    const streakBuffer = this.generateTone([523.25, 659.25, 783.99, 1046.50], 0.6);
    this.sounds.set('streak', streakBuffer);

    // Generate victory sound (triumphant chord)
    const victoryBuffer = this.generateTone([261.63, 329.63, 392.00, 523.25], 1.0);
    this.sounds.set('victory', victoryBuffer);

    // Generate click sound (subtle)
    const clickBuffer = this.generateTone([800], 0.1);
    this.sounds.set('click', clickBuffer);
  }

  /** Sums decaying sine waves at the given frequencies. */
  private generateTone(frequencies: number[], duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate;
      let sample = 0;
      
      frequencies.forEach(freq => {
        const amplitude = 0.3 / frequencies.length;
        const envelope = Math.exp(-time * 3); // Decay envelope
        sample += amplitude * envelope * Math.sin(2 * Math.PI * freq * time);
      });
      
      data[i] = sample;
    }

    return buffer;
  }

  async play(soundType: SoundType) {
    if (this.isMuted) return;
    if (!(await this.ensureAudioContext()) || !this.audioContext) return;

    try {
      const buffer = this.sounds.get(soundType);
      if (!buffer) return;

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('soundMuted', muted.toString());
    } catch (error) {
      console.error('Error saving mute setting:', error);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    try {
      localStorage.setItem('soundVolume', this.volume.toString());
    } catch (error) {
      console.error('Error saving volume setting:', error);
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  getVolume(): number {
    return this.volume;
  }

  async testSound(soundType: SoundType = 'click') {
    await this.play(soundType);
  }
}

export const soundManager = new SoundManager();
