import React from 'react';

export default function Quiz() {
  return (
    <div className="border border-dashed border-slate-700 rounded-xl p-12 text-center flex flex-col items-center justify-center h-[60vh] bg-slate-900/30">
      <span className="text-4xl mb-4">🎯</span>
      <h2 className="text-2xl font-bold text-slate-200 mb-2">QCM & Entraînement</h2>
      <p className="text-slate-500 max-w-md">Validez vos acquis avec une série de questions aléatoires.</p>
    </div>
  );
}