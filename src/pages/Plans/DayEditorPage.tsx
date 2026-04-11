import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/Header';
import { useStore } from '../../store/useStore';
import { getBlockTypeLabel, formatTargetSets } from '../../utils/helpers';
import type { BlockType, ExerciseType } from '../../types';

const BLOCK_TYPES: BlockType[] = ['warmup', 'main', 'circuit', 'extras', 'mobility', 'makeup'];
const EXERCISE_TYPES: { value: ExerciseType; label: string }[] = [
  { value: 'rep-range', label: 'Wiederholungsbereich' },
  { value: 'fixed-reps', label: 'Feste Wdh.' },
  { value: 'max-reps', label: 'Max Wdh.' },
  { value: 'check-timer', label: 'Timer/Check' },
];

interface ExerciseFormState {
  name: string;
  type: ExerciseType;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  defaultWeight: number;
  notes: string;
}

const defaultExForm = (): ExerciseFormState => ({
  name: '',
  type: 'rep-range',
  targetSets: 3,
  targetRepsMin: 8,
  targetRepsMax: 10,
  defaultWeight: 0,
  notes: '',
});

export default function DayEditorPage() {
  const { planId, dayId } = useParams<{ planId: string; dayId: string }>();
  const navigate = useNavigate();
  const { plans, updateDay, addBlock, deleteBlock, addExercise, updateExercise, deleteExercise } = useStore();

  const plan = plans.find(p => p.id === planId);
  const day = plan?.days.find(d => d.id === dayId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(day?.title ?? '');
  const [notesValue, setNotesValue] = useState(day?.notes ?? '');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [addExerciseBlockId, setAddExerciseBlockId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState<{ blockId: string; exerciseId: string } | null>(null);
  const [exForm, setExForm] = useState<ExerciseFormState>(defaultExForm());
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  if (!plan || !day) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Header title="Tag nicht gefunden" showBack />
      </div>
    );
  }

  const toggleBlock = (blockId: string) => {
    setCollapsedBlocks(prev => {
      const next = new Set(prev);
      next.has(blockId) ? next.delete(blockId) : next.add(blockId);
      return next;
    });
  };

  const handleTitleSave = () => {
    if (titleValue.trim()) updateDay(plan.id, day.id, { title: titleValue.trim(), notes: notesValue });
    setEditingTitle(false);
  };

  const handleNotesBlur = () => {
    updateDay(plan.id, day.id, { notes: notesValue });
  };

  const handleAddBlock = (type: BlockType) => {
    addBlock(plan.id, day.id, type, getBlockTypeLabel(type));
    setShowAddBlock(false);
  };

  const openAddExercise = (blockId: string) => {
    setExForm(defaultExForm());
    setEditExercise(null);
    setAddExerciseBlockId(blockId);
  };

  const openEditExercise = (blockId: string, exerciseId: string) => {
    const block = day.blocks.find(b => b.id === blockId);
    const ex = block?.exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    setExForm({
      name: ex.name,
      type: ex.type,
      targetSets: ex.targetSets,
      targetRepsMin: ex.targetRepsMin ?? 8,
      targetRepsMax: ex.targetRepsMax ?? 10,
      defaultWeight: ex.defaultWeight ?? 0,
      notes: ex.notes ?? '',
    });
    setEditExercise({ blockId, exerciseId });
    setAddExerciseBlockId(blockId);
  };

  const handleSaveExercise = () => {
    if (!exForm.name.trim() || !addExerciseBlockId) return;

    const exerciseData = {
      name: exForm.name.trim(),
      type: exForm.type,
      targetSets: exForm.targetSets,
      targetRepsMin: exForm.targetRepsMin,
      targetRepsMax: exForm.targetRepsMax,
      defaultWeight: exForm.defaultWeight,
      notes: exForm.notes,
      settings: [],
      alternatives: [],
      tags: [],
    };

    if (editExercise) {
      updateExercise(plan.id, day.id, editExercise.blockId, editExercise.exerciseId, exerciseData);
    } else {
      addExercise(plan.id, day.id, addExerciseBlockId, exerciseData);
    }
    setAddExerciseBlockId(null);
    setEditExercise(null);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Header
        title={day.title}
        showBack
        backTo={`/plans/${planId}`}
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* Day title & notes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Titel</label>
            {editingTitle ? (
              <div className="flex gap-2 mt-1">
                <input
                  autoFocus
                  type="text"
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                  className="flex-1 h-10 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 outline-none focus:border-blue-500 text-sm"
                />
              </div>
            ) : (
              <button
                onClick={() => { setTitleValue(day.title); setEditingTitle(true); }}
                className="block w-full text-left mt-1 p-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <span className="text-zinc-100 font-medium">{day.title}</span>
              </button>
            )}
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Notizen</label>
            <textarea
              value={notesValue}
              onChange={e => setNotesValue(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Anmerkungen zum Tag..."
              rows={2}
              className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 text-sm resize-none transition-colors"
            />
          </div>
        </div>

        {/* Blocks */}
        {day.blocks.map(block => {
          const collapsed = collapsedBlocks.has(block.id);
          return (
            <div key={block.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Block header */}
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  onClick={() => toggleBlock(block.id)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="font-medium text-zinc-100">{block.title ?? getBlockTypeLabel(block.type)}</span>
                  <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800">
                    {getBlockTypeLabel(block.type)}
                  </span>
                  <span className="ml-auto">
                    {collapsed ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronUp size={16} className="text-zinc-500" />}
                  </span>
                </button>
                <button
                  onClick={() => deleteBlock(plan.id, day.id, block.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-600 active:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {!collapsed && (
                <div className="px-4 pb-3 space-y-2">
                  {block.exercises.length === 0 && (
                    <p className="text-zinc-600 text-sm text-center py-3">Keine Übungen</p>
                  )}

                  {block.exercises.map(ex => (
                    <div
                      key={ex.id}
                      className="flex items-center gap-3 bg-zinc-800/60 rounded-xl px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-100 text-sm font-medium truncate">{ex.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {formatTargetSets(ex.targetSets, ex.targetRepsMin, ex.targetRepsMax)}
                          {ex.defaultWeight ? ` · ${ex.defaultWeight} kg` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => openEditExercise(block.id, ex.id)}
                        className="text-xs text-blue-400 px-2 py-1 rounded-lg active:bg-blue-500/10 transition-colors"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => deleteExercise(plan.id, day.id, block.id, ex.id)}
                        className="w-7 h-7 flex items-center justify-center text-zinc-600 active:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => openAddExercise(block.id)}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 text-zinc-500 text-sm active:border-blue-500 active:text-blue-400 transition-colors"
                  >
                    <Plus size={15} />
                    Übung hinzufügen
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add block button */}
        <button
          onClick={() => setShowAddBlock(true)}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-800 text-zinc-500 active:border-blue-500 active:text-blue-500 transition-colors"
        >
          <Plus size={18} />
          Block hinzufügen
        </button>
      </div>

      {/* Add Block modal */}
      {showAddBlock && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAddBlock(false)}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl p-6 space-y-3 mb-16"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-2">Block hinzufügen</h2>
            {BLOCK_TYPES.map(type => (
              <button
                key={type}
                onClick={() => handleAddBlock(type)}
                className="w-full h-12 flex items-center px-4 rounded-xl bg-zinc-800 text-zinc-100 text-sm font-medium active:bg-zinc-700 transition-colors"
              >
                {getBlockTypeLabel(type)}
              </button>
            ))}
            <button
              onClick={() => setShowAddBlock(false)}
              className="w-full h-12 rounded-xl bg-zinc-800/50 text-zinc-500"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Exercise modal */}
      {addExerciseBlockId && (
        <div
          className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => { setAddExerciseBlockId(null); setEditExercise(null); }}
        >
          <div
            className="w-full bg-zinc-900 rounded-t-3xl flex flex-col"
            style={{ maxHeight: 'calc(90dvh - 64px)', marginBottom: '64px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <h2 className="text-lg font-semibold text-zinc-100">
                {editExercise ? 'Übung bearbeiten' : 'Übung hinzufügen'}
              </h2>
            </div>

            {/* Scrollable form fields */}
            <div className="overflow-y-auto px-5 space-y-3 pb-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Name *</label>
                <input
                  type="text"
                  placeholder="Übungsname"
                  value={exForm.name}
                  onChange={e => setExForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Typ</label>
                <select
                  value={exForm.type}
                  onChange={e => setExForm(f => ({ ...f, type: e.target.value as ExerciseType }))}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 outline-none focus:border-blue-500 transition-colors"
                >
                  {EXERCISE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Sätze</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={exForm.targetSets}
                    onChange={e => setExForm(f => ({ ...f, targetSets: parseInt(e.target.value) || 0 }))}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Wdh. min</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={exForm.targetRepsMin}
                    onChange={e => setExForm(f => ({ ...f, targetRepsMin: parseInt(e.target.value) || 0 }))}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Wdh. max</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={exForm.targetRepsMax}
                    onChange={e => setExForm(f => ({ ...f, targetRepsMax: parseInt(e.target.value) || 0 }))}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Startgewicht (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={exForm.defaultWeight || ''}
                  placeholder="0"
                  onChange={e => setExForm(f => ({ ...f, defaultWeight: parseFloat(e.target.value) || 0 }))}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Notizen</label>
                <textarea
                  value={exForm.notes}
                  onChange={e => setExForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optionale Hinweise..."
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 text-sm resize-none transition-colors"
                />
              </div>
            </div>

            {/* Fixed action buttons – always visible */}
            <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-zinc-800">
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={() => { setAddExerciseBlockId(null); setEditExercise(null); }}
                className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:bg-zinc-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={handleSaveExercise}
                disabled={!exForm.name.trim()}
                className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-semibold disabled:opacity-40 active:bg-blue-600 transition-colors"
              >
                {editExercise ? 'Speichern' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
