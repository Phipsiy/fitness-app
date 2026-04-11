import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Dumbbell, Plus, Play } from 'lucide-react';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';
import { isSameDay, getDaysInMonth, formatDate, getSessionDuration } from '../../utils/helpers';
import type { WorkoutSession } from '../../types';

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function SessionDetailSheet({
  session,
  unit,
  onClose,
}: {
  session: WorkoutSession;
  unit: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full bg-zinc-900 rounded-t-3xl max-h-[80vh] flex flex-col mb-16"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-zinc-800 flex items-center px-5 py-4">
          <div className="flex-1">
            <p className="font-semibold text-zinc-100">{session.dayTitle}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {formatDate(session.date)} · {getSessionDuration(session)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {session.exercises.map(ex => {
            const doneSets = ex.sets.filter(s => s.done);
            if (doneSets.length === 0) return null;
            return (
              <div key={ex.templateId} className="space-y-2">
                <p className="font-medium text-zinc-200 text-sm">{ex.name}</p>
                <div className="space-y-1">
                  {doneSets.map((set, idx) => (
                    <div
                      key={set.id}
                      className="flex items-center gap-3 text-sm text-zinc-400 bg-zinc-800/50 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-zinc-600 text-xs w-4">{idx + 1}</span>
                      <span className="flex-1">
                        {set.weight !== undefined ? `${set.weight} ${unit}` : '–'}
                      </span>
                      <span className="text-zinc-300">
                        {set.reps !== undefined ? `${set.reps} Wdh` : '–'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { plans, sessions, settings, addManualSession } = useStore();
  const completedSessions = sessions.filter(s => s.completed);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [detailSession, setDetailSession] = useState<WorkoutSession | null>(null);

  // Nachtragen state
  const [showNachtragen, setShowNachtragen] = useState(false);
  const [nachtragenPlanId, setNachtragenPlanId] = useState<string>('');
  const [nachtragenDayId, setNachtragenDayId] = useState<string>('');

  useEffect(() => {
    if (plans.length > 0 && !nachtragenPlanId) {
      setNachtragenPlanId(plans[0].id);
    }
  }, [plans]);

  const selectedPlan = plans.find(p => p.id === nachtragenPlanId);
  const nachtragenDays = selectedPlan
    ? [...selectedPlan.days].sort((a, b) => a.position - b.position)
    : [];

  useEffect(() => {
    if (nachtragenDays.length > 0 && !nachtragenDayId) {
      setNachtragenDayId(nachtragenDays[0].id);
    }
  }, [nachtragenPlanId]);

  const days = getDaysInMonth(viewYear, viewMonth);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const getSessionsForDate = (date: Date) =>
    completedSessions.filter(s => isSameDay(new Date(s.date), date));

  const selectedSessions = selectedDate ? getSessionsForDate(selectedDate) : [];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleNachtragen = () => {
    if (!nachtragenPlanId || !nachtragenDayId || !selectedDate) return;
    const dateStr = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      12, 0, 0
    ).toISOString();
    addManualSession(nachtragenPlanId, nachtragenDayId, dateStr);
    setShowNachtragen(false);
    navigate('/training');
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header title="Kalender" />

      <div className="px-4 py-4 space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 active:bg-zinc-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-zinc-100">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 active:bg-zinc-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map(date => {
              const sessionCount = getSessionsForDate(date).length;
              const isToday = isSameDay(date, today);
              const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`relative flex flex-col items-center justify-center rounded-xl aspect-square text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : isToday
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-400 active:bg-zinc-800'
                  }`}
                >
                  <span className="font-medium">{date.getDate()}</span>
                  {sessionCount > 0 && (
                    <span
                      className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-blue-500'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sessions for selected day */}
        {selectedDate && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium px-1">
              {selectedSessions.length > 0
                ? `${selectedSessions.length} Session${selectedSessions.length > 1 ? 's' : ''} am ${formatDate(selectedDate.toISOString())}`
                : `Kein Training am ${formatDate(selectedDate.toISOString())}`}
            </p>

            {selectedSessions.map(session => {
              const exerciseCount = session.exercises.length;
              const setCount = session.exercises.reduce((acc, e) => acc + e.sets.filter(s => s.done).length, 0);
              return (
                <button
                  key={session.id}
                  onClick={() => setDetailSession(session)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left flex items-center gap-3 active:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{session.dayTitle}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {session.planName} · {exerciseCount} Übungen · {setCount} Sätze
                      {session.startedAt && session.completedAt && ` · ${getSessionDuration(session)}`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
                </button>
              );
            })}

            {/* Nachtragen button */}
            {selectedSessions.length === 0 && (
              <button
                onClick={() => {
                  setNachtragenDayId('');
                  setShowNachtragen(true);
                }}
                className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 border-2 border-dashed border-zinc-700 text-zinc-400 font-medium active:border-blue-500 active:text-blue-400 transition-colors"
              >
                <Plus size={18} />
                Training nachtragen
              </button>
            )}

            {selectedSessions.length > 0 && (
              <button
                onClick={() => {
                  setNachtragenDayId('');
                  setShowNachtragen(true);
                }}
                className="w-full h-10 flex items-center justify-center gap-1.5 rounded-xl text-zinc-500 text-sm active:text-blue-400 transition-colors"
              >
                <Plus size={14} />
                Weiteres Training nachtragen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session detail */}
      {detailSession && (
        <SessionDetailSheet
          session={detailSession}
          unit={settings.unit}
          onClose={() => setDetailSession(null)}
        />
      )}

      {/* Nachtragen modal */}
      {showNachtragen && selectedDate && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowNachtragen(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 mb-16 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Plus size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Training nachtragen</h2>
                <p className="text-sm text-zinc-400">{formatDate(selectedDate.toISOString())}</p>
              </div>
            </div>

            {plans.length === 0 ? (
              <p className="text-zinc-500 text-sm">Erstelle zuerst einen Trainingsplan.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Plan</label>
                  <select
                    value={nachtragenPlanId}
                    onChange={e => { setNachtragenPlanId(e.target.value); setNachtragenDayId(''); }}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Tag</label>
                  <select
                    value={nachtragenDayId}
                    onChange={e => setNachtragenDayId(e.target.value)}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                  >
                    {nachtragenDays.length === 0 ? (
                      <option value="">Keine Tage vorhanden</option>
                    ) : (
                      nachtragenDays.map(d => (
                        <option key={d.id} value={d.id}>{d.title}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowNachtragen(false)}
                    className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:bg-zinc-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleNachtragen}
                    disabled={!nachtragenPlanId || !nachtragenDayId}
                    className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 active:bg-blue-600 transition-colors"
                  >
                    <Play size={16} fill="white" />
                    Nachtragen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
