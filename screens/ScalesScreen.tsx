
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { audioService } from '../services/audioService';
import { ScaleItem } from '../types';

const ScalesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [customScales, setCustomScales] = useState<ScaleItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [scaleToDelete, setScaleToDelete] = useState<string | null>(null);

  const loadScales = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
      if (Array.isArray(saved)) {
        const formatted = saved.map((s: any) => ({
          ...s,
          id: s.id.toString()
        }));
        setCustomScales(formatted.sort((a: any, b: any) => b.createdAt - a.createdAt));
      }
    } catch (e) {
      console.error("Error loading scales", e);
      setCustomScales([]);
    }
  };

  useEffect(() => {
    loadScales();
  }, []);

  const playCustom = async (e: React.MouseEvent, scale: ScaleItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (playingId) return;
    setPlayingId(scale.id);
    await audioService.playSequence(scale.notes);
    setPlayingId(null);
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setScaleToDelete(id);
  };

  const confirmDelete = () => {
    if (!scaleToDelete) return;
    try {
      const saved = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
      const updated = saved.filter((s: any) => s.id.toString() !== scaleToDelete.toString());
      localStorage.setItem('vocal_scales', JSON.stringify(updated));
      
      const formattedUpdated = updated.map((s: any) => ({
        ...s,
        id: s.id.toString()
      }));
      setCustomScales(formattedUpdated.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setScaleToDelete(null);
    } catch (err) {
      console.error("Error al eliminar escala:", err);
    }
  };

  const editScale = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/edit-scale/${id}`);
  };

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen pb-32 max-w-md mx-auto relative font-display">
      <header className="px-6 pt-10 pb-6 border-b border-gray-800 relative z-[20]">
        <h1 className="text-3xl font-bold tracking-tight">Biblioteca</h1>
        <p className="text-gray-500 mt-1 italic text-sm">Gestiona tus escalas personalizadas aquí.</p>
      </header>

      <main className="px-6 py-8 space-y-6 relative z-[10]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_stories</span>
            Mis Escalas
          </h2>
          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{customScales.length} escalas</span>
        </div>

        {customScales.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white/5 rounded-3xl border-2 border-dashed border-gray-800">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-10">music_note</span>
            <p className="text-sm font-bold text-gray-500 mb-6">Aún no tienes escalas personalizadas.</p>
            <button 
              type="button"
              onClick={() => navigate('/create-scale')}
              className="h-12 px-8 bg-primary text-white text-xs font-black rounded-xl shadow-glow uppercase tracking-widest active:scale-95"
            >
              Crear Escala
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {customScales.map(scale => (
              <div 
                key={scale.id} 
                className="bg-[#1c2333] p-5 rounded-2xl border border-gray-800 relative group overflow-hidden"
              >
                <div className="flex items-center justify-between relative z-10">
                  <div 
                    onClick={(e) => playCustom(e, scale)}
                    className="flex items-center gap-4 flex-1 min-w-0 pr-2 cursor-pointer group/info"
                  >
                    <div className={`size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-all shrink-0 ${playingId === scale.id ? 'animate-pulse bg-primary text-white shadow-glow' : 'group-hover/info:bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-2xl pointer-events-none">
                        {playingId === scale.id ? 'graphic_eq' : 'play_arrow'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate pr-2">{scale.name}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{scale.notes.length} notas musicales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 relative z-[40]">
                    <button 
                      type="button"
                      onClick={(e) => editScale(e, scale.id)}
                      className="size-10 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-blue-500/20 cursor-pointer"
                      title="Editar"
                    >
                      <span className="material-symbols-outlined text-xl pointer-events-none">edit</span>
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => requestDelete(e, scale.id)}
                      className="size-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-red-500/20 cursor-pointer"
                      title="Eliminar"
                    >
                      <span className="material-symbols-outlined text-xl pointer-events-none">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <button 
        type="button"
        onClick={() => navigate('/create-scale')}
        className="fixed bottom-24 right-6 size-16 rounded-full bg-primary text-white shadow-glow flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[110]"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Delete Confirmation Modal */}
      {scaleToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#161c27] rounded-3xl p-6 shadow-2xl max-w-xs w-full border border-gray-700 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-1 border border-red-500/20">
                <span className="material-symbols-outlined text-3xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">¿Eliminar Escala?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">¿Estás seguro de que quieres eliminar permanentemente esta escala?</p>
              </div>
              <div className="flex gap-3 w-full mt-3">
                <button 
                  onClick={() => setScaleToDelete(null)}
                  className="flex-1 h-12 rounded-xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 h-12 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab="scales" />
    </div>
  );
};

export default ScalesScreen;
