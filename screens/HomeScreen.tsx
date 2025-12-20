
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { NOTES, SCALE_INTERVALS } from '../constants';
import { audioService } from '../services/audioService';
import { ScaleType, ScaleItem } from '../types';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedScaleId, setSelectedScaleId] = useState<string>("Mayor");
  const [selectedNote, setSelectedNote] = useState("C");
  const [selectedOctave, setSelectedOctave] = useState("C4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [userScales, setUserScales] = useState<ScaleItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
    setUserScales(saved);

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

  const standardScales: ScaleType[] = ["Mayor", "Menor", "Pentatónica Mayor", "Pentatónica Menor", "Cromática", "Blues", "Flamenca"];

  const handleStart = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    const customScale = userScales.find(s => s.id === selectedScaleId);
    if (customScale) {
      await audioService.playSequence(customScale.notes);
    } else {
      const intervals = SCALE_INTERVALS[selectedScaleId as ScaleType];
      await audioService.playScale(selectedNote, selectedOctave, intervals, 110);
    }
    setIsPlaying(false);
  };

  const getDisplayScaleName = () => {
    const custom = userScales.find(s => s.id === selectedScaleId);
    return custom ? custom.name : `${selectedNote} ${selectedScaleId}`;
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-light dark:bg-[#0b0f17] text-slate-900 dark:text-white overflow-hidden max-w-md mx-auto transition-colors duration-300">
      <header className="flex items-center justify-between px-6 py-5 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">Vocalización</h1>
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white hover:scale-110 transition-all"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      {/* pb-[320px] para dejar espacio al panel fijo inferior que ahora es más alto */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-[340px] space-y-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Selecciona una escala</h2>
            <button 
              onClick={() => navigate('/create-scale')}
              className="text-primary text-xs font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span> NUEVA
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {standardScales.map(scale => (
              <button 
                key={scale}
                onClick={() => setSelectedScaleId(scale)}
                className={`h-11 px-3 rounded-xl text-xs font-bold transition-all border text-center leading-tight ${selectedScaleId === scale 
                  ? 'bg-primary border-transparent text-white shadow-glow' 
                  : 'bg-white dark:bg-[#1c2333] border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400'}`}
              >
                {scale}
              </button>
            ))}
            {userScales.map(scale => (
              <button 
                key={scale.id}
                onClick={() => setSelectedScaleId(scale.id)}
                className={`h-11 px-3 rounded-xl text-xs font-bold transition-all border text-center leading-tight truncate ${selectedScaleId === scale.id 
                  ? 'bg-primary border-transparent text-white shadow-glow' 
                  : 'bg-white dark:bg-[#1c2333] border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400'}`}
              >
                {scale.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">Elige la nota</h2>
          <div className="grid grid-cols-4 gap-3">
            {NOTES.map(note => (
              <button 
                key={note}
                onClick={() => {
                  setSelectedNote(note);
                  audioService.playNote(audioService.getNoteFrequency(note, selectedOctave), 0.3);
                }}
                className={`h-14 rounded-xl text-base font-bold transition-all flex items-center justify-center border-2 ${selectedNote === note 
                  ? 'bg-primary border-primary text-white shadow-glow' 
                  : 'bg-white dark:bg-[#1c2333] border-transparent text-slate-700 dark:text-white active:scale-95'}`}
              >
                {note}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">Octava del Piano</h2>
          <div className="bg-slate-200 dark:bg-[#1c2333] p-2 rounded-2xl border border-slate-300 dark:border-gray-800 grid grid-cols-4 gap-2">
            {['C3', 'C4', 'C5', 'C6'].map(oct => (
              <button 
                key={oct}
                onClick={() => {
                  setSelectedOctave(oct);
                  audioService.playNote(audioService.getNoteFrequency(selectedNote, oct), 0.3);
                }}
                className={`h-14 rounded-xl text-sm font-black transition-all flex items-center justify-center ${selectedOctave === oct
                  ? 'bg-primary text-white shadow-glow scale-[1.02]'
                  : 'bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border border-transparent dark:hover:border-gray-700'}`}
              >
                {oct}
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Panel Fijo Inferior - Reubicado debajo de la octava del piano en el orden visual */}
      <div className="fixed bottom-16 left-0 right-0 px-5 pt-4 pb-6 bg-gradient-to-t from-background-light dark:from-[#0b0f17] via-background-light dark:via-[#0b0f17] to-transparent z-[60] max-w-md mx-auto">
        <div className="bg-white dark:bg-[#161c27] rounded-2xl p-4 border border-slate-200 dark:border-gray-800 mb-4 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Configuración Actual</p>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {getDisplayScaleName()} <span className="text-slate-300 dark:text-gray-500 mx-1">•</span> {selectedOctave}
            </h3>
          </div>
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined fill-1">music_note</span>
          </div>
        </div>

        <button 
          onClick={handleStart}
          disabled={isPlaying}
          className={`w-full h-14 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_8px_25px_rgba(19,91,236,0.4)] ${isPlaying ? 'opacity-70' : ''}`}
        >
          <span className="material-symbols-outlined fill-1">{isPlaying ? 'graphic_eq' : 'play_arrow'}</span>
          <span className="text-base tracking-wide uppercase">{isPlaying ? 'Tocando...' : 'Comenzar'}</span>
        </button>
      </div>

      <BottomNav activeTab="home" />
    </div>
  );
};

export default HomeScreen;
