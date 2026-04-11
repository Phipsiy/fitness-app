export type ExerciseType = 'rep-range' | 'max-reps' | 'fixed-reps' | 'check-timer';
export type BlockType = 'warmup' | 'main' | 'circuit' | 'extras' | 'mobility' | 'makeup';

export interface SettingField {
  id: string;
  label: string;
  type: 'number' | 'text';
  unit?: string;
  value: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  type: ExerciseType;
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  defaultWeight?: number;
  notes?: string;
  settings: SettingField[];
  alternatives: string[];
  tags: string[];
}

export interface Block {
  id: string;
  type: BlockType;
  title?: string;
  exercises: ExerciseTemplate[];
}

export interface TrainingDay {
  id: string;
  title: string;
  position: number;
  notes?: string;
  blocks: Block[];
}

export interface Plan {
  id: string;
  name: string;
  notes?: string;
  days: TrainingDay[];
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  exerciseTemplateId: string;
  weight?: number;
  reps?: number;
  note?: string;
  done: boolean;
}

export interface WorkoutExercise {
  templateId: string;
  name: string;
  type: ExerciseType;
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  sets: WorkoutSet[];
  note?: string;
  settingValues: SettingField[];
}

export interface WorkoutSession {
  id: string;
  planId: string;
  planName: string;
  dayId: string;
  dayTitle: string;
  date: string;
  note?: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
  note?: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AppSettings {
  unit: 'kg' | 'lbs';
  macroGoals: MacroGoals;
}
