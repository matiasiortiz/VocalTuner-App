
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MetronomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClick = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(beat === 0 ? 880 : 440, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = (60 / bpm) * 1000;
      timerRef.current = window.setInterval(() => {
        setBeat(prev => (prev + 1) % 4);
        playClick();
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setBeat(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, beat]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased text-slate-900 dark:text-white min-h-screen flex flex-col overflow-hidden relative pb-24">
      <header className="flex items-center justify-between p-4 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight">Metrónomo</h2>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full px-8 gap-12 relative z-10">
        {/* Visual Pulse */}
        <div className="relative flex items-center justify-center w-full">
          <div className={`absolute w-72 h-72 rounded-full border-4 border-primary/10 transition-all duration-300 ${isPlaying ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}></div>
          <div className="relative size-64 rounded-full border-[10px] border-surface-light dark:border-surface-dark bg-white dark:bg-[#1c2333] shadow-glow flex flex-col items-center justify-center z-10">
            <h1 className="text-8xl font-black tracking-tighter">{bpm}</h1>
            <p className="text-primary font-black text-xs tracking-[0.3em] uppercase mt-2">BPM / {['Moderato', 'Allegro', 'Presto'][bpm > 140 ? 2 : bpm > 100 ? 1 : 0]}</p>
            
            {/* Beat Indicators */}
            <div className="absolute -bottom-8 flex gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all duration-150 ${beat === i && isPlaying ? 'bg-primary scale-150 shadow-glow' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* BPM Controls */}
        <div className="w-full flex items-center gap-6">
          <button onClick={() => setBpm(b => Math.max(40, b - 1))} className="size-16 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-md border border-gray-100 dark:border-gray-800 flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-4xl">remove</span>
          </button>
          
          <div className="flex-1">
             <input 
                type="range" 
                min="40" max="220" 
                value={bpm} 
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Lento</span>
                <span>Presto</span>
              </div>
          </div>

          <button onClick={() => setBpm(b => Math.min(220, b + 1))} className="size-16 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-md border border-gray-100 dark:border-gray-800 flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-4xl">add</span>
          </button>
        </div>

        {/* Play Toggle */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`size-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl ${isPlaying ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white' : 'bg-primary text-white shadow-glow'}`}
        >
          <span className="material-symbols-outlined text-[56px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
      </main>

      <BottomNav activeTab="metronome" />
    </div>
  );
};

export default MetronomeScreen;
