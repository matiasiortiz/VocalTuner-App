
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { audioService } from '../services/audioService';
import { ScaleItem } from '../types';

const ScalesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [customScales, setCustomScales] = useState<ScaleItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
    setCustomScales(saved.sort((a: any, b: any) => b.createdAt - a.createdAt));
  }, []);

  const playCustom = async (scale: ScaleItem) => {
    if (playingId) return;
    setPlayingId(scale.id);
    await audioService.playSequence(scale.notes);
    setPlayingId(null);
  };

  const deleteScale = (id: string) => {
    if (window.confirm('¿Eliminar esta escala permanentemente?')) {
      const updated = customScales.filter(s => s.id !== id);
      setCustomScales(updated);
      localStorage.setItem('vocal_scales', JSON.stringify(updated));
    }
  };

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen pb-32 max-w-md mx-auto relative">
      <header className="px-6 pt-10 pb-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold tracking-tight">Biblioteca</h1>
        <p className="text-gray-500 mt-1">Gestiona tus escalas personalizadas aquí.</p>
      </header>

      <main className="px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_stories</span>
            Tus Creaciones
          </h2>
          <span className="text-xs text-gray-500 font-bold">{customScales.length} TOTAL</span>
        </div>

        {customScales.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white/5 rounded-3xl border-2 border-dashed border-gray-800">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">music_note</span>
            <p className="text-sm font-bold text-gray-400">No tienes escalas guardadas.</p>
            <button 
              onClick={() => navigate('/create-scale')}
              className="mt-6 h-11 px-6 bg-primary text-white text-xs font-bold rounded-xl"
            >
              CREAR NUEVA ESCALA
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {customScales.map(scale => (
              <div key={scale.id} className="bg-[#1c2333] p-5 rounded-2xl border border-gray-800 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary ${playingId === scale.id ? 'animate-pulse' : ''}`}>
                      <span className="material-symbols-outlined">piano</span>
                    </div>
                    <div>
                      <h3 className="font-bold">{scale.name}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{scale.notes.length} notas</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => playCustom(scale)}
                      className="size-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined">{playingId === scale.id ? 'graphic_eq' : 'play_arrow'}</span>
                    </button>
                    <button 
                      onClick={() => deleteScale(scale.id)}
                      className="size-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <button 
        onClick={() => navigate('/create-scale')}
        className="fixed bottom-24 right-6 size-16 rounded-full bg-primary text-white shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      <BottomNav activeTab="scales" />
    </div>
  );
};

export default ScalesScreen;
