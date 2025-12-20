
export interface ScaleItem {
  id: string;
  name: string;
  notes: SequenceNote[];
  createdAt: number;
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

export type ScaleType = 'Mayor' | 'Menor' | 'Pentatónica Mayor' | 'Pentatónica Menor' | 'Cromática' | 'Blues' | 'Flamenca';
export type DurationType = 'whole' | 'half' | 'quarter' | 'eighth';

export interface SequenceNote {
  note: string;
  duration: DurationType;
}
