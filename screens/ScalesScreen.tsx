
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioService } from '../services/audioService';
import { ScaleItem, RelativeNote, SequenceNote } from '../types';
import { NOTES } from '../constants';
import BottomNav from '../components/BottomNav';

const ScalesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [customScales, setCustomScales] = useState<ScaleItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [scaleToDelete, setScaleToDelete] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState("C");
  const [startOctave, setStartOctave] = useState(3);
  const [endOctave, setEndOctave] = useState(4);
  const [bpm, setBpm] = useState(120);

  const loadScales = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
      if (Array.isArray(saved)) {
        const formatted = saved.map((s: any) => ({ ...s, id: s.id.toString() }));
        setCustomScales(formatted.sort((a: any, b: any) => b.createdAt - a.createdAt));
      }
    } catch (e) {
      console.error("Error loading scales", e);
      setCustomScales([]);
    }
  };

  useEffect(() => { loadScales(); }, []);

  const playCustom = async (e: React.MouseEvent, scale: ScaleItem) => {
    e.preventDefault(); e.stopPropagation();
    if (playingId === scale.id) { audioService.stop(); setPlayingId(null); return; }
    if (playingId) { audioService.stop(); }
    setPlayingId(scale.id);
    if (scale.relativeNotes && scale.relativeNotes.length > 0) {
      await audioService.playCustomElasticScale(selectedNote, startOctave, endOctave, scale.relativeNotes, bpm);
    } else {
      const calculatedRelatives = calculateRelativesFromAbsolute(scale.notes);
      if (calculatedRelatives.length > 0) {
         await audioService.playCustomElasticScale(selectedNote, startOctave, endOctave, calculatedRelatives, bpm);
      } else {
        await audioService.playSequence(scale.notes, bpm);
      }
    }
    setPlayingId(null);
  };

  const calculateRelativesFromAbsolute = (notes: SequenceNote[]): RelativeNote[] => {
    if (!notes || notes.length === 0) return [];
    const getVal = (n: string) => {
       const m = n.match(/^([A-G][#]?)(-?\d+)$/);
       if (!m) return 0;
       return (parseInt(m[2]) * 12) + NOTES.indexOf(m[1]);
    };
    const rootVal = getVal(notes[0].note);
    return notes.map(n => ({ interval: getVal(n.note) - rootVal, duration: n.duration }));
  };

  const requestDelete = (e: React.MouseEvent, id: string) => { e.preventDefault(); e.stopPropagation(); setScaleToDelete(id); };
  const confirmDelete = () => {
    if (!scaleToDelete) return;
    try {
      const saved = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
      const updated = saved.filter((s: any) => s.id.toString() !== scaleToDelete.toString());
      localStorage.setItem('vocal_scales', JSON.stringify(updated));
      const formattedUpdated = updated.map((s: any) => ({ ...s, id: s.id.toString() }));
      setCustomScales(formattedUpdated.sort((a: any, b: any) => b.createdAt - a.createdAt));
      setScaleToDelete(null);
    } catch (err) { console.error("Error al eliminar escala:", err); }
  };
  const editScale = (e: React.MouseEvent, id: string) => { e.preventDefault(); e.stopPropagation(); navigate(`/edit-scale/${id}`); };

  return (
    <div className="bg-[#0b0f17] text-white min-h-screen pb-40 w-full relative font-display">
      <header className="max-w-screen-2xl mx-auto px-6 lg:px-12 pt-10 pb-6 border-b border-gray-800 relative z-[20]">
        <h1 className="text-3xl font-black tracking-tight">Biblioteca Vocal</h1>
        <p className="text-gray-500 mt-2 font-medium">Gestiona y entrena con tus escalas personalizadas.</p>
      </header>
      
      <div className="bg-[#111622] border-b border-gray-800 px-6 lg:px-12 py-6 sticky top-0 z-[30] shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-6 max-w-screen-2xl mx-auto items-center">
          <div className="flex flex-col gap-1 w-full lg:w-1/4">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Configuración Maestro</h3>
             <div className="flex gap-3">
               <span className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg font-black border border-primary/30 uppercase tracking-tighter">
                 {selectedNote} {startOctave}-{endOctave} Oct
               </span>
               <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg font-black border border-gray-700 uppercase tracking-tighter">
                 {bpm} BPM
               </span>
             </div>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full lg:flex-1">
             <div className="relative">
               <select value={selectedNote} onChange={(e) => setSelectedNote(e.target.value)} className="w-full h-11 bg-[#1c2333] border border-gray-700 rounded-xl text-sm font-bold px-4 appearance-none outline-none focus:border-primary transition-all">
                 {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                 <span className="material-symbols-outlined text-sm">expand_more</span>
               </div>
             </div>
             <div className="relative">
               <select value={startOctave} onChange={(e) => setStartOctave(Number(e.target.value))} className="w-full h-11 bg-[#1c2333] border border-gray-700 rounded-xl text-sm font-bold px-4 appearance-none outline-none focus:border-primary transition-all">
                 {[2, 3, 4, 5].map(n => <option key={n} value={n}>Octava {n}</option>)}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                 <span className="material-symbols-outlined text-sm">expand_more</span>
               </div>
             </div>
             <div className="relative">
               <select value={endOctave} onChange={(e) => setEndOctave(Number(e.target.value))} className="w-full h-11 bg-[#1c2333] border border-gray-700 rounded-xl text-sm font-bold px-4 appearance-none outline-none focus:border-primary transition-all">
                 {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>Octava {n}</option>)}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                 <span className="material-symbols-outlined text-sm">expand_more</span>
               </div>
             </div>
             <div className="col-span-3 lg:col-span-1 flex items-center px-2">
               <input 
                type="range" min="40" max="240" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} 
                className="w-full h-2 bg-[#1c2333] rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none z-10" 
                style={{ backgroundImage: `linear-gradient(to right, #135bec 0%, #135bec ${(bpm-40)/(240-40)*100}%, #1c2333 ${(bpm-40)/(240-40)*100}%, #1c2333 100%)` }} 
               />
             </div>
          </div>
        </div>
      </div>

      <main className="px-6 lg:px-12 py-10 space-y-8 relative z-[10] max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">auto_stories</span>
            Mis Escalas Personalizadas
          </h2>
          <span className="text-xs text-gray-500 font-black uppercase tracking-[0.2em] bg-gray-800/50 px-3 py-1 rounded-full">{customScales.length} Ítems</span>
        </div>

        {customScales.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-white/[0.02] rounded-[40px] border-2 border-dashed border-gray-800">
            <span className="material-symbols-outlined text-7xl mb-6 opacity-20">music_off</span>
            <p className="text-lg font-bold text-gray-400 mb-8 max-w-xs">Tu biblioteca está vacía. Comienza creando tu primera rutina vocal.</p>
            <button type="button" onClick={() => navigate('/create-scale')} className="h-14 px-10 bg-primary text-white text-sm font-black rounded-2xl shadow-glow uppercase tracking-widest active:scale-95 transition-all hover:scale-105">Crear Nueva Escala</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {customScales.map(scale => (
              <div 
                key={scale.id} 
                className={`bg-[#1c2333] p-6 rounded-[32px] border-2 transition-all relative group overflow-hidden ${playingId === scale.id ? 'border-primary shadow-glow ring-4 ring-primary/10' : 'border-gray-800 hover:border-gray-700'}`}
              >
                <div className="flex flex-col gap-5 relative z-10">
                  <div onClick={(e) => playCustom(e, scale)} className="flex items-center gap-4 cursor-pointer group/info">
                    <div className={`size-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${playingId === scale.id ? 'bg-red-500 text-white shadow-xl shadow-red-500/30 rotate-3' : 'bg-primary/10 text-primary group-hover/info:bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-3xl pointer-events-none">{playingId === scale.id ? 'stop' : 'play_arrow'}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-black text-lg truncate leading-tight ${playingId === scale.id ? 'text-primary' : 'text-white'}`}>{scale.name}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{scale.notes.length} Pasos • Patrón Vocal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
                    <button type="button" onClick={(e) => editScale(e, scale.id)} className="flex-1 h-11 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-90 font-bold text-sm border border-blue-500/20">
                      <span className="material-symbols-outlined text-lg">edit</span>Editar
                    </button>
                    <button type="button" onClick={(e) => requestDelete(e, scale.id)} className="size-11 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all active:scale-90 border border-red-500/20">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Button (+) elevated */}
      <button 
        type="button" 
        onClick={() => navigate('/create-scale')} 
        className="fixed bottom-24 right-8 size-16 rounded-3xl bg-primary text-white shadow-glow flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[110] border-2 border-white/20"
      >
        <span className="material-symbols-outlined text-4xl">add</span>
      </button>

      {scaleToDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#161c27] rounded-[40px] p-10 shadow-2xl max-w-sm w-full border border-gray-700 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="size-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2 border-2 border-red-500/20">
                <span className="material-symbols-outlined text-5xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-2xl font-black mb-3 text-white tracking-tight">¿Eliminar Escala?</h3>
                <p className="text-gray-400 font-medium leading-relaxed">Esta acción es permanente. Perderás la secuencia configurada para este entrenamiento.</p>
              </div>
              <div className="flex flex-col gap-3 w-full mt-2">
                <button onClick={confirmDelete} className="w-full h-14 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all active:scale-95 uppercase tracking-widest text-xs">Confirmar Eliminación</button>
                <button onClick={() => setScaleToDelete(null)} className="w-full h-14 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
};

export default ScalesScreen;
