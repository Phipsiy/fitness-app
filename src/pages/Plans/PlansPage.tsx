import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Trash2, ClipboardList } from 'lucide-react';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';
import { formatDate } from '../../utils/helpers';

export default function PlansPage() {
  const navigate = useNavigate();
  const { plans, sessions, addPlan, deletePlan } = useStore();
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getLastTrained = (planId: string) => {
    const planSessions = sessions
      .filter(s => s.planId === planId && s.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return planSessions[0]?.date;
  };

  const handleCreate = () => {
    if (!newPlanName.trim()) return;
    const id = addPlan(newPlanName.trim());
    setNewPlanName('');
    setShowNewPlanModal(false);
    navigate(`/plans/${id}`);
  };

  const handleDelete = (planId: string) => {
    deletePlan(planId);
    setDeletingId(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header title="Pläne" />

      <div className="px-4 pt-4 pb-6 space-y-3">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <ClipboardList size={32} className="text-zinc-500" />
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Noch keine Pläne</p>
              <p className="text-zinc-600 text-sm mt-1">Erstelle deinen ersten Trainingsplan</p>
            </div>
          </div>
        ) : (
          plans.map(plan => {
            const lastTrained = getLastTrained(plan.id);
            const sessionCount = sessions.filter(s => s.planId === plan.id && s.completed).length;
            return (
              <div
                key={plan.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => navigate(`/plans/${plan.id}`)}
                  className="w-full flex items-center gap-3 p-4 text-left active:bg-zinc-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={20} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zinc-100 truncate">{plan.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {plan.days.length} {plan.days.length === 1 ? 'Tag' : 'Tage'} ·{' '}
                      {sessionCount} {sessionCount === 1 ? 'Session' : 'Sessions'}
                      {lastTrained && ` · Zuletzt ${formatDate(lastTrained)}`}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 flex-shrink-0" />
                </button>
                {deletingId === plan.id ? (
                  <div className="flex items-center gap-2 px-4 pb-3">
                    <p className="flex-1 text-sm text-zinc-400">Plan löschen?</p>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm"
                    >
                      Löschen
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(plan.id)}
                    className="flex items-center gap-2 px-4 pb-3 text-zinc-600 text-xs active:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Plan löschen</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNewPlanModal(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition-transform z-40"
      >
        <Plus size={26} className="text-white" />
      </button>

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowNewPlanModal(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Neuer Plan</h2>
            <input
              autoFocus
              type="text"
              placeholder="Planname (z. B. Kraftplan A/B)"
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:bg-zinc-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreate}
                disabled={!newPlanName.trim()}
                className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-40 active:bg-blue-600 transition-colors"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
