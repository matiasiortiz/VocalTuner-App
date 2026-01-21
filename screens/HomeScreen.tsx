
import React, { useState, useEffect, useRef } from 'react';
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

  const isProcessingRef = useRef(false);

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
      audioService.stop();
      setIsPlaying(false);
      return; 
    }

    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      setIsPlaying(true);
      await new Promise(resolve => setTimeout(resolve, 50));
      const intervals = SCALE_INTERVALS[selectedScaleId] || SCALE_INTERVALS['Mayor'];
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
    } catch (error) {
      console.error("Error en reproducción:", error);
      setIsPlaying(false);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const ScaleButton: React.FC<{ label: string }> = ({ label }) => (
    <button 
      onClick={() => setSelectedScaleId(label)}
      className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-all active:scale-95 border whitespace-nowrap ${
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

      <div className="flex-1 px-4 lg:px-8 pb-48 pt-4">
        {/* Main Grid: Column for mobile, 2 columns for wider screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-screen-xl mx-auto">
          
          {/* Left Column: Scales and Notes */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col">
              <h2 className="text-gray-900 dark:text-white tracking-light text-[22px] font-bold leading-tight text-left pb-4">Selecciona una escala</h2>
              <div className="flex flex-col gap-6">
                {[
                  { title: "Escalas Básicas", list: ["Mayor", "Menor Natural", "Cromática"] },
                  { title: "Modales y Variaciones", list: ["Dórica", "Flamenca", "Flamenca 8va Descendente", "Aumentada"] },
                  { title: "Arpegios", list: ["Arpegio Mayor", "Arpegio Menor", "Arpegio Disminuido"] },
                  { title: "Estilos y Pentatónicas", list: ["Rossini", "Progresión por Terceras", "Rossini Arpeggio", "Pentatónica Mayor", "Pentatónica Menor", "Blues"] },
                ].map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h3 className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider ml-1 border-l-2 border-primary pl-2">{group.title}</h3>
                    <div className="flex flex-wrap gap-2 md:gap-3 custom-scrollbar-h overflow-x-auto md:overflow-visible pb-2">
                      {group.list.map(label => <ScaleButton key={label} label={label} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-gray-900 dark:text-white tracking-light text-[22px] font-bold leading-tight text-left pb-4">Elige la nota</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 lg:grid-cols-6 gap-3 w-full">
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
          </div>

          {/* Right Column: Config and Metronome */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col">
              <h2 className="text-gray-900 dark:text-white tracking-light text-[22px] font-bold leading-tight text-left pb-4">Configuración de Escala</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-2">Octava Inicial</label>
                  <div className="relative">
                    <select 
                      value={startOctave}
                      onChange={(e) => setStartOctave(Number(e.target.value))}
                      className="w-full h-12 rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base font-bold px-4 appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (<option key={num} value={num}>{num}</option>))}
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
                      {[1, 2, 3, 4, 5, 6].map(num => (<option key={num} value={num}>{num}</option>))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-xl">timer</span>
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-bold text-xl">Metrónomo</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isMetronomeOn}
                    onChange={() => setIsMetronomeOn(!isMetronomeOn)}
                  />
                  <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary/20 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-gray-500 dark:text-gray-400">Velocidad de Ensayo</span>
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-primary font-bold text-lg font-mono tracking-wider border border-primary/20">{bpm} BPM</div>
                </div>
                <div className="relative w-full h-8 flex items-center">
                  <input 
                    type="range" 
                    min="40" 
                    max="240" 
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary focus:outline-none focus:ring-0 z-10"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400 font-bold uppercase tracking-widest px-1">
                  <span>Lento</span>
                  <span>Moderato</span>
                  <span>Rápido</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-gradient-to-br from-primary/10 to-blue-500/5 dark:from-primary/20 dark:to-transparent rounded-2xl p-6 border border-primary/20 flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em]">Configuración Actual</span>
                <span className="text-xl text-gray-900 dark:text-white font-black tracking-tight">
                  {selectedNote} {selectedScaleId} 
                  <span className="text-primary font-normal mx-2">|</span> 
                  {startOctave}-{endOctave} Oct
                  <span className="text-primary font-normal mx-2">|</span> 
                  {bpm} BPM
                </span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-2xl">music_note</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button - Centered but adapted to width */}
      <div className="fixed bottom-[4.5rem] left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto shadow-2xl rounded-full overflow-hidden max-w-sm w-full mx-auto">
          <button 
            onClick={handleStart}
            className={`w-full h-16 font-black text-xl flex items-center justify-center gap-4 transition-all active:scale-[0.97] hover:brightness-110 border-2 ${
              isPlaying 
              ? 'bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
              : 'bg-primary text-white border-blue-400 shadow-[0_0_30px_rgba(19,91,236,0.5)]'
            }`}
          >
            <span className={`material-symbols-outlined text-4xl ${isPlaying ? '' : 'filled'}`}>
              {isPlaying ? 'stop' : 'play_circle'}
            </span>
            <span className="tracking-tight">{isPlaying ? 'Detener' : 'Comenzar Ensayo'}</span>
          </button>
        </div>
      </div>

      <BottomNav activeTab="home" />

    </div>
  );
};

export default HomeScreen;
