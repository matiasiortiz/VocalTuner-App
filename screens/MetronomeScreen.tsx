
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
    <div className="bg-[#0b0f17] font-display antialiased text-white h-screen flex flex-col relative w-full overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute top-[-10%] left-0 right-0 h-[50%] bg-gradient-to-b from-[#1a2542] to-transparent opacity-30 pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 z-10 max-w-screen-2xl mx-auto w-full shrink-0 h-[70px]">
        <button onClick={() => navigate(-1)} className="p-2 rounded-2xl active:bg-white/10 transition-colors hover:bg-white/5">
          <span className="material-symbols-outlined text-[28px]">arrow_back</span>
        </button>
        <h2 className="text-lg font-black tracking-tight uppercase">METRONOMO</h2>
        <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-2xl active:bg-white/10 transition-colors hover:bg-white/5">
          <span className="material-symbols-outlined text-[28px]">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-6 max-w-screen-2xl mx-auto pb-24 landscape:pb-4 md:pb-4 relative z-10 overflow-y-auto scrollbar-hide">
        
        {/* Container: Vertical Stack on Mobile Portrait, Row on Landscape/Desktop */}
        <div className="flex flex-col landscape:flex-row md:flex-row items-center justify-around landscape:justify-center md:justify-center gap-8 landscape:gap-12 md:gap-16 w-full min-h-full py-2">
          
          {/* LEFT COLUMN: Visual Pendulum */}
          {/* Dynamic Size: Reduced in landscape to avoid cutting off. Max heights added. */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="
              rotate-[-90deg]
              w-[70vw] h-[70vw] max-w-[280px] max-h-[280px]
              landscape:w-[35vh] landscape:h-[35vh] landscape:max-w-[280px] landscape:max-h-[280px]
              md:w-[340px] md:h-[340px] lg:w-[420px] lg:h-[420px]
              transition-all duration-300
            ">
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                fill="transparent"
                stroke="#1a2333"
                strokeWidth="8"
              />
              <circle
                cx="50%"
                cy="50%"
                r="46%"
                fill="transparent"
                stroke="#135bec"
                strokeWidth="8"
                strokeDasharray="1000"
                strokeDashoffset={isPlaying ? (1000 - (1000 * (beat + 1)) / (timeSignature === '4/4' ? 4 : timeSignature === '3/4' ? 3 : 6)) : 1000}
                className="transition-all duration-150 ease-out"
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 12px rgba(19, 91, 236, 0.8))' }}
              />
            </svg>

            {/* Inner Circle Content */}
            <div className="
              absolute inset-0 m-auto rounded-full bg-[#111622] border-[4px] border-[#1a2333] shadow-[0_0_60px_rgba(0,0,0,0.7)] 
              flex flex-col items-center justify-center z-10
              w-[62vw] h-[62vw] max-w-[250px] max-h-[250px]
              landscape:w-[30vh] landscape:h-[30vh] landscape:max-w-[240px] landscape:max-h-[240px]
              md:w-[300px] md:h-[300px] lg:w-[370px] lg:h-[370px]
            ">
              <h1 className="text-6xl landscape:text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none mb-1 drop-shadow-lg transition-all">
                {bpm}
              </h1>
              <p className="text-primary font-black text-[9px] landscape:text-[9px] md:text-xs tracking-[0.3em] uppercase opacity-90 text-center px-4">
                Beats Per Minute
              </p>
              
              {/* BPM Adjusters - Absolute relative to the inner circle */}
              <button 
                onClick={() => setBpm(b => Math.max(40, b - 1))}
                className="absolute left-[-15px] md:left-[-25px] size-10 md:size-14 rounded-full bg-[#1c2333] flex items-center justify-center active:scale-90 transition-transform shadow-2xl border-2 border-white/5 hover:bg-[#252c3c]"
              >
                <span className="material-symbols-outlined text-xl md:text-3xl">remove</span>
              </button>
              <button 
                onClick={() => setBpm(b => Math.min(220, b + 1))}
                className="absolute right-[-15px] md:right-[-25px] size-10 md:size-14 rounded-full bg-[#1c2333] flex items-center justify-center active:scale-90 transition-transform shadow-2xl border-2 border-white/5 hover:bg-[#252c3c]"
              >
                <span className="material-symbols-outlined text-xl md:text-3xl">add</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Controls Panel */}
          <div className="flex flex-col w-full max-w-md gap-6 landscape:gap-3 md:gap-8 justify-center landscape:items-stretch">
            
            {/* Slider & Nomenclature */}
            <div className="space-y-4 bg-[#111622]/50 p-4 rounded-3xl border border-white/5 landscape:border-0 landscape:bg-transparent landscape:p-0">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">Tempo</span>
                <span className="text-lg md:text-xl font-black text-primary uppercase tracking-widest drop-shadow-sm">{getTempoName(bpm)}</span>
              </div>

              <div className="w-full px-1">
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
                <div className="flex justify-between mt-2 text-[9px] font-black text-gray-600 tracking-[0.2em] uppercase">
                  <span>Adagio</span>
                  <span>Andante</span>
                  <span>Presto</span>
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="grid grid-cols-2 gap-3 w-full h-14 md:h-16">
              <button 
                onClick={handleTap}
                className="bg-[#111622] border-2 border-white/5 rounded-2xl flex items-center justify-center gap-2 active:bg-[#1a2333] transition-all shadow-lg hover:border-primary/20 hover:shadow-primary/5"
              >
                <span className="material-symbols-outlined text-primary text-2xl">back_hand</span>
                <span className="text-xs font-black tracking-[0.2em]">TAP</span>
              </button>
              
              <div className="bg-[#111622] border-2 border-white/5 rounded-2xl flex items-center p-1 shadow-lg">
                {(['4/4', '3/4', '6/8'] as TimeSignature[]).map((sig) => (
                  <button
                    key={sig}
                    onClick={() => setTimeSignature(sig)}
                    className={`flex-1 h-full rounded-xl text-[10px] md:text-xs font-black transition-all ${timeSignature === sig ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {sig}
                  </button>
                ))}
              </div>
            </div>

            {/* Play Button - Centered relative to controls column */}
            <div className="flex justify-center pt-2">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`size-20 landscape:size-14 md:size-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl ${isPlaying ? 'bg-white text-black' : 'bg-primary text-white shadow-primary/40'}`}
              >
                <span className="material-symbols-outlined text-[40px] landscape:text-[28px] md:text-[48px] filled">{isPlaying ? 'pause' : 'play_arrow'}</span>
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
