
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

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Simular armónicos de piano usando wave shaping o combinando ondas
    // Aquí usamos triangle que es suave pero con armónicos impares, filtrado
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    // Envolvente ADSR para Piano
    // Attack: Muy rápido (golpe del martillo)
    // Decay: Rápido inicial
    // Sustain: Cae lentamente
    // Release: Rápido al soltar (aquí simulado por duración)
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.015); // Ataque un poco más suave para evitar click digital
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.1); // Decay inicial
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration); // Release natural

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(t + duration + 0.1);
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
        // Esperar la duración de la nota
        await new Promise(r => setTimeout(r, duration * 1000));
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
        this.playNote(freq, noteDuration * 1.5); // Notas un poco más largas para legato
        if (onStep) onStep(i, fullSequence.length);
      }
      await new Promise(r => setTimeout(r, noteDuration * 1000));
    }
  }
}

export const audioService = new PianoAudioService();
