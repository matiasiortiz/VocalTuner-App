
import React from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { HEALTH_TIPS } from '../constants';

const HealthScreen: React.FC = () => {
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
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Consejos expertos y cuidado clínico para tu voz.</p>
      </header>

      <main className="px-4 pt-6 space-y-8">
        
        {/* Intro Banner */}
        <section className="bg-surface-light dark:bg-surface-dark p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">medical_services</span>
            </div>
            <div>
              <h2 className="text-lg font-bold mb-1">Cuidado Profesional</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Tu voz es un instrumento biológico. Aquí encontrarás pautas basadas en la medicina foniátrica para mantenerla sana y potente.
              </p>
            </div>
          </div>
        </section>

        {/* Health Tips List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500">verified</span>
              Consejos Certificados
            </h2>
          </div>
          
          <div className="grid gap-5">
            {HEALTH_TIPS.map(tip => (
              <div 
                key={tip.id} 
                className="bg-white dark:bg-[#1c2333] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg">{tip.icon}</span>
                  </div>
                  <h3 className="text-base font-bold leading-tight">{tip.title}</h3>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {tip.content}
                </p>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fuente</span>
                  <a 
                    href={tip.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    {tip.source}
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Tips Section Footer */}
        <section className="bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-3xl p-6 border border-primary/20">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">info</span>
            Tip Rápido
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
            "Si tienes ronquera (disfonía) que dura más de 2 semanas sin un resfriado aparente, consulta inmediatamente a un otorrinolaringólogo."
          </p>
        </section>
      </main>

      <BottomNav activeTab="health" />
    </div>
  );
};

export default HealthScreen;
