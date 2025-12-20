
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { VIDEOS } from '../constants';

const HealthScreen: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 antialiased overflow-x-hidden min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
            <span className="material-symbols-outlined text-[28px]">arrow_back</span>
          </Link>
          <div className="flex gap-3">
            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined">favorite</span>
            </button>
            <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-black tracking-tight">Salud Vocal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recursos y consejos para el cuidado de tu instrumento.</p>
      </header>

      <main className="px-4 pt-6 space-y-8">
        {/* Video Player Section */}
        {activeVideo && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-primary/20 bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <button 
              onClick={() => setActiveVideo(null)}
              className="mt-3 w-full py-2 text-primary font-bold text-sm bg-primary/10 rounded-xl"
            >
              Cerrar Video
            </button>
          </section>
        )}

        {/* Featured Card */}
        {!activeVideo && (
           <section>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">local_fire_department</span>
              Lo más visto
            </h2>
            <div 
              onClick={() => setActiveVideo("vWz_H-3j04U")}
              className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-xl bg-surface-dark"
            >
              <div className="aspect-video w-full bg-gray-800 relative">
                <img 
                  alt="Featured Health" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" 
                  src="https://picsum.photos/seed/vocal-health/800/450"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-white text-[40px] ml-1">play_arrow</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20">
                  Video del Mes
                </div>
              </div>
              <div className="p-5 bg-white dark:bg-surface-dark">
                <h3 className="text-lg font-black leading-tight mb-2 line-clamp-2">Fundamentos de la Higiene Vocal: Qué hacer y qué evitar</h3>
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <img src="https://picsum.photos/seed/doctor/40/40" className="w-8 h-8 rounded-full" alt="channel" />
                  <span>Dr. Voz • 1.2M vistas</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Video List */}
        <section className="space-y-6">
          <h2 className="text-xl font-black">Biblioteca de Salud</h2>
          <div className="grid gap-6">
            {VIDEOS.map(video => (
              <div 
                key={video.id} 
                onClick={() => {
                  setActiveVideo(video.videoId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-4 group cursor-pointer bg-white dark:bg-surface-dark/40 p-3 rounded-2xl border border-transparent hover:border-primary/30 transition-all active:scale-[0.98]"
              >
                <div className="relative w-32 aspect-video shrink-0 rounded-xl overflow-hidden shadow-md">
                  <img src={video.thumbnail} className="w-full h-full object-cover" alt={video.title} />
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">{video.duration}</div>
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">play_circle</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{video.title}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-bold">{video.channel}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{video.views} reproducciones</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Tips Section */}
        <section className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-3xl p-6 border border-primary/20">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            Tip Rápido
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
            "Nunca fuerces la voz si sientes carraspera o fatiga. El silencio es el mejor ejercicio en momentos de cansancio vocal."
          </p>
        </section>
      </main>

      <BottomNav activeTab="health" />
    </div>
  );
};

export default HealthScreen;
