import { useState, useMemo } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';
import { formatDate } from '../../utils/helpers';

interface ExerciseDataPoint {
  date: string;
  dateLabel: string;
  weight: number;
  reps?: number;
  sessionId: string;
}

export default function StatsPage() {
  const { sessions, settings } = useStore();
  const completedSessions = sessions.filter(s => s.completed);
  const unit = settings.unit;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Collect all unique exercise names
  const allExercises = useMemo(() => {
    const names = new Set<string>();
    completedSessions.forEach(s => {
      s.exercises.forEach(e => names.add(e.name));
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [completedSessions]);

  const filteredExercises = useMemo(
    () =>
      allExercises.filter(name =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [allExercises, searchQuery]
  );

  // Build chart data for selected exercise
  const chartData: ExerciseDataPoint[] = useMemo(() => {
    if (!selectedExercise) return [];

    const points: ExerciseDataPoint[] = [];
    const sorted = [...completedSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const session of sorted) {
      const ex = session.exercises.find(e => e.name === selectedExercise);
      if (!ex) continue;

      const doneSets = ex.sets.filter(s => s.done && s.weight !== undefined);
      if (doneSets.length === 0) continue;

      // Top set = highest weight
      const topSet = doneSets.reduce((best, s) =>
        (s.weight ?? 0) > (best.weight ?? 0) ? s : best
      );

      points.push({
        date: session.date,
        dateLabel: formatDate(session.date),
        weight: topSet.weight ?? 0,
        reps: topSet.reps,
        sessionId: session.id,
      });
    }

    return points;
  }, [selectedExercise, completedSessions]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ExerciseDataPoint }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm">
        <p className="text-zinc-300 font-medium">{d.dateLabel}</p>
        <p className="text-blue-400">
          {d.weight} {unit}
          {d.reps ? ` × ${d.reps}` : ''}
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header title="Statistiken" />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Übung suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Exercise list */}
        {!selectedExercise && (
          <div className="space-y-1">
            {completedSessions.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <TrendingUp size={40} className="text-zinc-700 mx-auto" />
                <p className="text-zinc-500">Noch keine Trainingsdaten</p>
                <p className="text-zinc-600 text-sm">Absolviere dein erstes Training um Statistiken zu sehen</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <p className="text-center text-zinc-500 py-8">Keine Übungen gefunden</p>
            ) : (
              filteredExercises.map(name => {
                const dataPoints = completedSessions.filter(s =>
                  s.exercises.some(e => e.name === name && e.sets.some(st => st.done))
                );
                return (
                  <button
                    key={name}
                    onClick={() => setSelectedExercise(name)}
                    className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-left active:bg-zinc-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={15} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-100 font-medium text-sm truncate">{name}</p>
                      <p className="text-xs text-zinc-500">{dataPoints.length} Sessions</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Chart view */}
        {selectedExercise && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedExercise(null)}
                className="text-blue-500 text-sm active:text-blue-400 transition-colors"
              >
                ← Zurück
              </button>
              <span className="text-zinc-600 text-sm">·</span>
              <span className="font-medium text-zinc-100 text-sm truncate">{selectedExercise}</span>
            </div>

            {chartData.length < 2 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-2">
                <TrendingUp size={32} className="text-zinc-700 mx-auto" />
                <p className="text-zinc-500 text-sm">
                  {chartData.length === 0
                    ? 'Keine Daten für diese Übung'
                    : 'Mindestens 2 Sessions nötig für einen Chart'}
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs text-zinc-500 mb-3">Top-Gewicht pro Session ({unit})</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={35}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent sessions table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Letzte Sessions</p>
              </div>
              {chartData.length === 0 ? (
                <p className="text-center text-zinc-600 text-sm py-5">Keine Daten</p>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {[...chartData].reverse().slice(0, 10).map(dp => (
                    <div key={dp.sessionId + dp.date} className="flex items-center px-4 py-3">
                      <span className="flex-1 text-sm text-zinc-400">{dp.dateLabel}</span>
                      <span className="text-sm font-medium text-zinc-100">
                        {dp.weight} {unit}
                        {dp.reps ? <span className="text-zinc-500 font-normal"> × {dp.reps}</span> : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
