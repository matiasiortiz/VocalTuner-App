
import { NOTE_FREQUENCIES, NOTES } from '../constants';
import { DurationType, SequenceNote } from '../types';

class PianoAudioService {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private activeSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  
  // Solución al problema de superposición
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
    
    // Configuración de envolvente para sonido natural
    // Attack rápido
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    
    // Sustain largo: Mantenemos el volumen alto casi hasta el final de la duración lógica
    gain.gain.setValueAtTime(volume * 0.8, startTime + duration); 
    
    // Release natural: Permitimos una cola larga (1.5s) después de que la nota "termina" rítmicamente
    // Esto evita el sonido "cortado"
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + 1.5);

    source.start(startTime);
    // Detenemos la fuente mucho después para permitir que el 'release' termine suavemente
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
    
    let intervals = [0, 4, 7]; // Default Mayor
    
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
            // Usamos duration para el sustain, pero el sonido durará más gracias a playBufferAt
            this.playBufferAt(buffer, startTime, duration, 1.8);
        } else {
            const freq = this.getNoteFrequencyFromFullString(noteName);
            this.playSynthToneAt(freq, startTime, duration);
        }
    });
  }

  public async playSequence(sequence: SequenceNote[], onStep?: (index: number) => void) {
    this.stop(); 
    this.initContext();
    if (!this.ctx) return;
    
    const runId = ++this.currentPlaybackId;

    const noteNames = sequence.map(s => s.note);
    await this.preloadNotes(noteNames);
    const durMap: Record<DurationType, number> = { 'whole': 1.6, 'half': 0.8, 'quarter': 0.4, 'eighth': 0.2 };
    
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

    // Pausa fija solicitada por el usuario entre acordes
    const PAUSE_DURATION = 1.0; 

    while (currentRootAbs <= actualEnd) {
        if (this.currentPlaybackId !== runId) return;
        
        let scaleSequence: string[] = [];
        let noteDur = beatDuration * 0.5;

        // Construcción de la secuencia de notas
        if (scaleId === 'Rossini') {
            // Rossini usa el patrón definido en constants EXACTAMENTE como está
            // Semicorcheas (aprox 1/4 de tiempo)
            noteDur = beatDuration * 0.25; 
            intervals.forEach(interval => {
                const noteAbs = currentRootAbs + interval;
                scaleSequence.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
            });
        } else {
            // Escalas normales: Subir y bajar
            const scaleNotes: string[] = [];
            intervals.forEach(interval => {
                const noteAbs = currentRootAbs + interval;
                scaleNotes.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
            });
            scaleSequence = [...scaleNotes, ...[...scaleNotes].reverse().slice(1)];
        }

        // Reproducción de la escala
        for (let i = 0; i < scaleSequence.length; i++) {
            if (this.currentPlaybackId !== runId) return;

            const noteName = scaleSequence[i];
            const startTime = this.ctx.currentTime;
            
            if (useMetronome && i % 4 === 0) this.playClickAt(startTime);

            const fileName = this.mapNoteToFileName(noteName);
            // Tocamos la nota, el sustain natural se maneja en playBufferAt
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

        // 1. Pausa de 1 segundo después de la escala antes del acorde
        await this.wait(PAUSE_DURATION);

        // 2. Acorde Raíz (Resolución)
        // Disparamos el sonido
        if (useMetronome) this.playClickAt(this.ctx.currentTime);
        await this.playChord(currentRootAbs, scaleId, 1.5, runId);
        
        // Esperamos 1 segundo OBLIGADO para el cambio
        await this.wait(PAUSE_DURATION); 

        if (this.currentPlaybackId !== runId) return;

        // 3. Modulación (Siguiente tono)
        if (currentRootAbs < actualEnd) {
             const nextRootAbs = currentRootAbs + 1;
             
             // Disparamos el acorde de modulación
             if (useMetronome) this.playClickAt(this.ctx.currentTime);
             await this.playChord(nextRootAbs, scaleId, 1.5, runId);
             
             // Esperamos 1 segundo OBLIGADO antes de la siguiente escala
             await this.wait(PAUSE_DURATION);
        }

        currentRootAbs++;
    }
  }
}

export const audioService = new PianoAudioService();
