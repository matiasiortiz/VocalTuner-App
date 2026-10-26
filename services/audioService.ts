import { NOTE_FREQUENCIES, NOTES } from '../constants';
import { DurationType, RelativeNote, SequenceNote } from '../types';

export interface ScaleNoteEvent {
  note: string;
  fullNote: string;
  octave: number;
  isChord?: boolean;
  chordName?: string;
  index?: number;
}

class PianoAudioService {
  private ctx: AudioContext | null = null;
  private masterBus: DynamicsCompressorNode | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private activeSources: (AudioBufferSourceNode | OscillatorNode)[] = [];
  private activeGainNodes: GainNode[] = [];
  private currentPlaybackId: number = 0;
  private pendingFetches: Set<string> = new Set();
  private waitCancelResolvers: Set<() => void> = new Set();

  private liveBpm: number = 120;
  private liveMetronome: boolean = false;

  // Mapeo para convertir notas de la app (C#) a nombres de archivo comunes (Db)
  private noteMap: Record<string, string> = {
    "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
  };

  public setBpm(bpm: number) {
    const parsed = Number(bpm);
    if (!Number.isNaN(parsed) && parsed > 0) {
      this.liveBpm = Math.max(30, Math.min(300, parsed));
    }
  }

  public getBpm(): number {
    return this.liveBpm;
  }

  public setMetronome(enabled: boolean) {
    this.liveMetronome = Boolean(enabled);
  }

  private getOutputNode(): AudioNode | null {
    if (!this.ctx) return null;
    if (!this.masterBus) {
      try {
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.setValueAtTime(-6, this.ctx.currentTime);
        comp.knee.setValueAtTime(14, this.ctx.currentTime);
        comp.ratio.setValueAtTime(3.5, this.ctx.currentTime);
        comp.attack.setValueAtTime(0.005, this.ctx.currentTime);
        comp.release.setValueAtTime(0.25, this.ctx.currentTime);
        comp.connect(this.ctx.destination);
        this.masterBus = comp;
      } catch (e) {
        return this.ctx.destination;
      }
    }
    return this.masterBus;
  }

