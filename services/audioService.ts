
import { NOTE_FREQUENCIES, NOTES } from '../constants';
import { DurationType, SequenceNote } from '../types';

class PianoAudioService {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private activeSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  private isStopped: boolean = false;
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
    this.isStopped = true;
    
    // Detener todas las fuentes de audio activas inmediatamente
    this.activeSources.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Ignorar errores si ya se detuvo
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
    
    // Envelope para evitar clicks
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.05); 
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration + 0.5);

    source.start(startTime);
    source.stop(startTime + duration + 0.6);
    
    // Rastrear fuente para poder detenerla
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

  // Utilidad para esperar tiempo en funciones async
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

  // Reproduce un acorde simultáneo
  private async playChord(rootNoteAbsIndex: number, scaleId: string, duration: number) {
    if (this.isStopped) return;
    
    // Determinar tipo de acorde basado en la escala
    // Mayor/Pentatónica Mayor/Aumentada -> Tríada Mayor (0, 4, 7)
    // Menor/Pentatónica Menor/Dórica -> Tríada Menor (0, 3, 7)
    // Disminuido -> Disminuido (0, 3, 6)
    
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
            // Volumen un poco más bajo para acordes para que no saturen
            this.playBufferAt(buffer, startTime, duration, 1.8);
        } else {
            const freq = this.getNoteFrequencyFromFullString(noteName);
            this.playSynthToneAt(freq, startTime, duration);
        }
    });
  }

  public async playSequence(sequence: SequenceNote[], onStep?: (index: number) => void) {
    this.initContext();
    this.isStopped = false;
    if (!this.ctx) return;

    const noteNames = sequence.map(s => s.note);
    await this.preloadNotes(noteNames);

    const durMap: Record<DurationType, number> = { 'whole': 1.6, 'half': 0.8, 'quarter': 0.4, 'eighth': 0.2 };
    
    // Reproducción secuencial con awaits para permitir stop
    for (let i = 0; i < sequence.length; i++) {
        if (this.isStopped) break;
        
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
        
        // Esperar la duración de la nota antes de pasar a la siguiente
        await this.wait(duration);
    }
  }

  /**
   * Rutina de Vocalización Avanzada:
   * 1. Toca escala (Arriba/Abajo)
   * 2. Toca Acorde de la tonalidad actual
   * 3. Toca Acorde de la tonalidad SIGUIENTE (aviso de modulación)
   * 4. Sube medio tono y repite
   */
  public async playScale(
      rootNote: string, 
      startOctave: number, 
      endOctave: number, 
      intervals: number[], 
      bpm: number = 100, 
      useMetronome: boolean = false,
      scaleId: string = 'Mayor', // Necesario para determinar el tipo de acorde
      onStep?: (index: number, total: number) => void
  ) {
    this.initContext();
    this.isStopped = false;
    if (!this.ctx) return;

    const noteDuration = 60 / bpm;
    const rootIndex = NOTES.indexOf(rootNote);
    
    // Definir rangos
    const startAbsolute = (startOctave * 12) + rootIndex;
    const endAbsolute = (endOctave * 12) + rootIndex;
    const actualStart = Math.min(startAbsolute, endAbsolute);
    const actualEnd = Math.max(startAbsolute, endAbsolute);

    // Precargar todas las posibles notas (aproximación para no bloquear el inicio)
    // Cargamos una octava cromática base en la octava inicial y final
    const preloadList: string[] = [];
    for (let i = actualStart; i <= actualEnd + 14; i++) { // +14 para cubrir rango de escalas superiores
       preloadList.push(`${NOTES[i%12]}${Math.floor(i/12)}`);
    }
    await this.preloadNotes(preloadList);

    // Bucle principal de modulación
    let currentRootAbs = actualStart;

    while (currentRootAbs <= actualEnd && !this.isStopped) {
        
        // 1. CONSTRUIR ESCALA
        const scaleNotes: string[] = [];
        intervals.forEach(interval => {
            const noteAbs = currentRootAbs + interval;
            scaleNotes.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
        });
        const scaleSequence = [...scaleNotes, ...[...scaleNotes].reverse().slice(1)];
        
        // 2. REPRODUCIR ESCALA
        for (let i = 0; i < scaleSequence.length; i++) {
            if (this.isStopped) return;
            
            const noteName = scaleSequence[i];
            const startTime = this.ctx.currentTime;
            const duration = noteDuration * 1.5; // Legato feel

            // Metrónomo
            if (useMetronome) this.playClickAt(startTime);

            // Nota
            const fileName = this.mapNoteToFileName(noteName);
            if (this.buffers[fileName]) {
                this.playBufferAt(this.buffers[fileName], startTime, duration);
            } else {
                const freq = this.getNoteFrequencyFromFullString(noteName);
                this.playSynthToneAt(freq, startTime, duration);
            }

            if (onStep) onStep(i, scaleSequence.length); // Esto es solo un feedback visual aproximado
            
            // Esperar al siguiente beat
            await this.wait(noteDuration);
        }

        if (this.isStopped) return;

        // 3. REPRODUCIR ACORDE ACTUAL (Cierre)
        // Duración de acorde: una blanca (2 tiempos) o redonda
        const chordDuration = noteDuration * 2; 
        if (useMetronome) {
             this.playClickAt(this.ctx.currentTime);
             this.playClickAt(this.ctx.currentTime + noteDuration);
        }
        await this.playChord(currentRootAbs, scaleId, chordDuration);
        await this.wait(chordDuration);

        if (this.isStopped) return;

        // 4. REPRODUCIR ACORDE SIGUIENTE (Preparación) si no es el último
        if (currentRootAbs < actualEnd) {
             const nextRootAbs = currentRootAbs + 1; // Siguiente semitono
             if (useMetronome) {
                this.playClickAt(this.ctx.currentTime);
                this.playClickAt(this.ctx.currentTime + noteDuration);
             }
             await this.playChord(nextRootAbs, scaleId, chordDuration);
             await this.wait(chordDuration);
        }

        // Avanzar medio tono
        currentRootAbs++;
    }
  }
}

export const audioService = new PianoAudioService();
