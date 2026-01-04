
import { NOTE_FREQUENCIES, NOTES } from '../constants';
import { DurationType, RelativeNote, SequenceNote } from '../types';

class PianoAudioService {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private activeSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  
  private currentPlaybackId: number = 0; 

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

  public stop() {
    this.currentPlaybackId++; 
    
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignorar errores
      }
    });
    this.activeSources = [];
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

  private playBufferAt(buffer: AudioBuffer, startTime: number, duration: number, volume: number = 2.5) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume * 0.8, startTime + duration); 
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + 1.5);

    source.start(startTime);
    source.stop(startTime + duration + 2.0);
    
    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
  }

  private playSynthToneAt(freq: number, startTime: number, duration: number) {
     if (!this.ctx) return;
     const osc = this.ctx.createOscillator();
     const gain = this.ctx.createGain();
     const SYNTH_VOLUME = 0.8;

     const real = new Float32Array([0, 1, 0.4, 0.2, 0.1]); 
     const imag = new Float32Array(real.length).fill(0);
     const wave = this.ctx.createPeriodicWave(real, imag);
     osc.setPeriodicWave(wave);
     
     osc.frequency.setValueAtTime(freq, startTime);
     
     gain.gain.setValueAtTime(0, startTime);
     gain.gain.linearRampToValueAtTime(SYNTH_VOLUME, startTime + 0.01);
     gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
     
     osc.connect(gain);
     gain.connect(this.ctx.destination);
     osc.start(startTime);
     osc.stop(startTime + duration + 0.1);

     this.activeSources.push(osc);
     osc.onended = () => {
       this.activeSources = this.activeSources.filter(s => s !== osc);
     };
  }

  private playClickAt(startTime: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(1000, startTime);
    osc.frequency.exponentialRampToValueAtTime(1, startTime + 0.05);
    
    gain.gain.setValueAtTime(0.7, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + 0.05);
  }

  private wait(seconds: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
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

  private async playChord(rootNoteAbsIndex: number, scaleId: string, duration: number, runId: number) {
    if (this.currentPlaybackId !== runId) return;
    
    let intervals = [0, 4, 7]; 
    const lowerId = scaleId.toLowerCase();
    if (lowerId.includes('menor') || lowerId.includes('dórica') || lowerId.includes('blues')) {
        intervals = [0, 3, 7];
    } else if (lowerId.includes('disminuido')) {
        intervals = [0, 3, 6];
    }

    const notesToPlay: string[] = [];
    intervals.forEach(interval => {
        const abs = rootNoteAbsIndex + interval;
        const note = NOTES[abs % 12];
        const octave = Math.floor(abs / 12);
        notesToPlay.push(`${note}${octave}`);
    });

    const startTime = this.ctx!.currentTime;
    
    notesToPlay.forEach(noteName => {
        const fileName = this.mapNoteToFileName(noteName);
        const buffer = this.buffers[fileName];
        if (buffer) {
            this.playBufferAt(buffer, startTime, duration, 1.8);
        } else {
            const freq = this.getNoteFrequencyFromFullString(noteName);
            this.playSynthToneAt(freq, startTime, duration);
        }
    });
  }

  // Reproduce una secuencia fija (modo edición/preview simple)
  public async playSequence(sequence: SequenceNote[], bpm: number = 120, onStep?: (index: number) => void) {
    this.stop(); 
    this.initContext();
    if (!this.ctx) return;
    
    const runId = ++this.currentPlaybackId;
    
    const beatDuration = 60 / bpm;
    const durMap: Record<DurationType, number> = { 
      'whole': beatDuration * 4, 
      'half': beatDuration * 2, 
      'quarter': beatDuration, 
      'eighth': beatDuration * 0.5 
    };

    const noteNames = sequence.map(s => s.note);
    await this.preloadNotes(noteNames);
    
    for (let i = 0; i < sequence.length; i++) {
        if (this.currentPlaybackId !== runId) break;
        
        const item = sequence[i];
        const duration = durMap[item.duration];
        const fileName = this.mapNoteToFileName(item.note);
        const startTime = this.ctx.currentTime;
        if (this.buffers[fileName]) {
            this.playBufferAt(this.buffers[fileName], startTime, duration);
        } else {
            const freq = this.getNoteFrequencyFromFullString(item.note);
            this.playSynthToneAt(freq, startTime, duration);
        }
        if (onStep) onStep(i);
        await this.wait(duration);
    }
  }

  // Nueva función para reproducir escalas creadas de forma dinámica (intervalos + transposición cromática)
  public async playCustomElasticScale(
    rootNote: string,
    startOctave: number,
    endOctave: number,
    relativeSequence: RelativeNote[],
    bpm: number = 120
  ) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    const runId = ++this.currentPlaybackId;
    
    const beatDuration = 60 / bpm;
    const durMap: Record<DurationType, number> = { 
      'whole': beatDuration * 4, 
      'half': beatDuration * 2, 
      'quarter': beatDuration, 
      'eighth': beatDuration * 0.5 
    };

    const rootIndex = NOTES.indexOf(rootNote);
    
    // Calculamos los índices absolutos de inicio y fin (semitonos desde C0)
    const startAbsolute = (startOctave * 12) + rootIndex;
    const endAbsolute = (endOctave * 12) + rootIndex;

    // Precarga de samples: cubrimos el rango + un margen para las notas altas de la escala
    const preloadList: string[] = [];
    for (let i = startAbsolute; i <= endAbsolute + 24; i++) {
        preloadList.push(`${NOTES[i%12]}${Math.floor(i/12)}`);
    }
    await this.preloadNotes(preloadList);

    let currentRootAbs = startAbsolute;
    const PAUSE_DURATION = 1.0;

    // Iterar CROMÁTICAMENTE (semitono a semitono) hasta llegar a la nota/octava final
    while (currentRootAbs <= endAbsolute) {
        if (this.currentPlaybackId !== runId) return;

        // Reproducir la secuencia relativa transpuesta a la raíz actual
        for (let i = 0; i < relativeSequence.length; i++) {
            if (this.currentPlaybackId !== runId) return;

            const item = relativeSequence[i];
            const noteAbs = currentRootAbs + item.interval;
            const noteName = NOTES[noteAbs % 12];
            const noteOctave = Math.floor(noteAbs / 12);
            const fullNoteName = `${noteName}${noteOctave}`;
            const duration = durMap[item.duration];

            const startTime = this.ctx.currentTime;
            const fileName = this.mapNoteToFileName(fullNoteName);

            if (this.buffers[fileName]) {
                this.playBufferAt(this.buffers[fileName], startTime, duration);
            } else {
                const freq = this.getNoteFrequencyFromFullString(fullNoteName);
                this.playSynthToneAt(freq, startTime, duration);
            }

            await this.wait(duration);
        }

        if (this.currentPlaybackId !== runId) return;

        // Pausa entre repeticiones
        await this.wait(PAUSE_DURATION);
        
        // Subir un semitono para la siguiente vuelta
        currentRootAbs++;
    }
  }

  public async playScale(
      rootNote: string, 
      startOctave: number, 
      endOctave: number, 
      intervals: number[], 
      bpm: number = 100, 
      useMetronome: boolean = false,
      scaleId: string = 'Mayor',
      onStep?: (index: number, total: number) => void
  ) {
    this.stop(); 
    this.initContext();
    if (!this.ctx) return;

    const runId = ++this.currentPlaybackId;

    const beatDuration = 60 / bpm; 
    const rootIndex = NOTES.indexOf(rootNote);
    
    const startAbsolute = (startOctave * 12) + rootIndex;
    const endAbsolute = (endOctave * 12) + rootIndex;
    const actualStart = Math.min(startAbsolute, endAbsolute);
    const actualEnd = Math.max(startAbsolute, endAbsolute);

    const preloadList: string[] = [];
    for (let i = actualStart; i <= actualEnd + 24; i++) { 
       preloadList.push(`${NOTES[i%12]}${Math.floor(i/12)}`);
    }
    await this.preloadNotes(preloadList);

    let currentRootAbs = actualStart;
    const PAUSE_DURATION = 1.0; 

    while (currentRootAbs <= actualEnd) {
        if (this.currentPlaybackId !== runId) return;
        
        let scaleSequence: string[] = [];
        let noteDur = beatDuration * 0.5;

        if (scaleId === 'Rossini' || scaleId === 'Flamenca 8va Descendente') {
            noteDur = beatDuration * 0.25; 
            intervals.forEach(interval => {
                const noteAbs = currentRootAbs + interval;
                scaleSequence.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
            });
        } else {
            const scaleNotes: string[] = [];
            intervals.forEach(interval => {
                const noteAbs = currentRootAbs + interval;
                scaleNotes.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
            });
            scaleSequence = [...scaleNotes, ...[...scaleNotes].reverse().slice(1)];
        }

        for (let i = 0; i < scaleSequence.length; i++) {
            if (this.currentPlaybackId !== runId) return;

            const noteName = scaleSequence[i];
            const startTime = this.ctx.currentTime;
            
            if (useMetronome && i % 4 === 0) this.playClickAt(startTime);

            const fileName = this.mapNoteToFileName(noteName);
            if (this.buffers[fileName]) {
                this.playBufferAt(this.buffers[fileName], startTime, noteDur); 
            } else {
                const freq = this.getNoteFrequencyFromFullString(noteName);
                this.playSynthToneAt(freq, startTime, noteDur);
            }

            if (onStep) onStep(i, scaleSequence.length);
            await this.wait(noteDur);
        }

        if (this.currentPlaybackId !== runId) return;

        await this.wait(PAUSE_DURATION);

        if (useMetronome) this.playClickAt(this.ctx.currentTime);
        await this.playChord(currentRootAbs, scaleId, 1.5, runId);
        
        await this.wait(PAUSE_DURATION); 

        if (this.currentPlaybackId !== runId) return;

        if (currentRootAbs < actualEnd) {
             const nextRootAbs = currentRootAbs + 1;
             
             if (useMetronome) this.playClickAt(this.ctx.currentTime);
             await this.playChord(nextRootAbs, scaleId, 1.5, runId);
             
             await this.wait(PAUSE_DURATION);
        }

        currentRootAbs++;
    }
  }
}

export const audioService = new PianoAudioService();
