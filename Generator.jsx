import React, { useState } from 'react';
import { Settings, Shield, UserPlus, Check, Copy } from 'lucide-react';

export default function Generator() {
  const [activeTab, setActiveTab] = useState('chmod');
  const [copied, setCopied] = useState(false);

  // --- STATE CHMOD ---
  const [fileName, setFileName] = useState('script.sh');
  const [recursive, setRecursive] = useState(false);
  const [perms, setPerms] = useState({
    owner: { r: true, w: true, x: true },
    group: { r: true, w: false, x: true },
    others: { r: true, w: false, x: true }
  });

  // Calcul du chmod
  const calcValue = (entity) => {
    let val = 0;
    if (entity.r) val += 4;
    if (entity.w) val += 2;
    if (entity.x) val += 1;
    return val;
  };

  const ownerVal = calcValue(perms.owner);
  const groupVal = calcValue(perms.group);
  const othersVal = calcValue(perms.others);
  const chmodNum = `${ownerVal}${groupVal}${othersVal}`;
  
  const finalCommand = `chmod ${recursive ? '-R ' : ''}${chmodNum} ${fileName || 'fichier'}`;

  // Explanations text
  const getExplanations = (val) => {
    const parts = [];
    if (val >= 4) { parts.push("4 (Lecture)"); val -= 4; }
    if (val >= 2) { parts.push("2 (Écriture)"); val -= 2; }
    if (val === 1) { parts.push("1 (Exé.)"); }
    return parts.length ? parts.join(" + ") : "0 (Aucun droit)";
  };

  const handlePermChange = (role, type) => {
    setPerms(prev => ({
      ...prev,
      [role]: { ...prev[role], [type]: !prev[role][type] }
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(finalCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-300">
      
      {/* En-tête avec onglets */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 justify-between md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-400" />
              Générateur Interactif
            </h2>
            <p className="text-slate-400 text-sm mt-1">Construisez vos commandes sans vous tromper dans la syntaxe.</p>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button onClick={() => setActiveTab('chmod')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'chmod' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <Shield className="w-4 h-4" /> chmod
            </button>
            <button onClick={() => setActiveTab('useradd')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'useradd' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <UserPlus className="w-4 h-4" /> useradd (à venir)
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'chmod' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* PANNEAU DE CONTRÔLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-200 mb-6 border-b border-slate-800 pb-4">Configuration des permissions</h3>
            
            {/* Grille des permissions */}
            <div className="space-y-6">
              {['owner', 'group', 'others'].map((role, idx) => {
                const titles = { owner: 'Propriétaire (u)', group: 'Groupe (g)', others: 'Autres (o)' };
                const colors = { owner: 'text-cyan-400', group: 'text-emerald-400', others: 'text-purple-400' };
                return (
                  <div key={role} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`font-semibold ${colors[role]}`}>{titles[role]}</span>
                      <span className="font-mono text-xl bg-slate-800 px-3 py-1 rounded border border-slate-700 text-slate-200">
                        {role === 'owner' ? ownerVal : role === 'group' ? groupVal : othersVal}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      {['r', 'w', 'x'].map(type => {
                        const labels = { r: 'Lecture (4)', w: 'Écriture (2)', x: 'Exécution (1)' };
                        return (
                          <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 hover:text-white">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-900"
                              checked={perms[role][type]}
                              onChange={() => handlePermChange(role, type)}
                            />
                            {labels[type]}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Options supplémentaires */}
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cible (Fichier ou Dossier)</label>
                <input 
                  type="text" 
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="nom_du_fichier..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                <input 
                  type="checkbox" 
                  checked={recursive}
                  onChange={(e) => setRecursive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
                Appliquer récursivement aux sous-dossiers (-R)
              </label>
            </div>
          </div>

          {/* RÉSULTAT ET EXPLICATIONS */}
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative group">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Commande générée</h3>
              <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-6 font-mono text-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                {finalCommand}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-16 right-8 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-md transition-colors border border-slate-700 flex items-center gap-2 text-sm font-sans"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? <span className="text-emerald-400">Copié !</span> : "Copier"}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex-1">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Décryptage en temps réel</h3>
              <div className="space-y-4 text-sm">
                <p className="text-slate-300">La commande donnera la permission <strong className="text-emerald-400 font-mono">{chmodNum}</strong> sur <strong className="text-emerald-400">{fileName || 'le fichier'}</strong> :</p>
                <ul className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold min-w-[20px]">{ownerVal}</span> : {getExplanations(ownerVal)} pour le <strong className="text-cyan-400">propriétaire</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold min-w-[20px]">{groupVal}</span> : {getExplanations(groupVal)} pour le <strong className="text-emerald-400">groupe</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold min-w-[20px]">{othersVal}</span> : {getExplanations(othersVal)} pour les <strong className="text-purple-400">autres</strong> utilisateurs
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}