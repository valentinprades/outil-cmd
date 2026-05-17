import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const currentTab = location.pathname === '/' ? 'home' : location.pathname.replace('/', '');

  const navItems = [
    { path: '/', label: 'Accueil', icon: '🏠' },
    { path: '/catalog', label: 'Catalogue Bash', icon: '📚' },
    { path: '/generator', label: 'Générateur Interactif', icon: '⚡' },
    { path: '/quiz', label: 'QCM & Entraînement', icon: '🎯' },
    { path: '/reverse', label: 'Reverse Engineering', icon: '🔍' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-emerald-400">~/</span>Learn
            <span className="text-cyan-400 animate-pulse">_</span>
          </h1>
          <p className="text-xs text-slate-500 mt-2 font-mono">MVP BASH - v1.0.0</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-2">
            Modules Apprentissage
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* LIENS EXTERNES (Réseau de tes outils) */}
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Autres Outils
          </div>
          <div className="space-y-2">
            <a 
              href="https://outil-ad.tondomaine.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>🛡️</span> Outil AD (GPO)
            </a>
            <a 
              href="https://outil-cmd-old.tondomaine.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>🪟</span> Outil CMD (Legacy)
            </a>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center text-sm font-mono text-slate-400">
            <span className="text-emerald-400 mr-2">bash@learning:</span> 
            <span className="text-slate-500">~/{currentTab}</span>
            <span className="text-slate-600 ml-1">$</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-slate-800 rounded-full border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              Système Prêt
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT (Pages) */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto">
            
            {children}

          </div>
        </main>
      </div>

    </div>
  );
};

export default Layout;