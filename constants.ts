
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const NOTE_FREQUENCIES: Record<string, number> = {
  "C1": 32.70, "C#1": 34.65, "D1": 36.71, "D#1": 38.89, "E1": 41.20, "F1": 43.65, "F#1": 46.25, "G1": 49.00, "G#1": 51.91, "A1": 55.00, "A#1": 58.27, "B1": 61.74,
  "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
  "C6": 1046.50, "C#6": 1108.73, "D6": 1174.66, "D#6": 1244.51, "E6": 1318.51, "F6": 1396.91, "F#6": 1479.98, "G6": 1567.98, "G#6": 1661.22, "A6": 1760.00, "A#6": 1864.66, "B6": 1975.53
};

export const SCALE_INTERVALS: Record<string, number[]> = {
  // Básicas
  'Mayor': [0, 2, 4, 5, 7, 9, 11, 12],
  'Menor Natural': [0, 2, 3, 5, 7, 8, 10, 12],
  'Menor': [0, 2, 3, 5, 7, 8, 10, 12], // Legacy alias
  'Cromática': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  
  // Modales y Variaciones
  'Dórica': [0, 2, 3, 5, 7, 9, 10, 12],
  'Menor Armónica': [0, 2, 3, 5, 7, 8, 11, 12], // 7ma mayor (sensible)
  'Aumentada': [0, 3, 4, 7, 8, 11, 12],
  
  // Arpegios
  'Arpegio Mayor': [0, 4, 7, 12],
  'Arpegio Menor': [0, 3, 7, 12],
  'Arpegio Disminuido': [0, 3, 6, 9, 12],

  // Estilos y Agilidad
  // Patrón Rossini (13 notas):
  // UP: C(0)-E(4)-G(7)-C(12)-E(16)-G(19)
  // DOWN: F(17)-D(14)-B(11)-G(7)-F(5)-D(2)-C(0)
  'Rossini': [0, 4, 7, 12, 16, 19, 17, 14, 11, 7, 5, 2, 0],
  
  // Progresión por Terceras (Zig-Zag)
  // 0-4 (Do-Mi), 2-5 (Re-Fa), 4-7 (Mi-Sol), 5-9 (Fa-La), 
  // 7-11 (Sol-Si), 9-12 (La-Do), 11-14 (Si-Re), 12 (Do)
  'Progresión por Terceras': [0, 4, 2, 5, 4, 7, 5, 9, 7, 11, 9, 12, 11, 14, 12],

  'Pentatónica Mayor': [0, 2, 4, 7, 9, 12],
  'Pentatónica Menor': [0, 3, 5, 7, 10, 12],
  'Blues': [0, 3, 5, 6, 7, 10, 12],
  'Flamenca': [0, 1, 4, 5, 7, 8, 10, 12]
};

export const VIDEOS = [
  { id: 1, title: "7 Consejos para cuidar tu VOZ y evitar lesiones", duration: "10:24", channel: "Canto a la Vida", views: "340K", videoId: "i-B71v7lR_w", thumbnail: "https://img.youtube.com/vi/i-B71v7lR_w/0.jpg" },
  { id: 2, title: "Alimentos prohibidos para cantantes", duration: "06:15", channel: "Vox Vocal Studio", views: "1.2M", videoId: "GjQ3T200TjE", thumbnail: "https://img.youtube.com/vi/GjQ3T200TjE/0.jpg" },
  { id: 3, title: "Cómo calentar la voz correctamente", duration: "12:50", channel: "Vocal Academy", views: "890K", videoId: "zV049X9vDsw", thumbnail: "https://img.youtube.com/vi/zV049X9vDsw/0.jpg" },
  { id: 4, title: "Ejercicios de relajación laríngea", duration: "08:33", channel: "Logopedia TV", views: "150K", videoId: "vWz_H-3j04U", thumbnail: "https://img.youtube.com/vi/vWz_H-3j04U/0.jpg" },
];
