
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { audioService } from '../services/audioService';
import { DurationType, SequenceNote, RelativeNote } from '../types';
import { NOTES } from '../constants';
import BottomNav from '../components/BottomNav';

const CreateScaleScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [scaleName, setScaleName] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('quarter');
  const [sequence, setSequence] = useState<SequenceNote[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  
  const [currentOctave, setCurrentOctave] = useState<number>(4);

  useEffect(() => {
    if (id) {
      try {
        const savedScales = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
        const scaleToEdit = savedScales.find((s: any) => s.id.toString() === id.toString());
        if (scaleToEdit) {
          setScaleName(scaleToEdit.name);
          setSequence(scaleToEdit.notes);
        } else {
          navigate('/scales');
        }
      } catch (e) {
        console.error("Error loading scale to edit", e);
        navigate('/scales');
      }
    }
  }, [id, navigate]);

  const addNote = (note: string) => {
    const newItem: SequenceNote = { note, duration: selectedDuration };
    setSequence([...sequence, newItem]);
    audioService.playNote(note, 0.4);
  };

  const undo = () => {
    setSequence(prev => prev.slice(0, -1));
  };

  const requestClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowClearModal(true);
  };

  const confirmClear = () => {
    setSequence([]);
    setShowClearModal(false);
  };

  const getNoteValue = (noteStr: string): number => {
    const match = noteStr.match(/^([A-G][#]?)(-?\d+)$/);
    if (!match) return 0;
    const [_, name, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteIndex = NOTES.indexOf(name);
    return (octave * 12) + noteIndex;
  };

  const handleSave = () => {
    if (!scaleName.trim()) {
      alert("Por favor, ingresa un nombre para la escala.");
      return;
    }
    if (sequence.length === 0) {
      alert("Por favor, añade al menos una nota.");
      return;
    }

    const rootNoteValue = getNoteValue(sequence[0].note);
    const relativeNotes: RelativeNote[] = sequence.map(s => ({
      interval: getNoteValue(s.note) - rootNoteValue,
      duration: s.duration
    }));

    try {
      const savedScales = JSON.parse(localStorage.getItem('vocal_scales') || '[]');
      if (id) {
        const updatedScales = savedScales.map((s: any) => 
          s.id.toString() === id.toString() ? { 
            ...s, 
            name: scaleName, 
            notes: sequence, 
            relativeNotes: relativeNotes 
          } : s
        );
        localStorage.setItem('vocal_scales', JSON.stringify(updatedScales));
      } else {
        const newScale = {
          id: Date.now().toString(),
          name: scaleName,
          notes: sequence,
          relativeNotes: relativeNotes,
          createdAt: Date.now()
        };
        localStorage.setItem('vocal_scales', JSON.stringify([...savedScales, newScale]));
      }
      navigate('/scales');
    } catch (e) {
      console.error("Error saving scale", e);
    }
  };

  const playSequence = async () => {
    if (sequence.length === 0) return;
    await audioService.playSequence(sequence, 120);
  };

  const durationLabels: Record<DurationType, string> = {
    whole: 'Redonda',
    half: 'Blanca',
    quarter: 'Negra',
    eighth: 'Corchea'
  };

  const baseNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const whiteKeys = [
    ...baseNotes.map(n => `${n}${currentOctave}`),
    `C${currentOctave + 1}`
  ];

  const blackKeysConfig = [
    { noteBase: 'C#', left: '8.5%' },
    { noteBase: 'D#', left: '21%' },
    { noteBase: 'F#', left: '46%' },
    { noteBase: 'G#', left: '58.5%' },
    { noteBase: 'A#', left: '71%' }
  ];

  return (
    <div className="relative flex h-[100dvh] w-full flex-col md:flex-row overflow-hidden bg-[#0b0f17] shadow-2xl text-white font-display">
      
      {/* SECTION 1: Config & List (Right on Desktop, Top on Mobile) */}
      <div className="flex-1 flex flex-col h-full order-1 md:order-2 overflow-hidden relative z-10 md:border-l md:border-gray-800">
        <header className="flex items-center justify-between p-4 shrink-0 bg-[#0b0f17] border-b border-white/5">
            <button 
            type="button"
            onClick={() => navigate('/scales')}
            className="flex items-center justify-center size-12 text-slate-400 hover:text-white transition-colors active:scale-90 cursor-pointer"
            aria-label="Cerrar"
            >
            <span className="material-symbols-outlined text-[36px] pointer-events-none">close</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight">{id ? 'Editar Escala' : 'Nueva Escala'}</h1>
            <button 
            type="button"
            onClick={handleSave}
            className="bg-primary px-5 h-10 rounded-xl text-white font-black text-xs uppercase tracking-widest active:scale-95 shadow-glow cursor-pointer"
            >
            {id ? 'Listo' : 'Guardar'}</button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-[450px] md:pb-24 px-5 pt-6">
            <div className="mb-6">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Nombre</label>
            <input 
                value={scaleName}
                onChange={(e) => setScaleName(e.target.value)}
                className="w-full bg-[#161c27] border border-gray-800 rounded-2xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
                placeholder="Ej. Mi Escala..." 
            />
            </div>

            <div className="mb-8">
            <span className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Duración</span>
            <div className="flex p-1.5 bg-[#1c1f27] rounded-2xl">
                {(['whole', 'half', 'quarter', 'eighth'] as DurationType[]).map((dur) => (
                <button 
                    key={dur}
                    type="button"
                    onClick={() => setSelectedDuration(dur)}
                    className={`flex-1 h-11 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${selectedDuration === dur ? 'bg-[#32394a] text-primary shadow-xl ring-1 ring-white/5' : 'text-slate-600'}`}
                >
                    {durationLabels[dur]}
                </button>
                ))}
            </div>
            </div>

            <div className="mb-2 flex items-center justify-between relative z-[100]">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Secuencia Visual</h3>
            <div className="flex items-center gap-3">
                <span className="text-[10px] text-primary font-black uppercase bg-primary/10 px-2 py-0.5 rounded-full">{sequence.length} Notas</span>
                {sequence.length > 0 && (
                <button 
                    type="button" 
                    onClick={requestClear} 
                    className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-90 cursor-pointer pointer-events-auto transition-all"
                >
                    Limpiar
                </button>
                )}
            </div>
            </div>

            <div className="h-44 bg-[#111620] border border-gray-800 rounded-3xl relative overflow-hidden flex items-center px-4 shadow-inner mt-4">
            <div className="absolute inset-0 flex flex-col justify-center gap-[12px] opacity-10 pointer-events-none px-6">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-[1.5px] w-full bg-white"></div>)}
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar w-full py-6 z-10 items-center">
                {sequence.length === 0 ? (
                <div className="w-full text-center flex flex-col items-center gap-2 opacity-30">
                    <span className="material-symbols-outlined text-4xl">music_note</span>
                    <span className="text-[10px] font-black uppercase">Toca el piano para añadir notas</span>
                </div>
                ) : (
                sequence.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-3 shrink-0">
                    <div className={`size-14 rounded-full flex items-center justify-center shadow-2xl ring-4 ${idx === sequence.length - 1 ? 'bg-primary ring-primary/20 scale-110' : 'bg-[#32394a] ring-white/5'}`}>
                        <span className="text-sm font-black text-white">{item.note}</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase">{durationLabels[item.duration].slice(0, 3)}</span>
                    </div>
                ))
                )}
            </div>
            </div>
        </main>
      </div>

      {/* SECTION 2: Piano & Controls (Left on Desktop, Bottom on Mobile) */}
      <div className="absolute bottom-16 w-full md:static md:w-5/12 lg:w-4/12 md:bottom-auto md:h-full bg-[#151921] border-t md:border-t-0 md:border-r border-gray-800 shadow-[0_-15px_40px_rgba(0,0,0,0.6)] md:shadow-none z-30 flex flex-col order-2 md:order-1 pointer-events-auto justify-end md:justify-center">
        
        {/* Controls Bar */}
        <div className="flex items-center justify-between px-4 py-4 gap-2 md:mb-4">
          <button 
            type="button"
            onClick={playSequence} 
            disabled={sequence.length === 0}
            className={`flex items-center gap-2 active:scale-95 transition-all shrink-0 ${sequence.length === 0 ? 'opacity-20 grayscale' : 'text-primary'}`}
          >
            <span className="material-symbols-outlined fill-1 text-[36px] pointer-events-none">play_circle</span>
          </button>

          <div className="flex items-center justify-center gap-1 bg-[#0b0f17] p-1 rounded-xl border border-white/5">
            {[3, 4, 5].map(oct => (
              <button
                key={oct}
                onClick={() => setCurrentOctave(oct)}
                className={`h-8 w-10 rounded-lg text-[10px] font-black transition-all ${
                  currentOctave === oct 
                    ? 'bg-primary text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                C{oct}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button 
              type="button"
              onClick={undo} 
              disabled={sequence.length === 0}
              className={`text-slate-500 active:text-white transition-all ${sequence.length === 0 ? 'opacity-20' : 'active:scale-90'} cursor-pointer`}
            >
              <span className="material-symbols-outlined text-[28px] pointer-events-none">undo</span>
            </button>
            <button 
              type="button"
              onClick={undo}
              disabled={sequence.length === 0}
              className={`text-slate-500 active:text-white transition-all ${sequence.length === 0 ? 'opacity-20' : 'active:scale-90'} cursor-pointer`}
            >
              <span className="material-symbols-outlined text-[28px] pointer-events-none">backspace</span>
            </button>
          </div>
        </div>

        {/* Piano Keys */}
        <div className="relative h-64 md:h-80 w-full select-none bg-[#101622] flex border-t border-white/5">
          {whiteKeys.map((note) => (
            <div 
              key={note} 
              onClick={() => addNote(note)} 
              className="relative flex-1 bg-white border-r border-slate-300 rounded-b-2xl active:bg-slate-200 cursor-pointer shadow-inner"
            >
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">{note}</span>
            </div>
          ))}
          {blackKeysConfig.map((bk) => {
            const noteName = `${bk.noteBase}${currentOctave}`;
            return (
              <div 
                key={noteName} 
                onClick={() => addNote(noteName)} 
                style={{ left: bk.left }} 
                className="absolute top-0 w-[10%] h-[55%] bg-[#1a1f2b] border border-black rounded-b-xl z-10 active:bg-slate-800 shadow-2xl cursor-pointer"
              ></div>
            );
          })}
        </div>
      </div>

      {/* Force z-index to ensure visibility over the absolute piano panel */}
      <div className="relative z-[1000]">
        <BottomNav activeTab="scales" />
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#161c27] rounded-3xl p-6 shadow-2xl max-w-xs w-full border border-gray-700 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="size-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 mb-1 border border-orange-500/20">
                <span className="material-symbols-outlined text-3xl">cleaning_services</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">¿Limpiar Notas?</h3>
                <p className="text-sm text-gray-400 leading-relaxed">¿Deseas borrar toda la secuencia de notas actual?</p>
              </div>
              <div className="flex gap-3 w-full mt-3">
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 h-12 rounded-xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmClear}
                  className="flex-1 h-12 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition-all active:scale-95"
                >
                  Borrar Todo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateScaleScreen;
