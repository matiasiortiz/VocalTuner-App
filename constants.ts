
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const NOTE_FREQUENCIES: Record<string, number> = {
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
  "C6": 1046.50, "C#6": 1108.73, "D6": 1174.66, "D#6": 1244.51, "E6": 1318.51, "F6": 1396.91, "F#6": 1479.98, "G6": 1567.98, "G#6": 1661.22, "A6": 1760.00, "A#6": 1864.66, "B6": 1975.53
};

export const SCALE_INTERVALS: Record<string, number[]> = {
  'Mayor': [0, 2, 4, 5, 7, 9, 11, 12],
  'Menor': [0, 2, 3, 5, 7, 8, 10, 12],
  'Pentatónica Mayor': [0, 2, 4, 7, 9, 12],
  'Pentatónica Menor': [0, 3, 5, 7, 10, 12],
  'Cromática': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  'Blues': [0, 3, 5, 6, 7, 10, 12],
  'Flamenca': [0, 1, 4, 5, 7, 8, 10, 12]
};

export const VIDEOS = [
  { id: 1, title: "7 Consejos para cuidar tu VOZ y evitar lesiones", duration: "10:24", channel: "Canto a la Vida", views: "340K", videoId: "i-B71v7lR_w", thumbnail: "https://img.youtube.com/vi/i-B71v7lR_w/0.jpg" },
  { id: 2, title: "Alimentos prohibidos para cantantes", duration: "06:15", channel: "Vox Vocal Studio", views: "1.2M", videoId: "GjQ3T200TjE", thumbnail: "https://img.youtube.com/vi/GjQ3T200TjE/0.jpg" },
  { id: 3, title: "Cómo calentar la voz correctamente", duration: "12:50", channel: "Vocal Academy", views: "890K", videoId: "zV049X9vDsw", thumbnail: "https://img.youtube.com/vi/zV049X9vDsw/0.jpg" },
  { id: 4, title: "Ejercicios de relajación laríngea", duration: "08:33", channel: "Logopedia TV", views: "150K", videoId: "vWz_H-3j04U", thumbnail: "https://img.youtube.com/vi/vWz_H-3j04U/0.jpg" },
];
