
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

type TimeSignature = '4/4' | '3/4' | '6/8';

const MetronomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getTempoName = (currentBpm: number) => {
    if (currentBpm <= 60) return 'Largo';
    if (currentBpm <= 76) return 'Adagio';
    if (currentBpm <= 108) return 'Andante';
    if (currentBpm <= 120) return 'Moderato';
    if (currentBpm <= 156) return 'Allegro';
    if (currentBpm <= 176) return 'Vivace';
    return 'Presto';
  };

  const playClick = () => {
    if (isMuted) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const isFirstBeat = beat === 0;
    osc.frequency.setValueAtTime(isFirstBeat ? 1000 : 500, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  const handleTap = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4);
    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const newBpm = Math.round(60000 / averageInterval);
      if (newBpm >= 40 && newBpm <= 220) {
        setBpm(newBpm);
      }
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const beatsInCompas = timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6;
      const interval = (60 / bpm) * 1000;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setBeat(prev => (prev + 1) % beatsInCompas);
        playClick();
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setBeat(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, bpm, beat, timeSignature, isMuted]);

  return (
    <div className="bg-[#0b0f17] font-display antialiased text-white min-h-screen flex flex-col overflow-x-hidden relative pb-24 w-full">
      {/* Background Gradient Effect */}
      <div className="absolute top-[-10%] left-0 right-0 h-[50%] bg-gradient-to-b from-[#1a2542] to-transparent opacity-30 pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between p-6 z-10 max-w-screen-2xl mx-auto w-full">
        <button onClick={() => navigate(-1)} className="p-3 rounded-2xl active:bg-white/10 transition-colors hover:bg-white/5">
          <span className="material-symbols-outlined text-[32px]">arrow_back</span>
        </button>
        <h2 className="text-2xl font-black tracking-tight uppercase">Master Tempo</h2>
        <button onClick={() => setIsMuted(!isMuted)} className="p-3 rounded-2xl active:bg-white/10 transition-colors hover:bg-white/5">
          <span className="material-symbols-outlined text-[32px]">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full px-8 max-w-screen-2xl mx-auto gap-12 relative z-10">
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 w-full">
          
          {/* Visual Pendulum / Circle */}
          <div className="relative flex items-center justify-center">
            <svg className="absolute w-[320px] h-[320px] lg:w-[400px] lg:h-[400px] rotate-[-90deg]">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="transparent"
                stroke="#1a2333"
                strokeWidth="12"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="transparent"
                stroke="#135bec"
                strokeWidth="12"
                strokeDasharray="1000"
                strokeDashoffset={isPlaying ? (1000 - (1000 * (beat + 1)) / (timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6)) : 1000}
                className="transition-all duration-150 ease-out"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 12px rgba(19, 91, 236, 0.8))' }}
              />
            </svg>

            <div className="size-64 lg:size-80 rounded-full bg-[#111622] border-[6px] border-[#1a2333] shadow-[0_0_60px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center z-10 relative">
              <h1 className="text-9xl lg:text-[10rem] font-black tracking-tighter leading-none mb-3 drop-shadow-lg">{bpm}</h1>
              <p className="text-primary font-black text-sm tracking-[0.4em] uppercase opacity-80">Beats Per Minute</p>
              
              <button 
                onClick={() => setBpm(b => Math.max(40, b - 1))}
                className="absolute left-[-40px] lg:left-[-60px] size-16 lg:size-20 rounded-full bg-[#1c2333] flex items-center justify-center active:scale-90 transition-transform shadow-2xl border-2 border-white/5 hover:bg-[#252c3c]"
              >
                <span className="material-symbols-outlined text-4xl">remove</span>
              </button>
              <button 
                onClick={() => setBpm(b => Math.min(220, b + 1))}
                className="absolute right-[-40px] lg:right-[-60px] size-16 lg:size-20 rounded-full bg-[#1c2333] flex items-center justify-center active:scale-90 transition-transform shadow-2xl border-2 border-white/5 hover:bg-[#252c3c]"
              >
                <span className="material-symbols-outlined text-4xl">add</span>
              </button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="flex flex-col w-full max-w-md gap-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">Nomenclatura</span>
                <span className="text-xl font-black text-primary uppercase tracking-widest drop-shadow-sm">{getTempoName(bpm)}</span>
              </div>

              <div className="w-full px-2">
                <input 
                  type="range" 
                  min="40" max="220" 
                  value={bpm} 
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-3 bg-[#1c2333] rounded-full appearance-none cursor-pointer accent-primary"
                  style={{ 
                    background: `linear-gradient(to right, #135bec 0%, #135bec ${(bpm-40)/(220-40)*100}%, #1c2333 ${(bpm-40)/(220-40)*100}%, #1c2333 100%)` 
                  }}
                />
                <div className="flex justify-between mt-4 text-[11px] font-black text-gray-600 tracking-[0.2em] uppercase">
                  <span>Adagio</span>
                  <span>Andante</span>
                  <span>Presto</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full h-20">
              <button 
                onClick={handleTap}
                className="bg-[#111622] border-2 border-white/5 rounded-[28px] flex items-center justify-center gap-4 active:bg-[#1a2333] transition-all shadow-inner hover:border-primary/20"
              >
                <span className="material-symbols-outlined text-primary text-3xl">back_hand</span>
                <span className="text-sm font-black tracking-[0.2em]">TAP</span>
              </button>
              
              <div className="bg-[#111622] border-2 border-white/5 rounded-[28px] flex items-center p-2 shadow-inner overflow-hidden">
                {(['4/4', '3/4', '6/8'] as TimeSignature[]).map((sig) => (
                  <button
                    key={sig}
                    onClick={() => setTimeSignature(sig)}
                    className={`flex-1 h-full rounded-2xl text-[12px] font-black transition-all ${timeSignature === sig ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {sig}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`size-28 lg:size-32 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl ${isPlaying ? 'bg-white text-black' : 'bg-primary text-white shadow-primary/30'}`}
              >
                <span className="material-symbols-outlined text-[64px] filled">{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      <BottomNav activeTab="metronome" />
    </div>
  );
};

export default MetronomeScreen;
