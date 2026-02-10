// Audio Service - Generates ambient audio based on emotion parameters
// Uses Web Audio API for real-time sound synthesis

class AudioService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying = false;
  private currentColor = "#ffffff";

  // Initialize audio context (must be called after user interaction)
  init(): boolean {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0;
      return true;
    } catch (e) {
      console.warn('Web Audio API not supported');
      return false;
    }
  }

  // Convert hex color to frequency range (creative mapping)
  private colorToFrequency(hex: string): number {
    // Extract RGB values
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Map to frequency range (100-800 Hz for pleasant ambient tones)
    const avgColor = (r + g + b) / 3;
    return 100 + (avgColor / 255) * 400;
  }

  // Get emotion characteristics from color
  private getEmotionFromColor(hex: string): { warmth: number; intensity: number } {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Warmth: reds/yellows = warm, blues = cold
    const warmth = (r - b) / 255;
    // Intensity: overall brightness
    const intensity = (r + g + b) / (255 * 3);
    
    return { warmth, intensity };
  }

  // Start ambient sound based on visual params
  start(color: string, speed: number, distort: number): void {
    if (!this.audioContext || !this.masterGain) {
      if (!this.init()) return;
    }

    // Resume context if suspended
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.currentColor = color;
    this.stop(); // Clear existing oscillators

    const baseFreq = this.colorToFrequency(color);
    const { warmth, intensity } = this.getEmotionFromColor(color);

    // Create layered ambient sound
    const frequencies = [
      baseFreq,
      baseFreq * 1.5, // Perfect fifth
      baseFreq * 2,   // Octave
      baseFreq * 0.5, // Sub-bass
    ];

    frequencies.forEach((freq, i) => {
      if (!this.audioContext || !this.masterGain) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Choose waveform based on emotion
      if (warmth > 0.3) {
        osc.type = 'sine'; // Warm, smooth
      } else if (warmth < -0.3) {
        osc.type = 'triangle'; // Cool, ethereal
      } else {
        osc.type = 'sine';
      }

      osc.frequency.value = freq;

      // Add subtle detuning for richness (based on distort)
      osc.detune.value = (Math.random() - 0.5) * distort * 50;

      // Filter settings
      filter.type = 'lowpass';
      filter.frequency.value = 1000 + intensity * 2000;
      filter.Q.value = 1 + distort * 2;

      // Volume based on layer and speed
      const layerVolume = (0.15 / (i + 1)) * (0.5 + speed * 0.5);
      gain.gain.value = layerVolume;

      // Connect nodes
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.oscillators.push(osc);
    });

    // Fade in
    this.masterGain.gain.linearRampToValueAtTime(0.3, this.audioContext!.currentTime + 1);
    this.isPlaying = true;
  }

  // Update sound parameters smoothly
  update(color: string, speed: number, distort: number): void {
    if (!this.isPlaying || !this.audioContext || !this.masterGain) return;

    // Only restart if color changed significantly
    if (this.currentColor !== color) {
      this.start(color, speed, distort);
    }
  }

  // Stop all sounds
  stop(): void {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.oscillators = [];
    this.isPlaying = false;
  }

  // Mute/unmute with fade
  setMuted(muted: boolean): void {
    if (!this.masterGain || !this.audioContext) return;
    
    const targetVolume = muted ? 0 : 0.3;
    this.masterGain.gain.linearRampToValueAtTime(
      targetVolume,
      this.audioContext.currentTime + 0.5
    );
  }

  // Check if currently playing
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Cleanup
  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Singleton instance
export const audioService = new AudioService();
