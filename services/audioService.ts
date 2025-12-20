
import { NOTE_FREQUENCIES, NOTES } from '../constants';
import { DurationType, SequenceNote } from '../types';

class PianoAudioService {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playNote(freq: number, duration: number = 0.5) {
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public getNoteFrequency(noteName: string, octave: string): number {
    const fullNote = noteName.includes('C') && noteName.length > 2 ? noteName : `${noteName}${octave.replace('C','')}`;
    return NOTE_FREQUENCIES[fullNote] || 440;
  }

  public async playSequence(sequence: SequenceNote[], onStep?: (index: number) => void) {
    this.initContext();
    const durMap: Record<DurationType, number> = { 'whole': 1.6, 'half': 0.8, 'quarter': 0.4, 'eighth': 0.2 };
    
    for (let i = 0; i < sequence.length; i++) {
      const item = sequence[i];
      const freq = NOTE_FREQUENCIES[item.note];
      if (freq) {
        const duration = durMap[item.duration];
        this.playNote(freq, duration);
        if (onStep) onStep(i);
        await new Promise(r => setTimeout(r, duration * 1000 + 50));
      }
    }
  }

  public async playScale(rootNote: string, octave: string, intervals: number[], bpm: number = 100, onStep?: (index: number, total: number) => void) {
    this.initContext();
    const noteDuration = 60 / bpm;
    const rootIndex = NOTES.indexOf(rootNote);
    const rootOctave = parseInt(octave.replace('C', ''));

    const ascendingNotes = intervals.map(interval => {
      let currentIdx = rootIndex + interval;
      let currentOctave = rootOctave + Math.floor(currentIdx / 12);
      let noteName = NOTES[currentIdx % 12];
      return `${noteName}${currentOctave}`;
    });

    const fullSequence = [...ascendingNotes, ...ascendingNotes.slice(0, -1).reverse()];
    
    for (let i = 0; i < fullSequence.length; i++) {
      const note = fullSequence[i];
      const freq = NOTE_FREQUENCIES[note];
      if (freq) {
        this.playNote(freq, noteDuration * 0.9);
        if (onStep) onStep(i, fullSequence.length);
      }
      await new Promise(r => setTimeout(r, noteDuration * 1000));
    }
  }
}

export const audioService = new PianoAudioService();
