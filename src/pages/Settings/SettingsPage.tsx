import { useState } from 'react';
import { Scale, RotateCcw, Info } from 'lucide-react';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    localStorage.removeItem('fitness-app-store');
    window.location.reload();
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header title="Einstellungen" />

      <div className="px-4 py-4 space-y-4">
        {/* Unit toggle */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Einheiten</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Scale size={18} className="text-zinc-400" />
            </div>
            <div className="flex-1">
              <p className="text-zinc-100 font-medium">Gewichtseinheit</p>
              <p className="text-xs text-zinc-500 mt-0.5">Kilogramm oder Pfund</p>
            </div>
            <div className="flex bg-zinc-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => updateSettings({ unit: 'kg' })}
                className={`px-4 h-8 rounded-lg text-sm font-medium transition-colors ${
                  settings.unit === 'kg'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-zinc-500 active:text-zinc-300'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => updateSettings({ unit: 'lbs' })}
                className={`px-4 h-8 rounded-lg text-sm font-medium transition-colors ${
                  settings.unit === 'lbs'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-zinc-500 active:text-zinc-300'
                }`}
              >
                lbs
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Daten</p>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-zinc-800 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <RotateCcw size={18} className="text-red-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-red-400 font-medium">Daten zurücksetzen</p>
                <p className="text-xs text-zinc-500 mt-0.5">Alle Pläne und Sessions löschen</p>
              </div>
            </button>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm text-zinc-300">
                Wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 h-11 rounded-xl bg-zinc-800 text-zinc-300 font-medium text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 h-11 rounded-xl bg-red-500/20 text-red-400 font-semibold text-sm border border-red-500/30"
                >
                  Alles löschen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* App info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Info</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Info size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-zinc-100 font-medium">FitnessApp</p>
              <p className="text-xs text-zinc-500 mt-0.5">Version 1.0.0 · React + Vite + Zustand</p>
            </div>
          </div>

          <div className="border-t border-zinc-800 px-4 py-3">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Alle Daten werden lokal im Browser gespeichert (localStorage).
              Kein Server, keine Cloud, volle Datenkontrolle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
