
import { NOTE_FREQUENCIES, NOTES } from '../constants';
import { DurationType, SequenceNote } from '../types';

class PianoAudioService {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private noteMap: Record<string, string> = {
    "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
  };

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private mapNoteToFileName(note: string): string {
    const match = note.match(/^([A-G][#]?)(-?\d+)$/);
    if (!match) return note;
    
    let [_, name, octave] = match;
    if (this.noteMap[name]) {
      name = this.noteMap[name];
    }
    return `${name}${octave}`;
  }

  private async fetchSample(noteFile: string): Promise<AudioBuffer> {
    const url = `https://raw.githubusercontent.com/fuhton/piano-mp3/master/piano-mp3/${noteFile}.mp3`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    if (this.ctx) {
      return await this.ctx.decodeAudioData(arrayBuffer);
    }
    throw new Error("AudioContext not initialized");
  }

  // Carga previa de todos los sonidos necesarios para evitar pausas durante la reproducción
  private async preloadNotes(notes: string[]) {
    const uniqueNotes = [...new Set(notes)];
    const promises = uniqueNotes.map(async (note) => {
      const fileName = this.mapNoteToFileName(note);
      if (!this.buffers[fileName]) {
        try {
          const buffer = await this.fetchSample(fileName);
          this.buffers[fileName] = buffer;
        } catch (e) {
          console.warn(`Could not load sample for ${note}:`, e);
        }
      }
    });
    await Promise.all(promises);
  }

  private playBufferAt(buffer: AudioBuffer, startTime: number, duration: number) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    
    // Aumentamos el volumen base a 2.5 (250%) para compensar el bajo volumen de los samples
    const VOLUME = 2.5;

    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(VOLUME, startTime + 0.02);
    // Mantener volumen hasta el release
    gain.gain.setValueAtTime(VOLUME, startTime + duration - 0.05); 
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration + 0.5);

    source.start(startTime);
    source.stop(startTime + duration + 0.6);
  }

  private playSynthToneAt(freq: number, startTime: number, duration: number) {
     if (!this.ctx) return;
     const osc = this.ctx.createOscillator();
     const gain = this.ctx.createGain();
     
     // Volumen del sinte también aumentado ligeramente
     const SYNTH_VOLUME = 0.8;

     const real = new Float32Array([0, 1, 0.4, 0.2, 0.1]); 
     const imag = new Float32Array(real.length).fill(0);
     const wave = this.ctx.createPeriodicWave(real, imag);
     osc.setPeriodicWave(wave);
     
     osc.frequency.setValueAtTime(freq, startTime);
     
     gain.gain.setValueAtTime(0, startTime);
     gain.gain.linearRampToValueAtTime(SYNTH_VOLUME, startTime + 0.02);
     gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
     
     osc.connect(gain);
     gain.connect(this.ctx.destination);
     osc.start(startTime);
     osc.stop(startTime + duration + 0.1);
  }

  public async playNote(note: string | number, duration: number = 0.5) {
    this.initContext();
    if (!this.ctx) return;

    if (typeof note === 'number') {
      this.playSynthToneAt(note, this.ctx.currentTime, duration);
      return;
    }

    const noteName = note;
    const fileName = this.mapNoteToFileName(noteName);

    // Intentar reproducir inmediatamente si está en caché
    if (this.buffers[fileName]) {
      this.playBufferAt(this.buffers[fileName], this.ctx.currentTime, duration);
    } else {
      try {
        const buffer = await this.fetchSample(fileName);
        this.buffers[fileName] = buffer;
        this.playBufferAt(buffer, this.ctx.currentTime, duration);
      } catch (e) {
        const freq = this.getNoteFrequencyFromFullString(noteName);
        this.playSynthToneAt(freq, this.ctx.currentTime, duration);
      }
    }
  }

  public getNoteFrequency(noteName: string, octave: string): number {
    const fullNote = noteName.includes('C') && noteName.length > 2 ? noteName : `${noteName}${octave.replace('C','')}`;
    return NOTE_FREQUENCIES[fullNote] || 440;
  }

  private getNoteFrequencyFromFullString(fullNote: string): number {
    return NOTE_FREQUENCIES[fullNote] || 440;
  }

  public async playSequence(sequence: SequenceNote[], onStep?: (index: number) => void) {
    this.initContext();
    if (!this.ctx) return;

    // 1. Precargar
    const noteNames = sequence.map(s => s.note);
    await this.preloadNotes(noteNames);

    // 2. Programar Audio
    const durMap: Record<DurationType, number> = { 'whole': 1.6, 'half': 0.8, 'quarter': 0.4, 'eighth': 0.2 };
    const startTime = this.ctx.currentTime + 0.1; // Pequeño delay inicial para asegurar sincronía
    let elapsedTime = 0;

    sequence.forEach((item, index) => {
      const duration = durMap[item.duration];
      const fileName = this.mapNoteToFileName(item.note);
      const buffer = this.buffers[fileName];

      if (buffer) {
        this.playBufferAt(buffer, startTime + elapsedTime, duration);
      } else {
        const freq = this.getNoteFrequencyFromFullString(item.note);
        this.playSynthToneAt(freq, startTime + elapsedTime, duration);
      }

      // Sincronizar UI (no crítico para el audio)
      if (onStep) {
        setTimeout(() => onStep(index), elapsedTime * 1000);
      }
      
      elapsedTime += duration;
    });

    // 3. Retornar promesa para el estado "isPlaying"
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), elapsedTime * 1000 + 200);
    });
  }

  public async playScale(rootNote: string, octave: string, intervals: number[], bpm: number = 100, onStep?: (index: number, total: number) => void) {
    this.initContext();
    if (!this.ctx) return;

    const noteDuration = 60 / bpm;
    const rootIndex = NOTES.indexOf(rootNote);
    const rootOctave = parseInt(octave.replace('C', ''));

    // Generar la secuencia completa de nombres de notas
    const ascendingNotes = intervals.map(interval => {
      let currentIdx = rootIndex + interval;
      let currentOctave = rootOctave + Math.floor(currentIdx / 12);
      let noteName = NOTES[currentIdx % 12];
      return `${noteName}${currentOctave}`;
    });
    const fullSequence = [...ascendingNotes, ...ascendingNotes.slice(0, -1).reverse()];

    // 1. Precargar
    await this.preloadNotes(fullSequence);

    // 2. Programar Audio
    const startTime = this.ctx.currentTime + 0.1;
    let elapsedTime = 0;

    fullSequence.forEach((noteName, index) => {
      const duration = noteDuration * 1.5; // Legato
      const stepDuration = noteDuration;   // Tiempo hasta la siguiente nota
      const fileName = this.mapNoteToFileName(noteName);
      const buffer = this.buffers[fileName];

      if (buffer) {
        this.playBufferAt(buffer, startTime + elapsedTime, duration);
      } else {
        const freq = this.getNoteFrequencyFromFullString(noteName);
        this.playSynthToneAt(freq, startTime + elapsedTime, duration);
      }

      if (onStep) {
        setTimeout(() => onStep(index, fullSequence.length), elapsedTime * 1000);
      }

      elapsedTime += stepDuration;
    });

    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), elapsedTime * 1000 + 500);
    });
  }
}

export const audioService = new PianoAudioService();