  public initContext() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(e => console.warn("Audio context resume failed", e));
      }
      this.getOutputNode();
    } catch (e) {
      console.warn("Audio context init warning:", e);
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

    // Resolver inmediatamente cualquier espera pendiente
    const resolvers = Array.from(this.waitCancelResolvers);
    this.waitCancelResolvers.clear();
    resolvers.forEach(fn => {
      try { fn(); } catch (e) { }
    });

    const sourcesToStop = this.activeSources;
    const gainsToStop = this.activeGainNodes;
    this.activeSources = [];
    this.activeGainNodes = [];

    const now = this.ctx?.currentTime ?? 0;
    gainsToStop.forEach(gain => {
      try {
        if (this.ctx) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setTargetAtTime(0.0001, now, 0.015);
        } else {
          gain.disconnect();
        }
      } catch (e) { }
    });

    sourcesToStop.forEach(source => {
      try {
        if (this.ctx) {
          source.stop(now + 0.04);
        } else {
          source.stop();
          source.disconnect();
        }
      } catch (e) { }
    });

    setTimeout(() => {
      gainsToStop.forEach(gain => {
        try { gain.disconnect(); } catch (e) { }
      });
    }, 60);
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

  private async fetchSample(noteFile: string): Promise<AudioBuffer | null> {
    if (this.buffers[noteFile]) return this.buffers[noteFile];
    if (this.pendingFetches.has(noteFile)) return null;
    this.pendingFetches.add(noteFile);

    try {
      const url = `https://raw.githubusercontent.com/fuhton/piano-mp3/master/piano-mp3/${noteFile}.mp3`;
      const fetchFn = typeof window !== 'undefined' && typeof window.fetch === 'function'
        ? window.fetch.bind(window)
        : fetch;
      const response = await fetchFn(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      if (this.ctx) {
        const decoded = await this.ctx.decodeAudioData(arrayBuffer);
        this.buffers[noteFile] = decoded;
        return decoded;
      }
    } catch (e) {
      // Ignorar fallo de red silenciosamente, el sintetizador acústico se encarga
    } finally {
      this.pendingFetches.delete(noteFile);
    }
    return null;
  }

  // Precarga en segundo plano SIN bloquear la reproducción
  private preloadNotes(notes: string[]) {
    this.initContext();
    const uniqueNotes = [...new Set(notes)];
    uniqueNotes.forEach(note => {
      const fileName = this.mapNoteToFileName(note);
      if (!this.buffers[fileName]) {
        this.fetchSample(fileName);
      }
    });
  }

  /**
   * Sintetizador de Piano Acústico con sustain cálido y prolongado (estilo piano de cola con medio pedal):
   * Modela cuerdas de acero con inarmonicidad, 3 unísonos desafinados,
   * transitorio de golpe de macillo y decaimiento cantado en tres etapas.
   */
  public playAcousticPianoToneAt(freq: number, startTime: number, duration: number, volume: number = 1.0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const out = this.getOutputNode() || ctx.destination;

    const noteGain = ctx.createGain();
    this.activeGainNodes.push(noteGain);

    // Filtro dinámico de tabla armónica con caída gradual para preservar el brillo durante el sustain
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const initCutoff = Math.min(11500, Math.max(1600, freq * 7.5));
    const endCutoff = Math.max(920, freq * 2.8);
    filter.frequency.setValueAtTime(initCutoff, startTime);
    filter.frequency.exponentialRampToValueAtTime(endCutoff, startTime + Math.max(0.95, duration * 1.3));
    filter.Q.setValueAtTime(1.1, startTime);

    if (ctx.createStereoPanner) {
      try {
        const panner = ctx.createStereoPanner();
        const panVal = Math.max(-0.45, Math.min(0.45, Math.log2(freq / 261.63) * 0.22));
        panner.pan.setValueAtTime(panVal, startTime);
        filter.connect(panner);
        panner.connect(noteGain);
      } catch (e) {
        filter.connect(noteGain);
      }
    } else {
      filter.connect(noteGain);
    }
    noteGain.connect(out);

    // Sustain extendido: graves resuenan un poco más que agudos, como en un piano acústico real
    const registerExtra = freq < 260 ? 0.85 : freq < 520 ? 0.45 : 0.15;
    const decayDuration = Math.max(duration + 2.8 + registerExtra, 3.6 + registerExtra);
    const sustainPlateau = startTime + Math.max(1.65, decayDuration * 0.56);
    const stopTime = startTime + decayDuration;

    noteGain.gain.setValueAtTime(0.0001, startTime);
    // 1. Impacto del macillo
    noteGain.gain.linearRampToValueAtTime(volume * 0.62, startTime + 0.004);
    // 2. Asentamiento inicial en el puente (primeros 180ms)
    noteGain.gain.exponentialRampToValueAtTime(volume * 0.47, startTime + 0.18);
    // 3. Sustain largo y cantado de las cuerdas vibrantes
    noteGain.gain.exponentialRampToValueAtTime(volume * 0.21, sustainPlateau);
    // 4. Cola de resonancia natural suave
    noteGain.gain.exponentialRampToValueAtTime(0.0008, stopTime - 0.06);
    noteGain.gain.linearRampToValueAtTime(0.0001, stopTime);

    const B = 0.00012 * Math.pow(freq / 130, 0.4);

    // Tres cuerdas al unísono con leve desafinación acústica
    const unisonOffsets = freq < 130 ? [0] : [-1.3, 0, 1.3];
    const unisonGains = freq < 130 ? [1.0] : [0.33, 0.44, 0.33];
    unisonOffsets.forEach((cents, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime(cents, startTime);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(unisonGains[i], startTime);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(startTime);
      osc.stop(stopTime);
      this.activeSources.push(osc);
      osc.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== osc);
      };
    });

    // Parciales armónicos con sustain prolongado para mayor cuerpo
    const partials = [
      { mult: 2, amp: 0.40, decayMult: 0.85 },
      { mult: 3, amp: 0.22, decayMult: 0.65 },
      { mult: 4, amp: 0.11, decayMult: 0.45 },
      { mult: 5, amp: 0.05, decayMult: 0.32 },
    ];

    partials.forEach(({ mult, amp, decayMult }) => {
      const pFreq = mult * freq * Math.sqrt(1 + B * mult * mult);
      if (pFreq > 18000) return;

      const pOsc = ctx.createOscillator();
      pOsc.type = 'sine';
      pOsc.frequency.setValueAtTime(pFreq, startTime);

      const pGain = ctx.createGain();
      const pSustainTime = Math.max(duration + 1.5, 2.3) * decayMult;
      const pEnd = Math.min(stopTime, startTime + pSustainTime + 0.55);

      pGain.gain.setValueAtTime(amp, startTime);
      pGain.gain.exponentialRampToValueAtTime(amp * 0.38, startTime + Math.min(0.95, pSustainTime * 0.48));
      pGain.gain.exponentialRampToValueAtTime(0.0001, pEnd);

      pOsc.connect(pGain);
      pGain.connect(filter);

      pOsc.start(startTime);
      pOsc.stop(stopTime);
      this.activeSources.push(pOsc);
      pOsc.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== pOsc);
      };
    });

    // Transitorio de macillo de fieltro
    const hammerOsc = ctx.createOscillator();
    const hammerGain = ctx.createGain();
    hammerOsc.type = 'triangle';
    hammerOsc.frequency.setValueAtTime(Math.min(2600, Math.max(700, freq * 2.3)), startTime);
    hammerGain.gain.setValueAtTime(0.13 * volume, startTime);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.026);

    hammerOsc.connect(hammerGain);
    hammerGain.connect(filter);
    hammerOsc.start(startTime);
    hammerOsc.stop(startTime + 0.032);
    this.activeSources.push(hammerOsc);
    hammerOsc.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== hammerOsc);
    };
  }

  private playBufferAt(buffer: AudioBuffer, startTime: number, duration: number, volume: number = 1.0) {
    if (!this.ctx) return;
    const out = this.getOutputNode() || this.ctx.destination;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    this.activeGainNodes.push(gain);
    
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(out);
    
    // Envolvente con sustain largo: respeta la resonancia natural grabada del piano de cola
    const maxSampleDur = buffer.duration ? Math.min(buffer.duration, 5.2) : 4.2;
    const sustainHold = Math.min(Math.max(duration + 1.5, 1.9), maxSampleDur * 0.65);
    const releaseTime = Math.min(Math.max(duration + 3.0, 3.8), maxSampleDur);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume * 1.45, startTime + 0.010);
    // Sostener el cuerpo armónico de la nota antes del apagador
    gain.gain.exponentialRampToValueAtTime(volume * 1.15, startTime + sustainHold);
    // Caída natural y prolongada
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + Math.max(sustainHold + 0.25, releaseTime - 0.08));
    gain.gain.linearRampToValueAtTime(0.0001, startTime + releaseTime);

    source.start(startTime);
    source.stop(startTime + releaseTime + 0.06);
    
    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
  }

  /**
   * Reproduce una nota con sonido de piano:
   * Utiliza el sample grabado en memoria si está disponible, o el sintetizador acústico realista instantáneo.
   */
  public playPianoNoteAt(fullNoteName: string, startTime: number, duration: number, volume: number = 1.0) {
    if (!this.ctx) return;
    const fileName = this.mapNoteToFileName(fullNoteName);
    const buffer = this.buffers[fileName];

    if (buffer) {
      this.playBufferAt(buffer, startTime, duration, volume);
    } else {
      const freq = this.getNoteFrequencyFromFullString(fullNoteName);
      this.playAcousticPianoToneAt(freq, startTime, duration, volume);
      // Intenta cargar el sample en segundo plano para futuros toques
      this.fetchSample(fileName);
    }
  }

  private playClickAt(startTime: number) {
    if (!this.ctx) return;
    const out = this.getOutputNode() || this.ctx.destination;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(1200, startTime);
    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
    
    osc.connect(gain);
    gain.connect(out);
    
    osc.start(startTime);
    osc.stop(startTime + 0.05);
    this.activeSources.push(osc);
    osc.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== osc);
    };
  }

  /**
   * Espera musical expresada en pulsos (beats) que se adapta en tiempo real
   * si el usuario cambia el BPM durante la reproducción y se cancela al instante con stop().
   */
  private waitBeats(beats: number, runId: number): Promise<void> {
    if (beats <= 0 || this.currentPlaybackId !== runId) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      let elapsedBeats = 0;
      let lastTime = performance.now();
      let finished = false;
      let timerId: ReturnType<typeof setTimeout> | null = null;

      const cleanupAndResolve = () => {
        if (finished) return;
        finished = true;
        if (timerId !== null) clearTimeout(timerId);
        this.waitCancelResolvers.delete(cleanupAndResolve);
        resolve();
      };

      this.waitCancelResolvers.add(cleanupAndResolve);

      const tick = () => {
        if (finished) return;
        if (this.currentPlaybackId !== runId) {
          cleanupAndResolve();
          return;
        }
        const now = performance.now();
        const dtSeconds = Math.max(0, (now - lastTime) / 1000);
        lastTime = now;

        const currentBpm = Math.max(30, Math.min(300, this.liveBpm || 120));
        elapsedBeats += dtSeconds * (currentBpm / 60);

        const remainingBeats = beats - elapsedBeats;
        if (remainingBeats <= 0.002) {
          cleanupAndResolve();
          return;
        }

        const remainingMs = (remainingBeats / (currentBpm / 60)) * 1000;
        timerId = setTimeout(tick, Math.min(25, Math.max(4, remainingMs)));
      };

      const initialBpm = Math.max(30, Math.min(300, this.liveBpm || 120));
      const initialMs = (beats / (initialBpm / 60)) * 1000;
      timerId = setTimeout(tick, Math.min(25, Math.max(4, initialMs)));
    });
  }

  public async playNote(note: string | number, duration: number = 1.2) {
    await this.resume();
    if (!this.ctx) return;

    if (typeof note === 'number') {
      this.playAcousticPianoToneAt(note, this.ctx.currentTime, duration, 1.0);
      return;
    }

    this.playPianoNoteAt(note, this.ctx.currentTime, duration, 1.0);
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
    if (!this.ctx) return;
    
    let intervals = [0, 4, 7]; // Acorde Mayor por defecto
    const lowerId = scaleId.toLowerCase();
    if (lowerId.includes('menor') || lowerId.includes('dórica') || lowerId.includes('blues')) {
      intervals = [0, 3, 7]; // Menor
    } else if (lowerId.includes('disminuido')) {
      intervals = [0, 3, 6]; // Disminuido
    } else if (lowerId.includes('aumentada')) {
      intervals = [0, 4, 8]; // Aumentado
    }

    const notesToPlay: string[] = [];
    intervals.forEach(interval => {
      const abs = rootNoteAbsIndex + interval;
      const note = NOTES[abs % 12];
      const octave = Math.floor(abs / 12);
      notesToPlay.push(`${note}${octave}`);
    });

    const startTime = this.ctx.currentTime;
    
    // Ligero arpegio de pulsación humana (12ms de diferencia entre notas del acorde como en un piano de cola real)
    notesToPlay.forEach((noteName, idx) => {
      const noteStartTime = startTime + idx * 0.012;
      this.playPianoNoteAt(noteName, noteStartTime, duration, 0.85);
    });
  }

  public async playSequence(sequence: SequenceNote[], bpm: number = 120, onStep?: (index: number) => void) {
    this.stop(); 
    this.setBpm(bpm);
    await this.resume();
    if (!this.ctx) return;
    
    const runId = ++this.currentPlaybackId;
    const beatMultipliers: Record<DurationType, number> = { 
      'whole': 4, 
      'half': 2, 
      'quarter': 1, 
      'eighth': 0.5 
    };

    const noteNames = sequence.map(s => s.note);
    this.preloadNotes(noteNames);
    
    for (let i = 0; i < sequence.length; i++) {
      if (this.currentPlaybackId !== runId) break;
      
      const item = sequence[i];
      const beats = beatMultipliers[item.duration];
      const currentBeatDuration = 60 / this.liveBpm;
      const duration = currentBeatDuration * beats;
      const startTime = this.ctx.currentTime;
      
      this.playPianoNoteAt(item.note, startTime, duration, 1.0);
      if (onStep) onStep(i);
      await this.waitBeats(beats, runId);
    }
  }

  public async playCustomElasticScale(
    rootNote: string,
    startOctave: number,
    endOctave: number,
    relativeSequence: RelativeNote[],
    bpm: number = 120,
    onStep?: (noteInfo: ScaleNoteEvent) => void
  ) {
    this.stop();
    this.setBpm(bpm);
    await this.resume();
    if (!this.ctx) return;

    const runId = ++this.currentPlaybackId;
    const beatMultipliers: Record<DurationType, number> = { 
      'whole': 4, 
      'half': 2, 
      'quarter': 1, 
      'eighth': 0.5 
    };

    const rootIndex = NOTES.indexOf(rootNote);
    const startAbsolute = (startOctave * 12) + rootIndex;
    const endAbsolute = (endOctave * 12) + rootIndex;

    const actStart = Math.min(startAbsolute, endAbsolute);
    const actEnd = Math.max(startAbsolute, endAbsolute);

    // Precarga optimizada en segundo plano
    const preloadList: string[] = [];
    let tempRoot = actStart;
    while (tempRoot <= actEnd) {
      relativeSequence.forEach(item => {
        const noteAbs = tempRoot + item.interval;
        if (noteAbs >= 0) {
          preloadList.push(`${NOTES[noteAbs % 12]}${Math.floor(noteAbs / 12)}`);
        }
      });
      tempRoot++;
    }
    this.preloadNotes(preloadList);

    let currentRootAbs = actStart;

    while (currentRootAbs <= actEnd) {
      if (this.currentPlaybackId !== runId) return;

      for (let i = 0; i < relativeSequence.length; i++) {
        if (this.currentPlaybackId !== runId) return;

        const item = relativeSequence[i];
        const noteAbs = currentRootAbs + item.interval;
        const noteName = NOTES[((noteAbs % 12) + 12) % 12];
        const octave = Math.floor(noteAbs / 12);
        const fullNoteName = `${noteName}${octave}`;
        const beats = beatMultipliers[item.duration];
        const currentBeatDuration = 60 / this.liveBpm;
        const duration = currentBeatDuration * beats;

        const startTime = this.ctx.currentTime;
        this.playPianoNoteAt(fullNoteName, startTime, duration, 1.0);

        if (onStep) {
          onStep({ note: noteName, fullNote: fullNoteName, octave, index: i });
        }

        await this.waitBeats(beats, runId);
      }
      if (this.currentPlaybackId !== runId) return;
      await this.waitBeats(1.5, runId);
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
    scaleId: string = "Mayor",
    onNoteChange?: (info: ScaleNoteEvent | null) => void
  ) {
    this.stop();
    this.setBpm(bpm);
    this.setMetronome(isMetronomeOn);
    await this.resume();
    if (!this.ctx) return;

    const runId = ++this.currentPlaybackId;
    
    // Duración rítmica en pulsos (beats) por tipo de escala
    const noteBeats = (scaleId === 'Rossini' || scaleId === 'Flamenca 8va Descendente') ? 0.25 : 0.5;

    const rootIndex = NOTES.indexOf(rootNote);
    const startAbsolute = (startOctave * 12) + rootIndex;
    const endAbsolute = (endOctave * 12) + rootIndex;

    const actStart = Math.min(startAbsolute, endAbsolute);
    const actEnd = Math.max(startAbsolute, endAbsolute);

    // Preload en segundo plano (no bloqueante)
    const preloadList: string[] = [];
    for (let i = actStart; i <= actEnd + 24; i++) {
      preloadList.push(`${NOTES[i % 12]}${Math.floor(i / 12)}`);
    }
    this.preloadNotes(preloadList);

    let currentRootAbs = actStart;

    while (currentRootAbs <= actEnd) {
      if (this.currentPlaybackId !== runId) return;

      // Construcción de la secuencia (Ida y Vuelta para ejercicios vocales)
      let sequenceIndices: number[] = [];
      if (scaleId === 'Rossini' || scaleId === 'Flamenca 8va Descendente' || scaleId === 'Progresión por Terceras') {
        sequenceIndices = intervals.map(i => currentRootAbs + i);
      } else {
        const ascending = intervals.map(i => currentRootAbs + i);
        sequenceIndices = [...ascending, ...[...ascending].reverse().slice(1)];
      }

      // Reproducir notas de la escala con sonido de piano leyendo siempre el BPM actual en vivo
      for (let i = 0; i < sequenceIndices.length; i++) {
        if (this.currentPlaybackId !== runId) return;
        
        const noteAbs = sequenceIndices[i];
        const noteName = NOTES[noteAbs % 12];
        const octave = Math.floor(noteAbs / 12);
        const fullNoteName = `${noteName}${octave}`;
        const startTime = this.ctx.currentTime;
        const currentBeatDuration = 60 / this.liveBpm;
        const currentNoteDuration = currentBeatDuration * noteBeats;
        
        if (onNoteChange) {
          onNoteChange({
            note: noteName,
            fullNote: fullNoteName,
            octave,
            isChord: false,
            index: i
          });
        }

        if (this.liveMetronome && i % 4 === 0) {
          this.playClickAt(startTime);
        }

        this.playPianoNoteAt(fullNoteName, startTime, currentNoteDuration, 1.0);
        await this.waitBeats(noteBeats, runId);
      }

      if (this.currentPlaybackId !== runId) return;
      
      // Pausa musical antes del acorde
      await this.waitBeats(0.8, runId);

      // --- ACORDES DE PIANO (Acompañamiento clásico de vocalización) ---
      
      // 1. Acorde de Tónica actual
      if (this.currentPlaybackId !== runId) return;
      const tonicNote = NOTES[currentRootAbs % 12];
      const tonicOctave = Math.floor(currentRootAbs / 12);
      const isMinor = scaleId.toLowerCase().includes('menor') || scaleId.toLowerCase().includes('dórica');
      
      if (onNoteChange) {
        onNoteChange({
          note: tonicNote,
          fullNote: `${tonicNote}${tonicOctave}`,
          octave: tonicOctave,
          isChord: true,
          chordName: `${tonicNote} ${isMinor ? 'm' : 'M'}`
        });
      }

      if (this.liveMetronome) this.playClickAt(this.ctx.currentTime);
      const chordDur1 = (60 / this.liveBpm) * 2.0;
      await this.playChord(currentRootAbs, scaleId, chordDur1, runId);
      await this.waitBeats(1.3, runId);

      if (this.currentPlaybackId !== runId) return;

      // 2. Acorde de Modulación (Siguiente semitono) si no es el último
      if (currentRootAbs < actEnd) {
        const nextRoot = currentRootAbs + 1;
        const nextNote = NOTES[nextRoot % 12];
        const nextOctave = Math.floor(nextRoot / 12);
        if (onNoteChange) {
          onNoteChange({
            note: nextNote,
            fullNote: `${nextNote}${nextOctave}`,
            octave: nextOctave,
            isChord: true,
            chordName: `Modulación a ${nextNote}`
          });
        }
        const chordDur2 = (60 / this.liveBpm) * 2.0;
        await this.playChord(nextRoot, scaleId, chordDur2, runId);
        await this.waitBeats(1.4, runId);
      }

      currentRootAbs++;
    }

    if (onNoteChange && this.currentPlaybackId === runId) {
      onNoteChange(null);
    }
  }
}

export const audioService = new PianoAudioService();
