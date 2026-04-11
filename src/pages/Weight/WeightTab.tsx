import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingDown, TrendingUp, Minus, Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore';
import { formatDate } from '../../utils/helpers';

export default function WeightTab() {
  const { bodyWeightEntries, addBodyWeightEntry, deleteBodyWeightEntry, settings } = useStore();
  const unit = settings.unit === 'lbs' ? 'lbs' : 'kg';

  const [showAdd, setShowAdd] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [noteInput, setNoteInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...bodyWeightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [bodyWeightEntries]
  );

  const recent = useMemo(
    () => [...bodyWeightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [bodyWeightEntries]
  );

  const chartData = useMemo(
    () => sorted.map(e => ({
      date: new Date(e.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      weight: e.weight,
    })),
    [sorted]
  );

  const currentWeight = recent[0]?.weight;
  const previousWeight = recent[1]?.weight;
  const diff = currentWeight && previousWeight ? currentWeight - previousWeight : null;
  const minWeight = sorted.length > 0 ? Math.min(...sorted.map(e => e.weight)) : null;
  const maxWeight = sorted.length > 0 ? Math.max(...sorted.map(e => e.weight)) : null;

  const handleAdd = () => {
    const w = parseFloat(weightInput);
    if (!w || w <= 0) return;
    const d = new Date(dateInput);
    d.setHours(12, 0, 0, 0);
    addBodyWeightEntry(w, d.toISOString(), noteInput || undefined);
    setWeightInput('');
    setNoteInput('');
    setDateInput(new Date().toISOString().split('T')[0]);
    setShowAdd(false);
  };

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">Aktuell</p>
          <p className="text-xl font-bold text-zinc-100">{currentWeight ?? '—'}</p>
          <p className="text-xs text-zinc-500">{unit}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">Differenz</p>
          <div className="flex items-center justify-center gap-1">
            {diff !== null ? (
              <>
                {diff > 0 ? <TrendingUp size={16} className="text-red-400" /> : diff < 0 ? <TrendingDown size={16} className="text-green-400" /> : <Minus size={16} className="text-zinc-500" />}
                <span className={`text-xl font-bold ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-zinc-400'}`}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-zinc-600">—</span>
            )}
          </div>
          <p className="text-xs text-zinc-500">{unit}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 text-center">
          <p className="text-xs text-zinc-500 mb-1">Bereich</p>
          <p className="text-sm font-bold text-zinc-100">{minWeight !== null ? `${minWeight}–${maxWeight}` : '—'}</p>
          <p className="text-xs text-zinc-500">{unit}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-3">Verlauf</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={{ stroke: '#27272a' }} />
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} width={35} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: number) => [`${value} ${unit}`, 'Gewicht']}
              />
              <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto">
            <Scale size={24} className="text-zinc-500" />
          </div>
          <p className="text-zinc-400 font-medium">{chartData.length === 1 ? 'Noch ein Eintrag für den Chart' : 'Noch keine Einträge'}</p>
          <p className="text-zinc-600 text-sm">Trage dein Gewicht ein, um den Verlauf zu sehen</p>
        </div>
      )}

      {/* History */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium px-1">Einträge ({recent.length})</p>
        {recent.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
            <div className="flex-1">
              <span className="text-lg font-bold text-zinc-100">{entry.weight} {unit}</span>
              <p className="text-xs text-zinc-500 mt-0.5">{formatDate(entry.date)}{entry.note ? ` · ${entry.note}` : ''}</p>
            </div>
            {deletingId === entry.id ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-400">Nein</button>
                <button onClick={() => { deleteBodyWeightEntry(entry.id); setDeletingId(null); }} className="px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-400">Ja</button>
              </div>
            ) : (
              <button onClick={() => setDeletingId(entry.id)} className="w-8 h-8 flex items-center justify-center text-zinc-600 active:text-red-400">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:bg-blue-600 transition-colors z-40"
      >
        <Plus size={28} />
      </button>

      {/* Add weight modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full bg-zinc-900 rounded-t-3xl p-6 mb-16 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-100">Gewicht eintragen</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Gewicht ({unit}) *</label>
                <input type="number" inputMode="decimal" step="0.1" placeholder="z.B. 82.5" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                  className="w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 text-xl text-center font-bold placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Datum</label>
                <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Notiz (optional)</label>
                <input type="text" placeholder="z.B. morgens nüchtern" value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-colors text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:bg-zinc-700">Abbrechen</button>
              <button onClick={handleAdd} disabled={!weightInput || parseFloat(weightInput) <= 0}
                className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-40 active:bg-blue-600 transition-colors">Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
