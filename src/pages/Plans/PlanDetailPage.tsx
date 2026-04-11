import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Play, ChevronRight } from 'lucide-react';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';
import { formatDate } from '../../utils/helpers';

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plans, sessions, updatePlan, addDay, deleteDay, startSession } = useStore();

  const plan = plans.find(p => p.id === planId);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(plan?.name ?? '');
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState('');
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null);
  const [startingDayId, setStartingDayId] = useState<string | null>(null);

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Header title="Plan nicht gefunden" showBack />
        <p className="text-zinc-500 text-center pt-10">Dieser Plan existiert nicht mehr.</p>
      </div>
    );
  }

  const getLastTrained = (dayId: string) => {
    const s = sessions
      .filter(s => s.planId === planId && s.dayId === dayId && s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return s[0]?.date;
  };

  const handleNameSave = () => {
    if (nameValue.trim()) updatePlan(plan.id, { name: nameValue.trim() });
    setEditingName(false);
  };

  const handleAddDay = () => {
    if (!newDayTitle.trim()) return;
    const id = addDay(plan.id, newDayTitle.trim());
    setNewDayTitle('');
    setShowAddDay(false);
    navigate(`/plans/${plan.id}/day/${id}`);
  };

  const handleStartSession = (dayId: string) => {
    const sessionId = startSession(plan.id, dayId);
    setStartingDayId(null);
    navigate('/training');
  };

  const sortedDays = [...plan.days].sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-lg mx-auto">
      <Header
        title={plan.name}
        showBack
        backTo="/plans"
        right={
          <button
            onClick={() => {
              setNameValue(plan.name);
              setEditingName(true);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-lg active:bg-zinc-800 transition-colors text-zinc-400"
          >
            <Edit3 size={18} />
          </button>
        }
      />

      <div className="px-4 pt-4 pb-6 space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium px-1">
          {plan.days.length} Trainingstage
        </p>

        {sortedDays.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-2">
            <p className="text-zinc-400">Noch keine Trainingstage</p>
            <p className="text-zinc-600 text-sm">Füge einen Tag hinzu um zu beginnen</p>
          </div>
        )}

        {sortedDays.map(day => {
          const lastTrained = getLastTrained(day.id);
          const exerciseCount = day.blocks.reduce((acc, b) => acc + b.exercises.length, 0);
          return (
            <div
              key={day.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center gap-2 p-3">
                <button
                  onClick={() => navigate(`/plans/${plan.id}/day/${day.id}`)}
                  className="flex-1 flex items-center gap-3 min-w-0 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{day.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {exerciseCount} Übungen · {day.blocks.length} Blöcke
                      {lastTrained && ` · ${formatDate(lastTrained)}`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
                </button>

                <button
                  onClick={() => setStartingDayId(day.id)}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-blue-500/20 text-blue-400 text-sm font-medium flex-shrink-0 active:bg-blue-500/30 transition-colors"
                >
                  <Play size={14} fill="currentColor" />
                  Start
                </button>
              </div>

              {deletingDayId === day.id ? (
                <div className="flex items-center gap-2 px-3 pb-3">
                  <p className="flex-1 text-sm text-zinc-400">Tag löschen?</p>
                  <button
                    onClick={() => setDeletingDayId(null)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => {
                      deleteDay(plan.id, day.id);
                      setDeletingDayId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm"
                  >
                    Löschen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingDayId(day.id)}
                  className="flex items-center gap-1.5 px-3 pb-3 text-zinc-600 text-xs active:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Tag löschen</span>
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setShowAddDay(true)}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-800 text-zinc-500 active:border-blue-500 active:text-blue-500 transition-colors"
        >
          <Plus size={18} />
          <span>Tag hinzufügen</span>
        </button>
      </div>

      {/* Edit name modal */}
      {editingName && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setEditingName(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 mb-16 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Plan umbenennen</h2>
            <input
              autoFocus
              type="text"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSave()}
              className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditingName(false)}
                className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleNameSave}
                className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-medium"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add day modal */}
      {showAddDay && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddDay(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 mb-16 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Tag hinzufügen</h2>
            <input
              autoFocus
              type="text"
              placeholder="z. B. Tag 1A – Brust / Trizeps"
              value={newDayTitle}
              onChange={e => setNewDayTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDay()}
              className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddDay(false)}
                className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddDay}
                disabled={!newDayTitle.trim()}
                className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-40"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start session confirm */}
      {startingDayId && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setStartingDayId(null)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 mb-16 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Training starten</h2>
            <p className="text-zinc-400">
              {sortedDays.find(d => d.id === startingDayId)?.title}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStartingDayId(null)}
                className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleStartSession(startingDayId)}
                className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-medium flex items-center justify-center gap-2"
              >
                <Play size={16} fill="white" />
                Los geht's
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
