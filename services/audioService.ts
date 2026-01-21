import { NOTE_FREQUENCIES, NOTES } from '../constants';
import { DurationType, RelativeNote, SequenceNote } from '../types';

class PianoAudioService {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private activeSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  
  private currentPlaybackId: number = 0; 

  // Mapeo para convertir notas de la app (C#) a nombres de archivo comunes (Db)
  private noteMap: Record<string, string> = {
    "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
  };

  public initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn("Audio context resume failed", e));
    }
  }

  public async resume() {
    this.initContext();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public stop() {
    this.currentPlaybackId++; 
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) { }
    });
    this.activeSources = [];
  }

  private mapNoteToFileName(note: string): string {
    const match = note.match(/^([A-G][#]?)(-?\d+)$/);
    if (!match) return note;
    
    let [_, name, octave] = match;
    // Si la nota tiene un mapeo (ej. C# -> Db), lo usamos
    if (this.noteMap[name]) {
      name = this.noteMap[name];
    }
    return `${name}${octave}`;
  }

  private async fetchSample(noteFile: string): Promise<AudioBuffer> {
    // Usamos un CDN fiable para los samples de piano
    const url = `https://raw.githubusercontent.com/fuhton/piano-mp3/master/piano-mp3/${noteFile}.mp3`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    if (this.ctx) {
      return await this.ctx.decodeAudioData(arrayBuffer);
    }
    throw new Error("AudioContext not initialized");
  }

  private async preloadNotes(notes: string[]) {
    this.initContext();
    const uniqueNotes = [...new Set(notes)];
    
    const promises = uniqueNotes.map(async (note) => {
      const fileName = this.mapNoteToFileName(note);
      if (!this.buffers[fileName]) {
        try {
          const buffer = await this.fetchSample(fileName);
          this.buffers[fileName] = buffer;
        } catch (e) {
          console.warn(`Could not load sample for ${note}, fallback to synth.`);
        }
      }
    });
    // Esperamos a que todos carguen (o fallen)
    await Promise.allSettled(promises);
  }

  private playBufferAt(buffer: AudioBuffer, startTime: number, duration: number, volume: number = 1.0) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    
    // Envolvente para piano (Ataque rápido, decay natural)
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015); // Ataque suave para evitar click
    gain.gain.exponentialRampToValueAtTime(volume * 0.6, startTime + duration * 0.4); // Decay inicial
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + 1.5); // Release largo

    source.start(startTime);
    source.stop(startTime + duration + 2.0); // Dejar cola de sonido
    
    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
  }

  private playSynthToneAt(freq: number, startTime: number, duration: number) {
     if (!this.ctx) return;
     const osc = this.ctx.createOscillator();
     const gain = this.ctx.createGain();
     
     osc.type = 'triangle'; // Triángulo es más suave que square/sawtooth
     osc.frequency.setValueAtTime(freq, startTime);
     
     gain.gain.setValueAtTime(0, startTime);
     gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
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
    
    osc.frequency.setValueAtTime(1200, startTime);
    gain.gain.setValueAtTime(0.3, startTime);
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
    await this.resume();
    if (!this.ctx) return;

    if (typeof note === 'number') {
      this.playSynthToneAt(note, this.ctx.currentTime, duration);
      return;
    }

    const noteName = note;
    const fileName = this.mapNoteToFileName(noteName);

    // Intento rápido de carga si no existe
    if (!this.buffers[fileName]) {
        try {
            const buffer = await this.fetchSample(fileName);
            this.buffers[fileName] = buffer;
        } catch(e) {}
    }

    if (this.buffers[fileName]) {
      this.playBufferAt(this.buffers[fileName], this.ctx.currentTime, duration, 2.0);
    } else {
      const freq = this.getNoteFrequencyFromFullString(noteName);
      this.playSynthToneAt(freq, this.ctx.currentTime, duration);
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
    
    let intervals = [0, 4, 7]; // Mayor por defecto
    const lowerId = scaleId.toLowerCase();
    if (lowerId.includes('menor') || lowerId.includes('dórica') || lowerId.includes('blues')) {
        intervals = [0, 3, 7];
    } else if (lowerId.includes('disminuido')) {
        intervals = [0, 3, 6];
    } else if (lowerId.includes('aumentada')) {
        intervals = [0, 4, 8];
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
            this.playBufferAt(buffer, startTime, duration, 1.2); 
        } else {
            const freq = this.getNoteFrequencyFromFullString(noteName);
            this.playSynthToneAt(freq, startTime, duration);
        }
    });
  }

  public async playSequence(sequence: SequenceNote[], bpm: number = 120, onStep?: (index: number) => void) {
    this.stop(); 
    await this.resume();
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
            this.playBufferAt(this.buffers[fileName], startTime, duration, 2.0);
        } else {
            const freq = this.getNoteFrequencyFromFullString(item.note);
            this.playSynthToneAt(freq, startTime, duration);
        }
        if (onStep) onStep(i);
        await this.wait(duration);
    }
  }

  public async playCustomElasticScale(
    rootNote: string,
    startOctave: number,
    endOctave: number,
    relativeSequence: RelativeNote[],
    bpm: number = 120
  ) {
    this.stop();
    await this.resume();
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
    const startAbsolute = (startOctave * 12) + rootIndex;
    const endAbsolute = (endOctave * 12) + rootIndex;

    // Precarga optimizada
    const preloadList: string[] = [];
    let tempRoot = startAbsolute;
    while(tempRoot <= endAbsolute) {
        relativeSequence.forEach(item => {
            const noteAbs = tempRoot + item.interval;
            preloadList.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
        });
        tempRoot++;
    }
    await this.preloadNotes(preloadList);

    let currentRootAbs = startAbsolute;
    const PAUSE_DURATION = 1.0;

    while (currentRootAbs <= endAbsolute) {
        if (this.currentPlaybackId !== runId) return;

        for (let i = 0; i < relativeSequence.length; i++) {
            if (this.currentPlaybackId !== runId) return;

            const item = relativeSequence[i];
            const noteAbs = currentRootAbs + item.interval;
            const fullNoteName = `${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`;
            const duration = durMap[item.duration];

            const startTime = this.ctx.currentTime;
            const fileName = this.mapNoteToFileName(fullNoteName);

            if (this.buffers[fileName]) {
                this.playBufferAt(this.buffers[fileName], startTime, duration, 2.0);
            } else {
                const freq = this.getNoteFrequencyFromFullString(fullNoteName);
                this.playSynthToneAt(freq, startTime, duration);
            }

            await this.wait(duration);
        }
        if (this.currentPlaybackId !== runId) return;
        await this.wait(PAUSE_DURATION);
        currentRootAbs++;
    }
  }

  public async playScale(
      rootNote: string, 
      startOctave: number, 
      endOctave: number, 
      intervals: number[],
      bpm: number = 120,
      isMetronomeOn: boolean = false,
      scaleId: string = "Mayor"
  ) {
    this.stop();
    await this.resume();
    if (!this.ctx) return;

    const runId = ++this.currentPlaybackId;
    const beatDuration = 60 / bpm;
    const noteDuration = beatDuration;

    const rootIndex = NOTES.indexOf(rootNote);
    const startAbsolute = (startOctave * 12) + rootIndex;
    const endAbsolute = (endOctave * 12) + rootIndex;

    // Preload
    const preloadList: string[] = [];
    let tempRoot = startAbsolute;
    while (tempRoot <= endAbsolute) {
        intervals.forEach(interval => {
            const noteAbs = tempRoot + interval;
            preloadList.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
        });
        tempRoot++;
    }
    await this.preloadNotes(preloadList);

    let currentRootAbs = startAbsolute;
    const PAUSE_DURATION = beatDuration * 2; 

    while (currentRootAbs <= endAbsolute) {
        if (this.currentPlaybackId !== runId) return;
        
        if (isMetronomeOn) {
            this.playClickAt(this.ctx.currentTime);
        }

        for (let i = 0; i < intervals.length; i++) {
             if (this.currentPlaybackId !== runId) return;
             
             const interval = intervals[i];
             const noteAbs = currentRootAbs + interval;
             const fullNoteName = `${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`;
             
             const startTime = this.ctx.currentTime;
             const fileName = this.mapNoteToFileName(fullNoteName);

             if (this.buffers[fileName]) {
                 this.playBufferAt(this.buffers[fileName], startTime, noteDuration, 2.0);
             } else {
                 const freq = this.getNoteFrequencyFromFullString(fullNoteName);
                 this.playSynthToneAt(freq, startTime, noteDuration);
             }

             await this.wait(noteDuration);
        }

        if (this.currentPlaybackId !== runId) return;
        await this.wait(PAUSE_DURATION);
        currentRootAbs++;
    }
  }
}

export const audioService = new PianoAudioService();