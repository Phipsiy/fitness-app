import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Plus, Minus, Trash2, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';
import { formatTargetSets } from '../../utils/helpers';
import type { WorkoutSession, WorkoutSet } from '../../types';

// ─── Session Selector ─────────────────────────────────────────────────────────
function SessionSelector() {
  const navigate = useNavigate();
  const { plans, startSession } = useStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id ?? '');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const sortedDays = selectedPlan
    ? [...selectedPlan.days].sort((a, b) => a.position - b.position)
    : [];

  useEffect(() => {
    if (sortedDays.length > 0 && !selectedDayId) {
      setSelectedDayId(sortedDays[0].id);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans]);

  const handleStart = () => {
    if (!selectedPlanId || !selectedDayId) return;
    startSession(selectedPlanId, selectedDayId);
    navigate('/training');
  };

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
          <Play size={28} className="text-zinc-500" />
        </div>
        <p className="text-zinc-400 font-medium">Keine Pläne vorhanden</p>
        <p className="text-zinc-600 text-sm">Erstelle zuerst einen Trainingsplan</p>
        <button
          onClick={() => navigate('/plans')}
          className="h-12 px-6 rounded-xl bg-blue-500 text-white font-medium"
        >
          Zu den Plänen
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-lg mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">Training starten</h2>

        <div className="space-y-2">
          <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Plan</label>
          <select
            value={selectedPlanId}
            onChange={e => { setSelectedPlanId(e.target.value); setSelectedDayId(''); }}
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
            value={selectedDayId}
            onChange={e => setSelectedDayId(e.target.value)}
            className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 outline-none focus:border-blue-500 transition-colors"
            disabled={sortedDays.length === 0}
          >
            {sortedDays.length === 0 ? (
              <option value="">Keine Tage vorhanden</option>
            ) : (
              sortedDays.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))
            )}
          </select>
        </div>

        <button
          onClick={handleStart}
          disabled={!selectedPlanId || !selectedDayId}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-40 active:bg-blue-600 transition-colors"
        >
          <Play size={20} fill="white" />
          Training beginnen
        </button>
      </div>
    </div>
  );
}

// ─── Elapsed Timer ────────────────────────────────────────────────────────────
function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const formatted = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;

  return <span className="text-zinc-400 text-sm tabular-nums">{formatted}</span>;
}

// ─── Set Row ──────────────────────────────────────────────────────────────────
interface SetRowProps {
  setIndex: number;
  weight?: number;
  reps?: number;
  done: boolean;
  unit: string;
  lastSet?: WorkoutSet;
  onWeightChange: (val: number) => void;
  onRepsChange: (val: number) => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onAdjustWeight: (delta: number) => void;
}

