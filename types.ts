
export interface ScaleItem {
  id: string;
  name: string;
  notes: SequenceNote[]; // Para visualización/edición (notas originales)
  relativeNotes?: RelativeNote[]; // Para reproducción dinámica (intervalos)
  createdAt: number;
}

export interface RelativeNote {
  interval: number; // Semitonos de distancia desde la raíz (0)
  duration: DurationType;
}

export interface VocalVideo {
  id: number;
  title: string;
  duration: string;
  channel: string;
  views: string;
  videoId: string;
  thumbnail: string;
}

export type ScaleType = 'Mayor' | 'Menor' | 'Pentatónica Mayor' | 'Pentatónica Menor' | 'Cromática' | 'Blues' | 'Flamenca' | 'Flamenca 8va Descendente';
export type DurationType = 'whole' | 'half' | 'quarter' | 'eighth';

export interface SequenceNote {
  note: string;
  duration: DurationType;
}
