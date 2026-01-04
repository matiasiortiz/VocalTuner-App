
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
  'Flamenca': [0, 2, 3, 5, 7, 8, 11, 12], // Renamed from Menor Armónica
  'Flamenca 8va Descendente': [0, 12, 11, 8, 7, 5, 3, 2, 0],
  'Aumentada': [0, 3, 4, 7, 8, 11, 12],
  
  // Arpegios
  'Arpegio Mayor': [0, 4, 7, 12],
  'Arpegio Menor': [0, 3, 7, 12],
  'Arpegio Disminuido': [0, 3, 6, 9, 12],

  // Estilos y Agilidad
  'Rossini': [0, 4, 7, 12, 16, 19, 17, 14, 11, 7, 5, 2, 0],
  'Progresión por Terceras': [0, 4, 2, 5, 4, 7, 5, 9, 7, 11, 9, 12, 11, 14, 12],
  'Rossini Arpeggio': [0, 4, 7, 11, 12], 
  'Pentatónica Mayor': [0, 2, 4, 7, 9, 12],
  'Pentatónica Menor': [0, 3, 5, 7, 10, 12],
  'Blues': [0, 3, 5, 6, 7, 10, 12],
};

export const HEALTH_TIPS = [
  { 
    id: 1, 
    title: "Hidratación Inteligente", 
    icon: "water_drop",
    content: "Las cuerdas vocales vibran mejor cuando están bien lubricadas. Bebe agua a lo largo del día, no solo durante el ensayo. Evita bebidas muy frías o muy calientes justo antes de cantar.",
    source: "NIDCD (Instituto Nacional de la Sordera)",
    sourceUrl: "https://www.nidcd.nih.gov/health/taking-care-your-voice"
  },
  { 
    id: 2, 
    title: "Descanso Vocal (Vocal Naps)", 
    icon: "bedtime",
    content: "Al igual que los atletas, las cuerdas vocales necesitan recuperación. Si has cantado mucho, intenta periodos de 15-20 minutos de silencio total para reducir la inflamación.",
    source: "Duke Health Voice Care Center",
    sourceUrl: "https://www.dukehealth.org/blog/9-tips-keep-your-voice-healthy"
  },
  { 
    id: 3, 
    title: "Evita el Carraspeo", 
    icon: "do_not_touch",
    content: "Carraspear golpea violentamente las cuerdas vocales. Si sientes flema, bebe un sorbo de agua, traga con fuerza o realiza un sonido de 'h' suave y aireada para limpiar la zona.",
    source: "Texas Voice Center",
    sourceUrl: "https://www.texasvoicecenter.com/advice.html"
  },
  { 
    id: 4, 
    title: "Calentamiento Obligatorio", 
    icon: "self_improvement",
    content: "Nunca cantes 'en frío'. Realiza ejercicios suaves de labios (lip trills) o sirenas suaves para aumentar el flujo sanguíneo a la laringe antes de exigir potencia.",
    source: "British Voice Association",
    sourceUrl: "https://www.britishvoiceassociation.org.uk/"
  },
  { 
    id: 5, 
    title: "Reflujo y Alimentación", 
    icon: "restaurant",
    content: "El reflujo gastroesofágico puede quemar las cuerdas vocales durante la noche. Evita comer 3 horas antes de dormir y alimentos muy ácidos o picantes si eres propenso.",
    source: "Cleveland Clinic",
    sourceUrl: "https://my.clevelandclinic.org/health/diseases/15024-laryngopharyngeal-reflux-lpr"
  }
];
