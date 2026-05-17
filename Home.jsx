import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Settings, Target, Search, Terminal } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const modules = [
    { id: 'catalog', path: '/catalog', title: 'Catalogue Bash', desc: 'Dictionnaire interactif de commandes Linux avec syntaxe et exemples.', icon: BookOpen, color: 'text-blue-400', border: 'hover:border-blue-500/50' },
    { id: 'generator', path: '/generator', title: 'Générateur Interactif', desc: 'Construisez des commandes complexes (chmod, useradd) sans faire d\'erreur de syntaxe.', icon: Settings, color: 'text-emerald-400', border: 'hover:border-emerald-500/50' },
    { id: 'quiz', path: '/quiz', title: 'QCM & Entraînement', desc: 'Testez vos connaissances sur le terminal et validez vos acquis.', icon: Target, color: 'text-purple-400', border: 'hover:border-purple-500/50' },
    { id: 'reverse', path: '/reverse', title: 'Reverse Engineering', desc: 'Collez une commande Bash et laissez l\'outil vous expliquer chaque argument.', icon: Search, color: 'text-amber-400', border: 'hover:border-amber-500/50' },
  ];

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-300">
      
      {/* Héro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Terminal className="w-10 h-10 text-emerald-400" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-slate-100 mb-4 tracking-tight">Bienvenue sur <span className="text-emerald-400">~/Learn_Bash</span></h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          L'environnement d'apprentissage interactif conçu pour les administrateurs et techniciens systèmes. 
          Explorez, générez et maîtrisez la ligne de commande Linux.
        </p>
      </div>

      {/* Tuiles de Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <button key={mod.id} onClick={() => navigate(mod.path)} className={`text-left bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group ${mod.border}`}>
              <Icon className={`w-8 h-8 mb-4 ${mod.color} transition-transform group-hover:scale-110`} />
              <h3 className="text-xl font-bold text-slate-200 mb-2">{mod.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{mod.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}