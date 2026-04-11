import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Plan,
  TrainingDay,
  Block,
  ExerciseTemplate,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  AppSettings,
  BlockType,
  BodyWeightEntry,
  MealEntry,
  MealType,
} from '../types';
import { generateId } from '../utils/helpers';

interface AppStore {
  plans: Plan[];
  sessions: WorkoutSession[];
  activeSessionId: string | null;
  settings: AppSettings;
  bodyWeightEntries: BodyWeightEntry[];
  mealEntries: MealEntry[];

  // Plan actions
  addPlan: (name: string, notes?: string) => string;
  updatePlan: (planId: string, updates: Partial<Pick<Plan, 'name' | 'notes'>>) => void;
  deletePlan: (planId: string) => void;

  // Day actions
  addDay: (planId: string, title: string) => string;
  updateDay: (planId: string, dayId: string, updates: Partial<Pick<TrainingDay, 'title' | 'notes'>>) => void;
  deleteDay: (planId: string, dayId: string) => void;
  reorderDays: (planId: string, dayIds: string[]) => void;

  // Block actions
  addBlock: (planId: string, dayId: string, type: BlockType, title?: string) => string;
  updateBlock: (planId: string, dayId: string, blockId: string, updates: Partial<Pick<Block, 'type' | 'title'>>) => void;
  deleteBlock: (planId: string, dayId: string, blockId: string) => void;

  // Exercise actions
  addExercise: (planId: string, dayId: string, blockId: string, exercise: Omit<ExerciseTemplate, 'id'>) => string;
  updateExercise: (planId: string, dayId: string, blockId: string, exerciseId: string, updates: Partial<ExerciseTemplate>) => void;
  deleteExercise: (planId: string, dayId: string, blockId: string, exerciseId: string) => void;
  reorderExercises: (planId: string, dayId: string, blockId: string, exerciseIds: string[]) => void;

  // Session actions
  startSession: (planId: string, dayId: string) => string;
  updateSession: (sessionId: string, updates: Partial<WorkoutSession>) => void;
  completeSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;

