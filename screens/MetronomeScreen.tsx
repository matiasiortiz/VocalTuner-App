
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
    
    // Acentuar el primer tiempo según el compás
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
    <div className="bg-[#0b0f17] font-display antialiased text-white min-h-screen flex flex-col overflow-hidden relative pb-24 max-w-md mx-auto">
      {/* Background Gradient Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[#1a2542] to-transparent opacity-30 pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between p-6 z-10">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full active:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <h2 className="text-xl font-bold tracking-tight">Metrónomo</h2>
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full active:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-[28px]">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full px-8 gap-10 relative z-10 mt-[-20px]">
        {/* BPM Circle Area */}
        <div className="relative flex items-center justify-center w-full">
          {/* Circular Progress Arc (Pulse) */}
          <svg className="absolute w-[280px] h-[280px] rotate-[-90deg]">
            <circle
              cx="140"
              cy="140"
              r="125"
              fill="transparent"
              stroke="#1a2333"
              strokeWidth="8"
            />
            <circle
              cx="140"
              cy="140"
              r="125"
              fill="transparent"
              stroke="#135bec"
              strokeWidth="8"
              strokeDasharray="785"
              strokeDashoffset={isPlaying ? (785 - (785 * (beat + 1)) / (timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6)) : 785}
              className="transition-all duration-150 ease-out"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 8px rgba(19, 91, 236, 0.6))' }}
            />
          </svg>

          {/* Inner Circle Content */}
          <div className="size-60 rounded-full bg-[#111622] border-4 border-[#1a2333] shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center z-10 relative">
            <h1 className="text-8xl font-black tracking-tighter leading-none mb-2">{bpm}</h1>
            <p className="text-[#135bec] font-black text-xs tracking-[0.2em] uppercase">BPM</p>
            
            {/* Minus/Plus flanking the circle */}
            <button 
              onClick={() => setBpm(b => Math.max(40, b - 1))}
              className="absolute left-[-55px] size-14 rounded-full bg-[#1c2333] flex items-center justify-center active:scale-90 transition-transform shadow-lg border border-white/5"
            >
              <span className="material-symbols-outlined text-3xl">remove</span>
            </button>
            <button 
              onClick={() => setBpm(b => Math.min(220, b + 1))}
              className="absolute right-[-55px] size-14 rounded-full bg-[#1c2333] flex items-center justify-center active:scale-90 transition-transform shadow-lg border border-white/5"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
        </div>

        {/* Tempo Label */}
        <div className="w-full flex items-center justify-between px-2 mt-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tempo</span>
          <span className="text-sm font-bold text-[#135bec]">{getTempoName(bpm)}</span>
        </div>

        {/* Custom Range Slider */}
        <div className="w-full">
          <input 
            type="range" 
            min="40" max="220" 
            value={bpm} 
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-1.5 bg-[#1c2333] rounded-lg appearance-none cursor-pointer accent-[#135bec]"
            style={{ 
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #135bec 0%, #135bec ${(bpm-40)/(220-40)*100}%, #1c2333 ${(bpm-40)/(220-40)*100}%, #1c2333 100%)` 
            }}
          />
          <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-600 tracking-widest">
            <span>40</span>
            <span>130</span>
            <span>220</span>
          </div>
        </div>

        {/* Controls Grid (TAP & SIGNATURE) */}
        <div className="grid grid-cols-2 gap-4 w-full h-16">
          <button 
            onClick={handleTap}
            className="bg-[#111622] border border-white/5 rounded-2xl flex items-center justify-center gap-3 active:bg-[#1a2333] transition-colors shadow-inner"
          >
            <span className="material-symbols-outlined text-[#135bec]">back_hand</span>
            <span className="text-sm font-black tracking-widest">TAP</span>
          </button>
          
          <div className="bg-[#111622] border border-white/5 rounded-2xl flex items-center px-1 py-1 shadow-inner overflow-hidden">
            {(['4/4', '3/4', '6/8'] as TimeSignature[]).map((sig) => (
              <button
                key={sig}
                onClick={() => setTimeSignature(sig)}
                className={`flex-1 h-full rounded-xl text-[11px] font-black transition-all ${timeSignature === sig ? 'bg-[#1c2333] text-[#135bec]' : 'text-gray-500'}`}
              >
                {sig}
              </button>
            ))}
          </div>
        </div>

        {/* Big Play Toggle */}
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`size-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-[0_0_30px_rgba(19,91,236,0.3)] ${isPlaying ? 'bg-white text-black' : 'bg-[#135bec] text-white'}`}
        >
          <span className="material-symbols-outlined text-[48px] fill-1">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
      </main>

      <BottomNav activeTab="metronome" />

      {/* Custom Styles for Slider Thumb */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid #135bec;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        input[type=range]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 4px solid #135bec;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
};

export default MetronomeScreen;
