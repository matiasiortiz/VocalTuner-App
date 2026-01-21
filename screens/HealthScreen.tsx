
import React from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { HEALTH_TIPS } from '../constants';

const HealthScreen: React.FC = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-gray-100 antialiased overflow-x-hidden min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 pt-4 pb-3">
        <div className="max-w-screen-2xl mx-auto flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined text-[28px]">arrow_back</span>
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Salud Vocal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Guía profesional para el cuidado de tu instrumento biológico.</p>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 lg:px-12 pt-8 space-y-12">
        
        {/* Intro Banner: Side-by-side on large screens */}
        <section className="bg-surface-light dark:bg-surface-dark p-8 rounded-[40px] border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden relative">
          <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0 rotate-3 border-2 border-primary/20">
              <span className="material-symbols-outlined text-4xl">medical_services</span>
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-black mb-3">Cuidado Clínico & Profesional</h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Estas recomendaciones están basadas en prácticas de medicina foniátrica. Mantener hábitos saludables es tan importante como la técnica vocal para una carrera longeva.
              </p>
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        </section>

        {/* Health Tips List: Grid Layout */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <span className="material-symbols-outlined text-green-500 filled">verified</span>
              Pautas de Oro
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {HEALTH_TIPS.map(tip => (
              <div 
                key={tip.id} 
                className="bg-white dark:bg-[#1c2333] p-8 rounded-[32px] border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col h-full"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-2xl">{tip.icon}</span>
                  </div>
                  <h3 className="text-xl font-black leading-tight tracking-tight">{tip.title}</h3>
                </div>
                
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-8 flex-1">
                  {tip.content}
                </p>

                <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-6 mt-auto">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fuente Médica</span>
                  <a 
                    href={tip.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-black text-primary hover:underline hover:brightness-125 transition-all"
                  >
                    {tip.source}
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Quick Tip Box */}
        <section className="bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-[40px] p-8 border-2 border-primary/20 mb-12">
          <div className="flex items-start gap-6">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-md">
               <span className="material-symbols-outlined text-primary text-3xl filled">info</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight">Dato Crucial</h2>
              <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed italic font-medium">
                "La disfonía persistente por más de 15 días requiere revisión diagnóstica por un otorrinolaringólogo especialista en laringe."
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNav activeTab="health" />
    </div>
  );
};

export default HealthScreen;
