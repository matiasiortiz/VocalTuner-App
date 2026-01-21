
import React from 'react';
import { Link } from 'react-router-dom';

interface NavButtonProps {
  to: string;
  icon: string;
  label: string;
  active: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ to, icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${active ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-200'}`}
  >
    <span className={`material-symbols-outlined text-[24px] ${active ? 'fill-1' : ''}`}>{icon}</span>
    <span className="text-[10px] font-bold tracking-tight">{label}</span>
  </Link>
);

interface BottomNavProps {
  activeTab: 'home' | 'scales' | 'health' | 'metronome';
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-[#151b26] border-t border-slate-200 dark:border-slate-800 shadow-lg backdrop-blur-md bg-opacity-95">
    <div className="max-w-screen-2xl mx-auto px-4">
      <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
        <NavButton to="/" icon="home" label="Inicio" active={activeTab === 'home'} />
        <NavButton to="/scales" icon="library_music" label="Escalas" active={activeTab === 'scales'} />
        <NavButton to="/health" icon="health_and_safety" label="Salud" active={activeTab === 'health'} />
        <NavButton to="/metronome" icon="timer" label="Tempo" active={activeTab === 'metronome'} />
      </div>
      <div className="h-1.5 flex justify-center pb-2">
        <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
      </div>
    </div>
  </nav>
);

export default BottomNav;