function SetRow({ setIndex, weight, reps, done, unit, lastSet, onWeightChange, onRepsChange, onToggleDone, onDelete, onAdjustWeight }: SetRowProps) {
  return (
    <div className={`rounded-xl px-2 py-2 transition-colors ${done ? 'bg-green-500/10' : 'bg-zinc-800/50'}`}>
      {/* Last session hint */}
      {lastSet && (lastSet.weight || lastSet.reps) && (
        <div className="flex items-center gap-1 px-1 mb-1">
          <span className="text-[11px] text-zinc-600">Letztes Mal:</span>
          <span className="text-[11px] text-zinc-500 font-medium">
            {lastSet.weight ? `${lastSet.weight} ${unit}` : '—'}
            {lastSet.reps ? ` × ${lastSet.reps} Wdh` : ''}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="w-6 text-center text-xs text-zinc-500 font-mono flex-shrink-0">{setIndex + 1}</span>

        {/* Weight */}
        <div className="flex items-center gap-1 flex-1">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onAdjustWeight(-2.5)}
            className="w-8 h-9 flex items-center justify-center rounded-lg bg-zinc-700 text-zinc-300 active:bg-zinc-600 transition-colors flex-shrink-0"
          >
            <Minus size={13} />
          </button>
          <div className="flex-1 relative">
            <input
              type="number"
              inputMode="decimal"
              value={weight ?? ''}
              onChange={e => onWeightChange(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full h-9 bg-zinc-700 rounded-lg text-center text-zinc-100 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">{unit}</span>
          </div>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => onAdjustWeight(2.5)}
            className="w-8 h-9 flex items-center justify-center rounded-lg bg-zinc-700 text-zinc-300 active:bg-zinc-600 transition-colors flex-shrink-0"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Reps */}
        <input
          type="number"
          inputMode="numeric"
          value={reps ?? ''}
          onChange={e => onRepsChange(parseInt(e.target.value) || 0)}
          placeholder="Wdh"
          className="w-14 h-9 bg-zinc-700 rounded-lg text-center text-zinc-100 text-sm outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
        />

        {/* Done toggle */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onToggleDone}
          className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors ${
            done ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'
          }`}
        >
          <CheckCircle size={18} />
        </button>

        {/* Delete */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          className="w-8 h-9 flex items-center justify-center text-zinc-600 active:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────
interface ExerciseCardProps {
  sessionId: string;
  exercise: WorkoutSession['exercises'][number];
  unit: string;
  lastExercise?: WorkoutSession['exercises'][number];
}

function ExerciseCard({ sessionId, exercise, unit, lastExercise }: ExerciseCardProps) {
  const { addWorkoutSet, updateWorkoutSet, deleteWorkoutSet, updateWorkoutExercise } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [noteValue, setNoteValue] = useState(exercise.note ?? '');

  const doneSets = exercise.sets.filter(s => s.done).length;
  const totalSets = exercise.sets.length;

  // Summary of last session for this exercise
  const lastSummary = lastExercise?.sets && lastExercise.sets.length > 0
    ? lastExercise.sets
        .filter(s => s.weight || s.reps)
        .map(s => `${s.weight ?? '?'} ${unit} × ${s.reps ?? '?'}`)
        .join('  |  ')
    : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-100">{exercise.name}</span>
            <span className="text-xs text-zinc-500">
              {formatTargetSets(exercise.targetSets, exercise.targetRepsMin, exercise.targetRepsMax)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-zinc-500">
              {doneSets}/{totalSets} Sätze erledigt
            </span>
            {doneSets === totalSets && totalSets > 0 && (
              <span className="text-xs text-green-400 font-medium">✓ Fertig</span>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-zinc-500 flex-shrink-0" />
          : <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">

          {/* Last session summary banner */}
          {lastSummary && (
            <div className="flex items-start gap-2 bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2">
              <span className="text-[11px] text-blue-400 font-semibold uppercase tracking-wide flex-shrink-0 mt-0.5">Letztes Mal</span>
              <span className="text-[11px] text-zinc-400 leading-relaxed">{lastSummary}</span>
            </div>
          )}

          {/* Set column headers */}
          <div className="flex items-center gap-2 px-2">
            <span className="w-6 text-center text-xs text-zinc-600">#</span>
            <span className="flex-1 text-center text-xs text-zinc-600">Gewicht</span>
            <span className="w-14 text-center text-xs text-zinc-600">Wdh</span>
            <span className="w-9 text-center text-xs text-zinc-600">✓</span>
            <span className="w-8" />
          </div>

          {/* Sets */}
          {exercise.sets.map((set, idx) => (
            <SetRow
              key={set.id}
              setIndex={idx}
              weight={set.weight}
              reps={set.reps}
              done={set.done}
              unit={unit}
              lastSet={lastExercise?.sets?.[idx]}
              onWeightChange={val => updateWorkoutSet(sessionId, exercise.templateId, set.id, { weight: val })}
              onRepsChange={val => updateWorkoutSet(sessionId, exercise.templateId, set.id, { reps: val })}
              onToggleDone={() => updateWorkoutSet(sessionId, exercise.templateId, set.id, { done: !set.done })}
              onDelete={() => deleteWorkoutSet(sessionId, exercise.templateId, set.id)}
              onAdjustWeight={delta => {
                const current = set.weight ?? 0;
                const next = Math.max(0, Math.round((current + delta) * 4) / 4);
                updateWorkoutSet(sessionId, exercise.templateId, set.id, { weight: next });
              }}
            />
          ))}

          {/* Add set */}
          <button
            onClick={() => addWorkoutSet(sessionId, exercise.templateId)}
            className="w-full h-9 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-sm active:border-blue-500 active:text-blue-400 transition-colors"
          >
            <Plus size={14} />
            Satz hinzufügen
          </button>

          {/* Note */}
          <textarea
            value={noteValue}
            onChange={e => setNoteValue(e.target.value)}
            onBlur={() => updateWorkoutExercise(sessionId, exercise.templateId, { note: noteValue })}
            placeholder="Notiz zur Übung..."
            rows={1}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 text-xs resize-none transition-colors"
          />
        </div>
      )}
    </div>
  );
}

// ─── Active Session ───────────────────────────────────────────────────────────
function ActiveSession({ session }: { session: WorkoutSession }) {
  const { completeSession, deleteSession, settings, sessions } = useStore();
  const navigate = useNavigate();
  const [showComplete, setShowComplete] = useState(false);
  const [showAbort, setShowAbort] = useState(false);

  const unit = settings.unit;
  const totalSets = session.exercises.reduce((acc, e) => acc + e.sets.length, 0);
  const doneSets = session.exercises.reduce((acc, e) => acc + e.sets.filter(s => s.done).length, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  // Find the last completed session for the same plan day
  const lastSession = sessions
    .filter(s => s.completed && s.id !== session.id && s.planId === session.planId && s.dayId === session.dayId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const handleComplete = () => {
    completeSession(session.id);
    navigate('/calendar');
  };

  const handleAbort = () => {
    deleteSession(session.id);
    navigate('/training');
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header
        title={session.dayTitle}
        right={session.startedAt ? <ElapsedTimer startedAt={session.startedAt} /> : undefined}
      />

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-800">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="px-4 py-4 space-y-3 pb-8">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-zinc-500">{session.planName}</p>
          <p className="text-xs text-zinc-500">{doneSets}/{totalSets} Sätze</p>
        </div>

        {session.exercises.map(exercise => {
          const lastExercise = lastSession?.exercises.find(e => e.templateId === exercise.templateId);
          return (
            <ExerciseCard
              key={exercise.templateId}
              sessionId={session.id}
              exercise={exercise}
              unit={unit}
              lastExercise={lastExercise}
            />
          );
        })}

        {/* ── Action Buttons ── */}
        <div className="pt-2 space-y-3">
          {/* Finish training */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setShowComplete(true)}
            className="w-full h-16 flex items-center justify-center gap-3 rounded-2xl bg-green-500 text-white font-bold text-lg active:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
          >
            <CheckCircle size={26} />
            Einheit beenden
          </button>

          {/* Abort training */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setShowAbort(true)}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl bg-zinc-800 border-2 border-red-500/40 text-red-400 font-semibold text-base active:bg-red-500/10 transition-colors"
          >
            <XCircle size={22} />
            Training abbrechen
          </button>
        </div>
      </div>

      {/* ── Complete confirmation modal ── */}
      {showComplete && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/70 backdrop-blur-sm"
          onClick={() => setShowComplete(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 space-y-4 mb-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Training beenden?</h2>
                <p className="text-sm text-zinc-400">
                  {doneSets} von {totalSets} Sätzen erledigt
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setShowComplete(false)}
                className="flex-1 h-13 rounded-xl bg-zinc-800 text-zinc-300 font-medium h-12"
              >
                Weiter trainieren
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={handleComplete}
                className="flex-1 h-12 rounded-xl bg-green-500 text-white font-bold active:bg-green-600 transition-colors"
              >
                Abschließen ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Abort confirmation modal ── */}
      {showAbort && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAbort(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <XCircle size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100">Training abbrechen?</h2>
                <p className="text-sm text-zinc-400">
                  Der Fortschritt wird nicht gespeichert.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setShowAbort(false)}
                className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium"
              >
                Weitermachen
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={handleAbort}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-bold active:bg-red-600 transition-colors"
              >
                Ja, abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main TrainingPage ────────────────────────────────────────────────────────
export default function TrainingPage() {
  const { sessions, activeSessionId } = useStore();
  const activeSession = sessions.find(s => s.id === activeSessionId && !s.completed);

  if (activeSession) {
    return <ActiveSession session={activeSession} />;
  }

  return (
    <div className="max-w-lg mx-auto">
      <Header title="Training" />
      <SessionSelector />
    </div>
  );
}
