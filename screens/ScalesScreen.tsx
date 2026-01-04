
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { audioService } from '../services/audioService';
import { ScaleItem, RelativeNote, SequenceNote } from '../types';
import { NOTES } from '../constants';

const ScalesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [customScales, setCustomScales] = useState<ScaleItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [scaleToDelete, setScaleToDelete] = useState<string | null>(null);

  // Estados de configuración de reproducción
  const [selectedNote, setSelectedNote] = useState("C");
  const [startOctave, setStartOctave] = useState(3);
  const [endOctave, setEndOctave] = useState(4);
  const [bpm, setBpm] = useState(120);

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
    
    // Si ya se está reproduciendo ESTA escala, detenerla.
    if (playingId === scale.id) {
      audioService.stop();
      setPlayingId(null);
      return;
    }

    // Si se está reproduciendo OTRA, detenerla primero (audioService.play... lo hace, pero limpiamos estado)
    if (playingId) {
      audioService.stop();
    }

    setPlayingId(scale.id);

    // Si la escala tiene intervalos guardados (nueva versión), usamos la reproducción dinámica
    if (scale.relativeNotes && scale.relativeNotes.length > 0) {
      await audioService.playCustomElasticScale(
        selectedNote, 
        startOctave, 
        endOctave, 
        scale.relativeNotes,
        bpm
      );
    } 
    // Fallback para escalas antiguas
    else {
      const calculatedRelatives = calculateRelativesFromAbsolute(scale.notes);
      if (calculatedRelatives.length > 0) {
         await audioService.playCustomElasticScale(
          selectedNote, 
          startOctave, 
          endOctave, 
          calculatedRelatives,
          bpm
        );
      } else {
        await audioService.playSequence(scale.notes, bpm);
      }
    }
    
    setPlayingId(null);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioService.stop();
    setPlayingId(null);
  };

  // Helper para convertir escalas viejas a intervalos al vuelo si es necesario
  const calculateRelativesFromAbsolute = (notes: SequenceNote[]): RelativeNote[] => {
    if (!notes || notes.length === 0) return [];
    const getVal = (n: string) => {
       const m = n.match(/^([A-G][#]?)(-?\d+)$/);
       if (!m) return 0;
       return (parseInt(m[2]) * 12) + NOTES.indexOf(m[1]);
    };
    const rootVal = getVal(notes[0].note);
    return notes.map(n => ({
      interval: getVal(n.note) - rootVal,
      duration: n.duration
    }));
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

      {/* Controles de Configuración Global */}
      <div className="bg-[#111622] border-b border-gray-800 px-6 py-4 sticky top-0 z-[30] shadow-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuración de Reproducción</h3>
             <div className="flex gap-2">
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded font-bold">{selectedNote}{startOctave}-{selectedNote}{endOctave}</span>
                <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-1 rounded font-bold">{bpm} BPM</span>
             </div>
          </div>
          
          {/* Selectores de Nota y Octava */}
          <div className="grid grid-cols-3 gap-2">
             <div className="relative">
                <select 
                  value={selectedNote} 
                  onChange={(e) => setSelectedNote(e.target.value)}
                  className="w-full h-10 bg-[#1c2333] border border-gray-700 rounded-lg text-xs font-bold px-3 appearance-none outline-none focus:border-primary"
                >
                  {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><span className="material-symbols-outlined text-sm">expand_more</span></div>
             </div>

             <div className="relative">
                <select 
                  value={startOctave} 
                  onChange={(e) => setStartOctave(Number(e.target.value))}
                  className="w-full h-10 bg-[#1c2333] border border-gray-700 rounded-lg text-xs font-bold px-3 appearance-none outline-none focus:border-primary"
                >
                  {[2, 3, 4, 5].map(n => <option key={n} value={n}>Oct {n}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><span className="material-symbols-outlined text-sm">expand_more</span></div>
             </div>

             <div className="relative">
                <select 
                  value={endOctave} 
                  onChange={(e) => setEndOctave(Number(e.target.value))}
                  className="w-full h-10 bg-[#1c2333] border border-gray-700 rounded-lg text-xs font-bold px-3 appearance-none outline-none focus:border-primary"
                >
                  {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>Oct {n}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><span className="material-symbols-outlined text-sm">expand_more</span></div>
             </div>
          </div>

          {/* Selector de BPM */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between items-center px-1">
               <span className="text-[10px] text-gray-500 font-bold uppercase">Velocidad</span>
            </div>
            <div className="relative w-full h-6 flex items-center">
                <input 
                  type="range" 
                  min="40" 
                  max="240" 
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1c2333] rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none z-10"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, #135bec 0%, #135bec ${(bpm-40)/(240-40)*100}%, #1c2333 ${(bpm-40)/(240-40)*100}%, #1c2333 100%)` 
                  }}
                />
            </div>
          </div>
        </div>
      </div>

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
                className={`bg-[#1c2333] p-5 rounded-2xl border transition-all relative group overflow-hidden ${playingId === scale.id ? 'border-primary shadow-glow' : 'border-gray-800'}`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div 
                    onClick={(e) => playCustom(e, scale)}
                    className="flex items-center gap-4 flex-1 min-w-0 pr-2 cursor-pointer group/info"
                  >
                    <div className={`size-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${playingId === scale.id ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-primary/10 text-primary group-hover/info:bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-2xl pointer-events-none">
                        {playingId === scale.id ? 'stop' : 'play_arrow'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-bold text-base truncate pr-2 ${playingId === scale.id ? 'text-primary' : 'text-white'}`}>{scale.name}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{scale.notes.length} notas en patrón</p>
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
