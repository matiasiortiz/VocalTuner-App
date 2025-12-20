
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NOTE_FREQUENCIES } from '../constants';
import { audioService } from '../services/audioService';
import { DurationType, SequenceNote } from '../types';

const CreateScaleScreen: React.FC = () => {
  const navigate = useNavigate();
  const [scaleName, setScaleName] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('quarter');
  const [sequence, setSequence] = useState<SequenceNote[]>([]);

  const addNote = (note: string) => {
    const newItem: SequenceNote = { note, duration: selectedDuration };
    setSequence([...sequence, newItem]);
    const freq = NOTE_FREQUENCIES[note];
    if (freq) audioService.playNote(freq, 0.4);
  };

  const undo = () => {
    setSequence(prev => prev.slice(0, -1));
  };

  const clearAll = () => {
    setSequence([]);
  };

  const handleSave = () => {
    if (!scaleName.trim() || sequence.length === 0) {
      alert("Por favor, ingresa un nombre y al menos una nota.");
      return;
    }

    const savedScales = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
    const newScale = {
      id: Date.now().toString(),
      name: scaleName,
      notes: sequence,
      createdAt: Date.now()
    };
    
    localStorage.setItem('vocal_scales', JSON.stringify([...savedScales, newScale]));
    navigate('/scales');
  };

  const playSequence = async () => {
    const durMap: Record<DurationType, number> = { 'whole': 1.6, 'half': 0.8, 'quarter': 0.4, 'eighth': 0.2 };
    for (const item of sequence) {
      const freq = NOTE_FREQUENCIES[item.note];
      if (freq) {
        audioService.playNote(freq, durMap[item.duration]);
        await new Promise(r => setTimeout(r, durMap[item.duration] * 1000 + 50));
      }
    }
  };

  const durationLabels: Record<DurationType, string> = {
    whole: 'Redonda',
    half: 'Blanca',
    quarter: 'Negra',
    eighth: 'Corchea'
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark z-20 shrink-0">
        <button 
          onClick={() => navigate('/scales')}
          className="flex items-center justify-center size-10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
        <h1 className="text-lg font-bold leading-tight tracking-tight">Nueva Escala</h1>
        <button 
          onClick={handleSave}
          className="text-primary font-bold text-base px-2 py-1 hover:bg-primary/10 rounded-lg transition-colors"
        >
          Guardar
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-[300px]">
        <div className="px-5 py-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre</span>
            <input 
              value={scaleName}
              onChange={(e) => setScaleName(e.target.value)}
              className="w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" 
              placeholder="Ej. Escala Pentatónica en Do..." 
              type="text"
            />
          </label>
        </div>

        <div className="px-5 py-4">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 block">Duración de nota</span>
          <div className="flex p-1 bg-slate-200 dark:bg-[#1c1f27] rounded-xl">
            {(['whole', 'half', 'quarter', 'eighth'] as DurationType[]).map((dur) => (
              <label key={dur} className="flex-1 cursor-pointer">
                <input 
                  className="peer sr-only" 
                  name="duration" 
                  type="radio" 
                  checked={selectedDuration === dur}
                  onChange={() => setSelectedDuration(dur)}
                />
                <div className="h-9 flex items-center justify-center rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 peer-checked:bg-white dark:peer-checked:bg-surface-border peer-checked:text-primary peer-checked:shadow-sm transition-all text-center">
                  {durationLabels[dur]}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Secuencia</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">{sequence.length} Notas</span>
              <button onClick={clearAll} className="text-xs font-semibold text-red-500 hover:text-red-400">Borrar Todo</button>
            </div>
          </div>

          <div className="h-40 bg-slate-100 dark:bg-[#1c1f27] border border-slate-200 dark:border-surface-border rounded-2xl relative overflow-hidden flex items-center px-4 shadow-inner">
            <div className="absolute inset-0 flex flex-col justify-center gap-2 opacity-10 pointer-events-none px-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-px w-full bg-slate-900 dark:bg-white"></div>)}
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar w-full py-4 z-10 items-center">
              {sequence.length === 0 ? (
                <div className="w-full flex items-center justify-center">
                   <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                    <span className="material-symbols-outlined text-sm">add</span>
                  </div>
                </div>
              ) : (
                sequence.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-white dark:ring-[#101622]">
                      <span className="text-sm font-black tracking-tighter">{item.note}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{durationLabels[item.duration]}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">Toca el piano para agregar notas a la secuencia</p>
        </div>
      </main>

      {/* Piano Section */}
      <div className="absolute bottom-0 w-full bg-white dark:bg-[#151921] border-t border-slate-200 dark:border-surface-border shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-30 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-surface-border/50">
          <button onClick={playSequence} className="flex items-center gap-2 text-primary hover:text-blue-400 transition-colors">
            <span className="material-symbols-outlined fill-1 text-3xl">play_circle</span>
            <span className="text-sm font-black uppercase tracking-wider">Escuchar</span>
          </button>
          <div className="flex items-center gap-1">
            <button onClick={undo} className="size-10 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
              <span className="material-symbols-outlined text-[24px]">undo</span>
            </button>
            <button onClick={undo} className="size-10 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
              <span className="material-symbols-outlined text-[24px]">backspace</span>
            </button>
          </div>
        </div>

        <div className="relative h-56 w-full select-none bg-slate-900 overflow-hidden">
          <div className="flex h-full w-full">
            {['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'].map((note) => (
              <div key={note} onClick={() => addNote(note)} className="relative flex-1 bg-white border-r border-slate-300 rounded-b-xl cursor-pointer active:bg-slate-200 group">
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 pointer-events-none">{note}</span>
              </div>
            ))}
          </div>
          {[
            { note: 'C#4', left: '10%' }, { note: 'D#4', left: '24.5%' }, { note: 'F#4', left: '53%' }, { note: 'G#4', left: '67.5%' }, { note: 'A#4', left: '81.8%' }
          ].map((bk) => (
            <div key={bk.note} onClick={() => addNote(bk.note)} style={{ left: bk.left }} className="absolute top-0 w-[8.5%] h-[60%] bg-black border-x border-b border-slate-800 rounded-b-lg z-10 cursor-pointer shadow-xl active:bg-slate-800"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateScaleScreen;
