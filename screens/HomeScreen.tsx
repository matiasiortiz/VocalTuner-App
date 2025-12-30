
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NOTES, SCALE_INTERVALS } from '../constants';
import { audioService } from '../services/audioService';
import BottomNav from '../components/BottomNav';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Estado
  const [selectedScaleId, setSelectedScaleId] = useState<string>("Mayor");
  const [selectedNote, setSelectedNote] = useState("D");
  const [startOctave, setStartOctave] = useState(3);
  const [endOctave, setEndOctave] = useState(4);
  const [bpm, setBpm] = useState(120);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Inicialización de tema
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleStart = async () => {
    if (isPlaying) {
      // LOGICA DE STOP
      audioService.stop();
      setIsPlaying(false);
      return;
    }

    // LOGICA DE PLAY
    setIsPlaying(true);
    
    const intervals = SCALE_INTERVALS[selectedScaleId] || SCALE_INTERVALS['Mayor'];
    
    // playScale realiza la rutina completa de vocalización (modulación)
    await audioService.playScale(
      selectedNote, 
      startOctave, 
      endOctave, 
      intervals, 
      bpm, 
      isMetronomeOn,
      selectedScaleId
    );
    
    setIsPlaying(false);
  };

  const ScaleButton: React.FC<{ label: string }> = ({ label }) => (
    <button 
      onClick={() => setSelectedScaleId(label)}
      className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg pl-5 pr-5 transition-all active:scale-95 border whitespace-nowrap ${
        selectedScaleId === label 
          ? 'bg-primary text-white shadow-lg shadow-primary/20 border-transparent' 
          : 'bg-surface-light dark:bg-surface-dark text-gray-700 dark:text-white border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <span className="text-sm font-semibold leading-normal">{label}</span>
    </button>
  );

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden transition-colors duration-200">
      
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
        <h1 className="text-gray-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] flex-1">Vocalización</h1>
        <div className="flex w-12 items-center justify-end">
          <button 
            onClick={toggleDarkMode}
            className="flex max-w-[48px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 bg-transparent text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-48 pt-2">
        
        {/* Scales Selection */}
        <div className="flex flex-col mb-6">
          <h2 className="text-gray-900 dark:text-white tracking-light text-[22px] font-bold leading-tight text-left pb-3 pt-4">Selecciona una escala</h2>
          <div className="flex flex-col gap-4">
            
            <div>
              <h3 className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2 ml-1">Escalas Básicas</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                <ScaleButton label="Mayor" />
                <ScaleButton label="Menor Natural" />
                <ScaleButton label="Cromática" />
              </div>
            </div>

            <div>
              <h3 className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2 ml-1">Modales y Variaciones</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                <ScaleButton label="Dórica" />
                <ScaleButton label="Dórica Menor" />
                <ScaleButton label="Aumentada" />
              </div>
            </div>

            <div>
              <h3 className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2 ml-1">Arpegios</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                <ScaleButton label="Arpegio Mayor" />
                <ScaleButton label="Arpegio Menor" />
                <ScaleButton label="Arpegio Disminuido" />
              </div>
            </div>

            <div>
              <h3 className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2 ml-1">Estilos y Pentatónicas</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                <ScaleButton label="Rossini" />
                <ScaleButton label="Pentatónica Mayor" />
                <ScaleButton label="Pentatónica Menor" />
                <ScaleButton label="Blues" />
                <ScaleButton label="Flamenca" />
              </div>
            </div>

          </div>
        </div>

        {/* Note Selection */}
        <div className="flex flex-col mb-6">
          <h2 className="text-gray-900 dark:text-white tracking-light text-[22px] font-bold leading-tight text-left pb-3 pt-2">Elige la nota</h2>
          <div className="grid grid-cols-4 gap-3 w-full">
            {NOTES.map((note) => (
              <button
                key={note}
                onClick={() => {
                  setSelectedNote(note);
                  audioService.playNote(`${note}${startOctave}`, 0.3);
                }}
                className={`flex cursor-pointer items-center justify-center rounded-xl h-14 text-lg font-bold leading-normal transition-all active:scale-95 ${
                  selectedNote === note 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark' 
                  : 'bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-primary/50'
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Scale Config (Octaves - Numbers Only) */}
        <div className="flex flex-col mb-6">
          <h2 className="text-gray-900 dark:text-white tracking-light text-[22px] font-bold leading-tight text-left pb-3 pt-2">Configuración de Escala</h2>
          <div className="grid grid-cols-2 gap-4">
            
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Octava Inicial</label>
              <div className="relative">
                <select 
                  value={startOctave}
                  onChange={(e) => setStartOctave(Number(e.target.value))}
                  className="w-full h-12 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base font-bold px-4 appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Octava Final</label>
              <div className="relative">
                <select 
                  value={endOctave}
                  onChange={(e) => setEndOctave(Number(e.target.value))}
                  className="w-full h-12 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base font-bold px-4 appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Metronome Card */}
        <div className="flex flex-col mb-6">
          <div className="w-full bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">timer</span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold text-lg">Metrónomo</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isMetronomeOn}
                  onChange={() => setIsMetronomeOn(!isMetronomeOn)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Velocidad</span>
                <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-primary font-bold text-sm font-mono">{bpm} BPM</div>
              </div>
              <div className="relative w-full h-6 flex items-center">
                <input 
                  type="range" 
                  min="40" 
                  max="240" 
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary focus:outline-none focus:ring-0 z-10"
                />
                <div className="absolute w-full flex justify-between px-1 pointer-events-none">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-1 w-0.5 bg-gray-300 dark:bg-gray-600"></div>)}
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-medium uppercase tracking-wider px-1">
                <span>Largo</span>
                <span>Allegro</span>
                <span>Presto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Config Status */}
        <div className="mt-auto">
          <div className="w-full bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-4 flex items-center justify-between border border-gray-200 dark:border-gray-700/50">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Configuración actual</span>
              <span className="text-lg text-gray-900 dark:text-white font-bold">
                {selectedNote} {selectedScaleId} 
                <span className="text-gray-400 dark:text-gray-500 font-normal mx-1">•</span> 
                {startOctave}-{endOctave} 
                <span className="text-gray-400 dark:text-gray-500 font-normal mx-1">•</span> 
                {bpm}bpm
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">music_note</span>
            </div>
          </div>
        </div>

      </div>

      {/* Fixed Play/Stop Button - Elevado para no tapar el BottomNav */}
      <div className="fixed bottom-[4.5rem] left-0 right-0 p-4 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50">
        <button 
          onClick={handleStart}
          className={`w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.98] ${
            isPlaying 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
            : 'bg-primary hover:bg-blue-600 text-white shadow-primary/30'
          }`}
        >
          <span className={`material-symbols-outlined ${isPlaying ? '' : 'filled'}`}>
            {isPlaying ? 'stop' : 'play_arrow'}
          </span>
          <span>{isPlaying ? 'Detener' : 'Comenzar'}</span>
        </button>
      </div>

      <BottomNav activeTab="home" />

    </div>
  );
};

export default HomeScreen;