  // Session exercise/set actions
  updateWorkoutExercise: (sessionId: string, templateId: string, updates: Partial<WorkoutExercise>) => void;
  addWorkoutSet: (sessionId: string, templateId: string) => void;
  updateWorkoutSet: (sessionId: string, templateId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  deleteWorkoutSet: (sessionId: string, templateId: string, setId: string) => void;

  // Manual session (nachtragen)
  addManualSession: (planId: string, dayId: string, date: string) => string;

  // Body weight
  addBodyWeightEntry: (weight: number, date?: string, note?: string) => void;
  deleteBodyWeightEntry: (id: string) => void;

  // Meal tracking
  addMealEntry: (entry: Omit<MealEntry, 'id'>) => void;
  deleteMealEntry: (id: string) => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const samplePlan: Plan = {
  id: 'plan-1',
  name: 'Kraftplan A/B',
  notes: '4-Tage Kraft-Hypertrophie Split',
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  days: [
    {
      id: 'day-1a',
      title: 'Tag 1A – Brust / Trizeps',
      position: 0,
      notes: 'Fokus auf progressive Überlastung bei Bankdrücken',
      blocks: [
        {
          id: 'block-1a-warmup',
          type: 'warmup',
          title: 'Warm-up',
          exercises: [
            {
              id: 'ex-1a-1',
              name: 'Rudergerät',
              type: 'check-timer',
              targetSets: 1,
              targetRepsMin: 5,
              targetRepsMax: 5,
              defaultWeight: 0,
              notes: '5 Minuten lockeres Aufwärmen',
              settings: [{ id: 's1', label: 'Dauer (Min)', type: 'number', unit: 'min', value: '5' }],
              alternatives: [],
              tags: ['cardio'],
            },
          ],
        },
        {
          id: 'block-1a-main',
          type: 'main',
          title: 'Hauptteil',
          exercises: [
            {
              id: 'ex-1a-2',
              name: 'Flachbank Bankdrücken',
              type: 'rep-range',
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 8,
              defaultWeight: 80,
              notes: 'Vollständige Pause zwischen Sätzen',
              settings: [],
              alternatives: ['Dumbbell Bankdrücken'],
              tags: ['brust', 'trizeps'],
            },
            {
              id: 'ex-1a-3',
              name: 'Schrägbank Bankdrücken',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 10,
              defaultWeight: 65,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['brust'],
            },
            {
              id: 'ex-1a-4',
              name: 'Trizeps Pushdown',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 12,
              defaultWeight: 35,
              notes: '',
              settings: [],
              alternatives: ['Trizeps Overhead'],
              tags: ['trizeps'],
            },
          ],
        },
        {
          id: 'block-1a-extras',
          type: 'extras',
          title: 'Extras',
          exercises: [
            {
              id: 'ex-1a-5',
              name: 'Kabelfliegem',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 12,
              targetRepsMax: 15,
              defaultWeight: 20,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['brust'],
            },
          ],
        },
      ],
    },
    {
      id: 'day-2a',
      title: 'Tag 2A – Rücken / Bizeps',
      position: 1,
      notes: '',
      blocks: [
        {
          id: 'block-2a-warmup',
          type: 'warmup',
          title: 'Warm-up',
          exercises: [
            {
              id: 'ex-2a-1',
              name: 'Armkreisen & Schulter Rotation',
              type: 'check-timer',
              targetSets: 1,
              targetRepsMin: 3,
              targetRepsMax: 3,
              defaultWeight: 0,
              notes: '',
              settings: [],
              alternatives: [],
              tags: [],
            },
          ],
        },
        {
          id: 'block-2a-main',
          type: 'main',
          title: 'Hauptteil',
          exercises: [
            {
              id: 'ex-2a-2',
              name: 'Kreuzheben',
              type: 'rep-range',
              targetSets: 4,
              targetRepsMin: 5,
              targetRepsMax: 6,
              defaultWeight: 100,
              notes: 'Volle Konzentration auf Technik',
              settings: [],
              alternatives: [],
              tags: ['rücken', 'beine'],
            },
            {
              id: 'ex-2a-3',
              name: 'Klimmzüge',
              type: 'max-reps',
              targetSets: 3,
              targetRepsMin: 6,
              targetRepsMax: 10,
              defaultWeight: 0,
              notes: '',
              settings: [],
              alternatives: ['Latzug'],
              tags: ['rücken', 'bizeps'],
            },
            {
              id: 'ex-2a-4',
              name: 'Langhantel Rudern',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 10,
              defaultWeight: 70,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['rücken'],
            },
          ],
        },
        {
          id: 'block-2a-extras',
          type: 'extras',
          title: 'Extras',
          exercises: [
            {
              id: 'ex-2a-5',
              name: 'Hammer Curls',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 12,
              defaultWeight: 16,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['bizeps'],
            },
          ],
        },
      ],
    },
    {
      id: 'day-1b',
      title: 'Tag 1B – Schultern / Brust',
      position: 2,
      notes: '',
      blocks: [
        {
          id: 'block-1b-main',
          type: 'main',
          title: 'Hauptteil',
          exercises: [
            {
              id: 'ex-1b-1',
              name: 'Schulterdrücken (LH)',
              type: 'rep-range',
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 8,
              defaultWeight: 50,
              notes: '',
              settings: [],
              alternatives: ['Schulterdrücken (KH)'],
              tags: ['schultern'],
            },
            {
              id: 'ex-1b-2',
              name: 'Seitheben',
              type: 'rep-range',
              targetSets: 4,
              targetRepsMin: 12,
              targetRepsMax: 15,
              defaultWeight: 12,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['schultern'],
            },
            {
              id: 'ex-1b-3',
              name: 'Dips',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              defaultWeight: 0,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['brust', 'trizeps'],
            },
          ],
        },
        {
          id: 'block-1b-extras',
          type: 'extras',
          title: 'Extras',
          exercises: [
            {
              id: 'ex-1b-4',
              name: 'Face Pulls',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 15,
              targetRepsMax: 20,
              defaultWeight: 25,
              notes: 'Wichtig für Schultergesundheit',
              settings: [],
              alternatives: [],
              tags: ['schultern'],
            },
          ],
        },
      ],
    },
    {
      id: 'day-2b',
      title: 'Tag 2B – Beine',
      position: 3,
      notes: 'Leg Day! Kein Überspringen.',
      blocks: [
        {
          id: 'block-2b-warmup',
          type: 'warmup',
          title: 'Warm-up',
          exercises: [
            {
              id: 'ex-2b-1',
              name: 'Fahrradergometer',
              type: 'check-timer',
              targetSets: 1,
              targetRepsMin: 5,
              targetRepsMax: 5,
              defaultWeight: 0,
              notes: '5 Min locker',
              settings: [{ id: 's2', label: 'Dauer (Min)', type: 'number', unit: 'min', value: '5' }],
              alternatives: [],
              tags: ['cardio'],
            },
          ],
        },
        {
          id: 'block-2b-main',
          type: 'main',
          title: 'Hauptteil',
          exercises: [
            {
              id: 'ex-2b-2',
              name: 'Kniebeugen',
              type: 'rep-range',
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 8,
              defaultWeight: 90,
              notes: 'Auf volle Tiefe achten',
              settings: [],
              alternatives: ['Goblet Squat'],
              tags: ['beine'],
            },
            {
              id: 'ex-2b-3',
              name: 'Beinpresse',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 12,
              defaultWeight: 150,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['beine'],
            },
            {
              id: 'ex-2b-4',
              name: 'Rumänisches Kreuzheben',
              type: 'rep-range',
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 12,
              defaultWeight: 60,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['beine', 'rücken'],
            },
          ],
        },
        {
          id: 'block-2b-extras',
          type: 'extras',
          title: 'Extras',
          exercises: [
            {
              id: 'ex-2b-5',
              name: 'Wadenheben',
              type: 'rep-range',
              targetSets: 4,
              targetRepsMin: 15,
              targetRepsMax: 20,
              defaultWeight: 40,
              notes: '',
              settings: [],
              alternatives: [],
              tags: ['beine'],
            },
          ],
        },
      ],
    },
  ],
};

const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
const pastDateEnd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000).toISOString();

const sampleSession: WorkoutSession = {
  id: 'session-sample-1',
  planId: 'plan-1',
  planName: 'Kraftplan A/B',
  dayId: 'day-1a',
  dayTitle: 'Tag 1A – Brust / Trizeps',
  date: pastDate,
  startedAt: pastDate,
  completedAt: pastDateEnd,
  completed: true,
  exercises: [
    {
      templateId: 'ex-1a-2',
      name: 'Flachbank Bankdrücken',
      type: 'rep-range',
      targetSets: 4,
      targetRepsMin: 6,
      targetRepsMax: 8,
      settingValues: [],
      sets: [
        { id: 'set-s1-1', exerciseTemplateId: 'ex-1a-2', weight: 80, reps: 8, done: true },
        { id: 'set-s1-2', exerciseTemplateId: 'ex-1a-2', weight: 80, reps: 7, done: true },
        { id: 'set-s1-3', exerciseTemplateId: 'ex-1a-2', weight: 80, reps: 7, done: true },
        { id: 'set-s1-4', exerciseTemplateId: 'ex-1a-2', weight: 77.5, reps: 8, done: true },
      ],
    },
    {
      templateId: 'ex-1a-3',
      name: 'Schrägbank Bankdrücken',
      type: 'rep-range',
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      settingValues: [],
      sets: [
        { id: 'set-s1-5', exerciseTemplateId: 'ex-1a-3', weight: 65, reps: 10, done: true },
        { id: 'set-s1-6', exerciseTemplateId: 'ex-1a-3', weight: 65, reps: 9, done: true },
        { id: 'set-s1-7', exerciseTemplateId: 'ex-1a-3', weight: 65, reps: 9, done: true },
      ],
    },
    {
      templateId: 'ex-1a-4',
      name: 'Trizeps Pushdown',
      type: 'rep-range',
      targetSets: 3,
      targetRepsMin: 10,
      targetRepsMax: 12,
      settingValues: [],
      sets: [
        { id: 'set-s1-8', exerciseTemplateId: 'ex-1a-4', weight: 35, reps: 12, done: true },
        { id: 'set-s1-9', exerciseTemplateId: 'ex-1a-4', weight: 35, reps: 11, done: true },
        { id: 'set-s1-10', exerciseTemplateId: 'ex-1a-4', weight: 35, reps: 10, done: true },
      ],
    },
    {
      templateId: 'ex-1a-5',
      name: 'Kabelfliegem',
      type: 'rep-range',
      targetSets: 3,
      targetRepsMin: 12,
      targetRepsMax: 15,
      settingValues: [],
      sets: [
        { id: 'set-s1-11', exerciseTemplateId: 'ex-1a-5', weight: 20, reps: 15, done: true },
        { id: 'set-s1-12', exerciseTemplateId: 'ex-1a-5', weight: 20, reps: 13, done: true },
        { id: 'set-s1-13', exerciseTemplateId: 'ex-1a-5', weight: 20, reps: 12, done: true },
      ],
    },
  ],
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      plans: [samplePlan],
      sessions: [sampleSession],
      activeSessionId: null,
      settings: { unit: 'kg', macroGoals: { calories: 2500, protein: 150, carbs: 280, fat: 80 } },
      bodyWeightEntries: [],
      mealEntries: [],

      // ── Plan actions ──────────────────────────────────────────────────────
      addPlan: (name, notes) => {
        const id = generateId();
        set(state => ({
          plans: [
            ...state.plans,
            { id, name, notes, days: [], createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      updatePlan: (planId, updates) =>
        set(state => ({
          plans: state.plans.map(p => (p.id === planId ? { ...p, ...updates } : p)),
        })),

      deletePlan: (planId) =>
        set(state => ({
          plans: state.plans.filter(p => p.id !== planId),
          sessions: state.sessions.filter(s => s.planId !== planId),
        })),

      // ── Day actions ───────────────────────────────────────────────────────
      addDay: (planId, title) => {
        const id = generateId();
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: [...p.days, { id, title, position: p.days.length, blocks: [] }],
            };
          }),
        }));
        return id;
      },

      updateDay: (planId, dayId, updates) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => (d.id === dayId ? { ...d, ...updates } : d)),
            };
          }),
        })),

      deleteDay: (planId, dayId) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return { ...p, days: p.days.filter(d => d.id !== dayId) };
          }),
        })),

      reorderDays: (planId, dayIds) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            const reordered = dayIds.map((id, idx) => {
              const day = p.days.find(d => d.id === id)!;
              return { ...day, position: idx };
            });
            return { ...p, days: reordered };
          }),
        })),

      // ── Block actions ─────────────────────────────────────────────────────
      addBlock: (planId, dayId, type, title) => {
        const id = generateId();
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => {
                if (d.id !== dayId) return d;
                return {
                  ...d,
                  blocks: [...d.blocks, { id, type, title, exercises: [] }],
                };
              }),
            };
          }),
        }));
        return id;
      },

      updateBlock: (planId, dayId, blockId, updates) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => {
                if (d.id !== dayId) return d;
                return {
                  ...d,
                  blocks: d.blocks.map(b => (b.id === blockId ? { ...b, ...updates } : b)),
                };
              }),
            };
          }),
        })),

      deleteBlock: (planId, dayId, blockId) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => {
                if (d.id !== dayId) return d;
                return { ...d, blocks: d.blocks.filter(b => b.id !== blockId) };
              }),
            };
          }),
        })),

      // ── Exercise actions ──────────────────────────────────────────────────
      addExercise: (planId, dayId, blockId, exercise) => {
        const id = generateId();
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => {
                if (d.id !== dayId) return d;
                return {
                  ...d,
                  blocks: d.blocks.map(b => {
                    if (b.id !== blockId) return b;
                    return { ...b, exercises: [...b.exercises, { ...exercise, id }] };
                  }),
                };
              }),
            };
          }),
        }));
        return id;
      },

      updateExercise: (planId, dayId, blockId, exerciseId, updates) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => {
                if (d.id !== dayId) return d;
                return {
                  ...d,
                  blocks: d.blocks.map(b => {
                    if (b.id !== blockId) return b;
                    return {
                      ...b,
                      exercises: b.exercises.map(e =>
                        e.id === exerciseId ? { ...e, ...updates } : e
                      ),
                    };
                  }),
                };
              }),
            };
          }),
        })),

      deleteExercise: (planId, dayId, blockId, exerciseId) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => {
                if (d.id !== dayId) return d;
                return {
                  ...d,
                  blocks: d.blocks.map(b => {
                    if (b.id !== blockId) return b;
                    return { ...b, exercises: b.exercises.filter(e => e.id !== exerciseId) };
                  }),
                };
              }),
            };
          }),
        })),

      reorderExercises: (planId, dayId, blockId, exerciseIds) =>
        set(state => ({
          plans: state.plans.map(p => {
            if (p.id !== planId) return p;
            return {
              ...p,
              days: p.days.map(d => {
                if (d.id !== dayId) return d;
                return {
                  ...d,
                  blocks: d.blocks.map(b => {
                    if (b.id !== blockId) return b;
                    const reordered = exerciseIds.map(id => b.exercises.find(e => e.id === id)!);
                    return { ...b, exercises: reordered };
                  }),
                };
              }),
            };
          }),
        })),

      // ── Session actions ───────────────────────────────────────────────────
      startSession: (planId, dayId) => {
        const state = get();
        const plan = state.plans.find(p => p.id === planId);
        if (!plan) throw new Error('Plan not found');
        const day = plan.days.find(d => d.id === dayId);
        if (!day) throw new Error('Day not found');

        const sessionId = generateId();
        const now = new Date().toISOString();

        // Build exercises from template, prefilling weights from last session
        const completedSessions = state.sessions
          .filter(s => s.planId === planId && s.dayId === dayId && s.completed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastSession = completedSessions[0];

        const exercises: WorkoutExercise[] = day.blocks.flatMap(block =>
          block.exercises.map(tmpl => {
            const lastEx = lastSession?.exercises.find(e => e.templateId === tmpl.id);
            const lastSets = lastEx?.sets.filter(s => s.done) ?? [];

            const sets: WorkoutSet[] = Array.from({ length: tmpl.targetSets }, (_, i) => ({
              id: generateId(),
              exerciseTemplateId: tmpl.id,
              weight: lastSets[i]?.weight ?? tmpl.defaultWeight,
              reps: lastSets[i]?.reps,
              done: false,
            }));

            return {
              templateId: tmpl.id,
              name: tmpl.name,
              type: tmpl.type,
              targetSets: tmpl.targetSets,
              targetRepsMin: tmpl.targetRepsMin,
              targetRepsMax: tmpl.targetRepsMax,
              sets,
              settingValues: tmpl.settings,
            };
          })
        );

        const session: WorkoutSession = {
          id: sessionId,
          planId,
          planName: plan.name,
          dayId,
          dayTitle: day.title,
          date: now,
          startedAt: now,
          exercises,
          completed: false,
        };

        set(state => ({
          sessions: [...state.sessions, session],
          activeSessionId: sessionId,
        }));

        return sessionId;
      },

      updateSession: (sessionId, updates) =>
        set(state => ({
          sessions: state.sessions.map(s => (s.id === sessionId ? { ...s, ...updates } : s)),
        })),

      completeSession: (sessionId) =>
        set(state => ({
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? { ...s, completed: true, completedAt: new Date().toISOString() }
              : s
          ),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        })),

      deleteSession: (sessionId) =>
        set(state => ({
          sessions: state.sessions.filter(s => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        })),

      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

      // ── Workout exercise/set actions ──────────────────────────────────────
      updateWorkoutExercise: (sessionId, templateId, updates) =>
        set(state => ({
          sessions: state.sessions.map(s => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              exercises: s.exercises.map(e =>
                e.templateId === templateId ? { ...e, ...updates } : e
              ),
            };
          }),
        })),

      addWorkoutSet: (sessionId, templateId) =>
        set(state => ({
          sessions: state.sessions.map(s => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              exercises: s.exercises.map(e => {
                if (e.templateId !== templateId) return e;
                const lastSet = e.sets[e.sets.length - 1];
                const newSet: WorkoutSet = {
                  id: generateId(),
                  exerciseTemplateId: templateId,
                  weight: lastSet?.weight,
                  reps: lastSet?.reps,
                  done: false,
                };
                return { ...e, sets: [...e.sets, newSet] };
              }),
            };
          }),
        })),

      updateWorkoutSet: (sessionId, templateId, setId, updates) =>
        set(state => ({
          sessions: state.sessions.map(s => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              exercises: s.exercises.map(e => {
                if (e.templateId !== templateId) return e;
                return {
                  ...e,
                  sets: e.sets.map(st => (st.id === setId ? { ...st, ...updates } : st)),
                };
              }),
            };
          }),
        })),

      deleteWorkoutSet: (sessionId, templateId, setId) =>
        set(state => ({
          sessions: state.sessions.map(s => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              exercises: s.exercises.map(e => {
                if (e.templateId !== templateId) return e;
                return { ...e, sets: e.sets.filter(st => st.id !== setId) };
              }),
            };
          }),
        })),

      // ── Manual session (nachtragen) ──────────────────────────────────────
      addManualSession: (planId, dayId, date) => {
        const state = get();
        const plan = state.plans.find(p => p.id === planId);
        if (!plan) throw new Error('Plan not found');
        const day = plan.days.find(d => d.id === dayId);
        if (!day) throw new Error('Day not found');

        const sessionId = generateId();
        const exercises: WorkoutExercise[] = day.blocks.flatMap(block =>
          block.exercises.map(tmpl => {
            const sets: WorkoutSet[] = Array.from({ length: tmpl.targetSets }, () => ({
              id: generateId(),
              exerciseTemplateId: tmpl.id,
              weight: tmpl.defaultWeight,
              done: false,
            }));
            return {
              templateId: tmpl.id,
              name: tmpl.name,
              type: tmpl.type,
              targetSets: tmpl.targetSets,
              targetRepsMin: tmpl.targetRepsMin,
              targetRepsMax: tmpl.targetRepsMax,
              sets,
              settingValues: tmpl.settings,
            };
          })
        );

        const session: WorkoutSession = {
          id: sessionId,
          planId,
          planName: plan.name,
          dayId,
          dayTitle: day.title,
          date,
          startedAt: date,
          exercises,
          completed: false,
        };

        set(state => ({
          sessions: [...state.sessions, session],
          activeSessionId: sessionId,
        }));

        return sessionId;
      },

      // ── Body weight ──────────────────────────────────────────────────────
      addBodyWeightEntry: (weight, date, note) =>
        set(state => ({
          bodyWeightEntries: [
            ...state.bodyWeightEntries,
            {
              id: generateId(),
              date: date ?? new Date().toISOString(),
              weight,
              note,
            },
          ],
        })),

      deleteBodyWeightEntry: (id) =>
        set(state => ({
          bodyWeightEntries: state.bodyWeightEntries.filter(e => e.id !== id),
        })),

      // ── Meal tracking ──────────────────────────────────────────────────────
      addMealEntry: (entry) =>
        set(state => ({
          mealEntries: [...state.mealEntries, { ...entry, id: generateId() }],
        })),

      deleteMealEntry: (id) =>
        set(state => ({
          mealEntries: state.mealEntries.filter(e => e.id !== id),
        })),

      // ── Settings ──────────────────────────────────────────────────────────
      updateSettings: (updates) =>
        set(state => ({ settings: { ...state.settings, ...updates } })),
    }),
    {
      name: 'fitness-app-store',
    }
  )
);
