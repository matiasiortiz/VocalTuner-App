import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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

const BottomNav: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Don't show nav on create/edit screens as they have their own bottom controls
  if (path.includes('create-scale') || path.includes('edit-scale')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-[#151b26] border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md bg-opacity-95 z-[1000] pb-safe">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center justify-around h-16 max-w-2xl mx-auto">
          <NavButton to="/" icon="home" label="Inicio" active={path === '/'} />
          <NavButton to="/scales" icon="library_music" label="Escalas" active={path === '/scales'} />
          <NavButton to="/metronome" icon="timer" label="Metrónomo" active={path === '/metronome'} />
          <NavButton to="/health" icon="health_and_safety" label="Salud" active={path === '/health'} />
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;