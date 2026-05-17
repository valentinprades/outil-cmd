import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, TerminalSquare, Hash, BookOpen } from 'lucide-react';
import commandsData from '../data/bashCommands.json';

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCmd, setSelectedCmd] = useState(commandsData[0]);
  const [copied, setCopied] = useState(false);

  // Moteur de recherche Fuzzy simple
  const filteredCommands = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase().trim();
    if (!lowerSearch) return commandsData;
    
    return commandsData.filter(cmd => 
      cmd.name.toLowerCase().includes(lowerSearch) ||
      cmd.description.toLowerCase().includes(lowerSearch) ||
      cmd.category.toLowerCase().includes(lowerSearch) ||
      (cmd.tags && cmd.tags.some(tag => tag.toLowerCase().includes(lowerSearch)))
    );
  }, [searchTerm]);

  // Fonction Copier avec retour visuel temporaire
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-300">
      
      {/* En-tête et Recherche */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" />
              Dictionnaire des Commandes
            </h2>
            <p className="text-slate-400 text-sm mt-1">Trouvez rapidement la syntaxe et les options d'une commande Bash.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-950 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-colors"
              placeholder="Rechercher (ex: droits, réseau, ls)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contenu divisé en deux colonnes */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Liste des commandes (Tags) */}
        <div className="w-full lg:w-1/3 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Résultats ({filteredCommands.length})</h3>
          <div className="flex flex-wrap gap-2">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.name}
                onClick={() => setSelectedCmd(cmd)}
                className={`px-3 py-1.5 rounded-md font-mono text-sm border transition-all duration-200 ${
                  selectedCmd?.name === cmd.name
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {cmd.name}
              </button>
            ))}
            {filteredCommands.length === 0 && (
              <p className="text-slate-500 text-sm italic">Aucune commande trouvée.</p>
            )}
          </div>
        </div>

        {/* Détails de la commande */}
        {selectedCmd && (
          <div className="w-full lg:w-2/3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="border-b border-slate-800 bg-slate-950/50 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-2">
                    <Hash className="w-3 h-3" />
                    {selectedCmd.category}
                  </div>
                  <h3 className="text-3xl font-bold font-mono text-emerald-400">{selectedCmd.name}</h3>
                  <p className="text-slate-300 mt-2 text-lg">{selectedCmd.description}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Détails
                </h4>
                <p className="text-slate-400 leading-relaxed">{selectedCmd.longDesc}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TerminalSquare className="w-4 h-4" /> Syntaxe & Exemple
                </h4>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-sm relative group">
                  <div className="text-slate-500 mb-2"># Syntaxe</div>
                  <div className="text-slate-300 mb-4">{selectedCmd.syntax}</div>
                  <div className="text-slate-500 mb-2"># Exemple</div>
                  <div className="text-emerald-300">{selectedCmd.example}</div>
                  
                  <button
                    onClick={() => handleCopy(selectedCmd.example)}
                    className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-md transition-colors border border-slate-700 flex items-center gap-2 text-xs font-sans opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Copier l'exemple"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? <span className="text-emerald-400">Copié !</span> : "Copier"}
                  </button>
                </div>
              </div>

              {selectedCmd.args && selectedCmd.args.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Arguments fréquents</h4>
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-800 w-1/4">Option</th>
                          <th className="px-4 py-3 border-b border-slate-800 w-3/4">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {selectedCmd.args.map((arg, idx) => (
                          <tr key={idx} className="bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-cyan-300">{arg.flag}</td>
                            <td className="px-4 py-3">{arg.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}