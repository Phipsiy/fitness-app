import { format, formatDistanceStrict } from 'date-fns';
import { de } from 'date-fns/locale';
import type { WorkoutSession, ExerciseType, BlockType } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd.MM.yyyy HH:mm', { locale: de });
  } catch {
    return dateStr;
  }
}

export function formatDuration(startIso: string, endIso: string): string {
  try {
    return formatDistanceStrict(new Date(startIso), new Date(endIso), { locale: de });
  } catch {
    return '–';
  }
}

export function getSessionDuration(session: WorkoutSession): string {
  if (!session.startedAt || !session.completedAt) return '–';
  return formatDuration(session.startedAt, session.completedAt);
}

export function getExerciseTypeLabel(type: ExerciseType): string {
  switch (type) {
    case 'rep-range': return 'Wiederholungsbereich';
    case 'max-reps': return 'Max Wiederholungen';
    case 'fixed-reps': return 'Feste Wiederholungen';
    case 'check-timer': return 'Timer/Check';
  }
}

export function getBlockTypeLabel(type: BlockType): string {
  switch (type) {
    case 'warmup': return 'Warm-up';
    case 'main': return 'Hauptteil';
    case 'circuit': return 'Circuit';
    case 'extras': return 'Extras';
    case 'mobility': return 'Mobility';
    case 'makeup': return 'Nachholen';
  }
}

export function formatTargetSets(targetSets: number, repsMin?: number, repsMax?: number): string {
  if (repsMin !== undefined && repsMax !== undefined) {
    return `${targetSets}×${repsMin}–${repsMax}`;
  }
  if (repsMin !== undefined) {
    return `${targetSets}×${repsMin}`;
  }
  return `${targetSets} Sätze`;
}

export function convertWeight(weight: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lbs') return Math.round(weight * 2.20462 * 4) / 4;
  return Math.round(weight / 2.20462 * 4) / 4;
}

export function getTopSetWeight(session: WorkoutSession, exerciseName: string): number | undefined {
  const ex = session.exercises.find(e => e.name === exerciseName);
  if (!ex) return undefined;
  const doneSets = ex.sets.filter(s => s.done && s.weight !== undefined);
  if (!doneSets.length) return undefined;
  return Math.max(...doneSets.map(s => s.weight!));
}

export function getLastSessionWeight(
  sessions: WorkoutSession[],
  planId: string,
  dayId: string,
  exerciseName: string
): number | undefined {
  const completed = sessions
    .filter(s => s.planId === planId && s.dayId === dayId && s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const session of completed) {
    const ex = session.exercises.find(e => e.name === exerciseName);
    if (ex) {
      const doneSets = ex.sets.filter(s => s.done && s.weight !== undefined);
      if (doneSets.length) {
        return doneSets[doneSets.length - 1].weight;
      }
    }
  }
  return undefined;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
