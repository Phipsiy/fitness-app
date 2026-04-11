import { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Flame, Beef, Wheat, Droplets, ScanBarcode, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import BarcodeScanner from '../../components/BarcodeScanner';
import type { MealType } from '../../types';

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Frühstück', emoji: '🌅' },
  { value: 'lunch', label: 'Mittagessen', emoji: '☀️' },
  { value: 'dinner', label: 'Abendessen', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
];

function MacroBar({ label, current, goal, color, icon: Icon }: {
  label: string;
  current: number;
  goal: number;
  color: string;
  icon: React.ElementType;
}) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const over = current > goal;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={color} />
          <span className="text-xs text-zinc-400">{label}</span>
        </div>
        <span className={`text-xs font-semibold ${over ? 'text-red-400' : 'text-zinc-300'}`}>
          {Math.round(current)} / {goal}g
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${over ? 'bg-red-500' : ''}`}
          style={{
            width: `${pct}%`,
            backgroundColor: over ? undefined : color.includes('blue') ? '#3b82f6' : color.includes('amber') ? '#f59e0b' : color.includes('green') ? '#22c55e' : '#a855f7',
          }}
        />
      </div>
    </div>
  );
}

export default function NutritionTab() {
  const { mealEntries, addMealEntry, deleteMealEntry, settings, updateSettings } = useStore();
  const goals = settings.macroGoals;

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add form
  const [formName, setFormName] = useState('');
  const [formCal, setFormCal] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarbs, setFormCarbs] = useState('');
  const [formFat, setFormFat] = useState('');
  const [formMealType, setFormMealType] = useState<MealType>('lunch');

  // Scanner
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Goals form
  const [gCal, setGCal] = useState(String(goals.calories));
  const [gProtein, setGProtein] = useState(String(goals.protein));
  const [gCarbs, setGCarbs] = useState(String(goals.carbs));
  const [gFat, setGFat] = useState(String(goals.fat));

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setShowScanner(false);
    setScanLoading(true);
    setScanError(null);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        const nutriments = p.nutriments || {};
        const name = p.product_name_de || p.product_name || p.brands || 'Unbekanntes Produkt';
        const servingG = parseFloat(p.serving_quantity) || 100;
        const per = p.nutrition_data_per === 'serving' ? 1 : servingG / 100;

        setFormName(name + (p.brands ? ` (${p.brands})` : ''));
        setFormCal(String(Math.round((nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0) * per)));
        setFormProtein(String(Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * per * 10) / 10));
        setFormCarbs(String(Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * per * 10) / 10));
        setFormFat(String(Math.round((nutriments.fat_100g || nutriments.fat || 0) * per * 10) / 10));
        setShowAdd(true);
      } else {
        setScanError(`Produkt nicht gefunden (Barcode: ${barcode}). Du kannst es manuell eintragen.`);
        setShowAdd(true);
      }
    } catch {
      setScanError('Fehler beim Abrufen der Produktdaten. Bitte prüfe deine Internetverbindung.');
      setShowAdd(true);
    } finally {
      setScanLoading(false);
    }
  }, []);

  const dayEntries = useMemo(
    () => mealEntries.filter(e => e.date.startsWith(selectedDate)),
    [mealEntries, selectedDate]
  );

  const totals = useMemo(
    () => dayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ),
    [dayEntries]
  );

  const calPct = goals.calories > 0 ? Math.min((totals.calories / goals.calories) * 100, 100) : 0;
  const calOver = totals.calories > goals.calories;

  const dateLabel = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (selectedDate === today) return 'Heute';
    if (selectedDate === yesterday) return 'Gestern';
    return new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }, [selectedDate]);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleAdd = () => {
    if (!formName.trim()) return;
    const d = new Date(selectedDate);
    d.setHours(12, 0, 0, 0);
    addMealEntry({
      date: d.toISOString(),
      name: formName.trim(),
      calories: parseFloat(formCal) || 0,
      protein: parseFloat(formProtein) || 0,
      carbs: parseFloat(formCarbs) || 0,
      fat: parseFloat(formFat) || 0,
      mealType: formMealType,
    });
    setFormName(''); setFormCal(''); setFormProtein(''); setFormCarbs(''); setFormFat('');
    setShowAdd(false);
    setScanError(null);
  };

  const handleSaveGoals = () => {
    updateSettings({
      macroGoals: {
        calories: parseInt(gCal) || 2500,
        protein: parseInt(gProtein) || 150,
        carbs: parseInt(gCarbs) || 280,
        fat: parseInt(gFat) || 80,
      },
    });
    setShowGoals(false);
  };

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 active:bg-zinc-700">
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-zinc-100">{dateLabel}</span>
        <button onClick={() => shiftDate(1)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 active:bg-zinc-700">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calorie ring / summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-5">
          {/* Calorie circle */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#27272a" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke={calOver ? '#ef4444' : '#3b82f6'}
                strokeWidth="3"
                strokeDasharray={`${calPct} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame size={14} className={calOver ? 'text-red-400' : 'text-blue-400'} />
              <span className={`text-lg font-bold ${calOver ? 'text-red-400' : 'text-zinc-100'}`}>
                {Math.round(totals.calories)}
              </span>
              <span className="text-[10px] text-zinc-500">/ {goals.calories}</span>
            </div>
          </div>

          {/* Macro bars */}
          <div className="flex-1 space-y-2.5">
            <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color="text-blue-400" icon={Beef} />
            <MacroBar label="Kohlenhydrate" current={totals.carbs} goal={goals.carbs} color="text-amber-400" icon={Wheat} />
            <MacroBar label="Fett" current={totals.fat} goal={goals.fat} color="text-purple-400" icon={Droplets} />
          </div>
        </div>

        <button
          onClick={() => {
            setGCal(String(goals.calories));
            setGProtein(String(goals.protein));
            setGCarbs(String(goals.carbs));
            setGFat(String(goals.fat));
            setShowGoals(true);
          }}
          className="mt-3 text-xs text-zinc-500 active:text-blue-400 transition-colors w-full text-center"
        >
          Ziele anpassen
        </button>
      </div>

      {/* Meal groups */}
      {MEAL_TYPES.map(({ value, label, emoji }) => {
        const meals = dayEntries.filter(e => e.mealType === value);
        if (meals.length === 0 && dayEntries.length === 0) return null;
        const groupCal = meals.reduce((s, m) => s + m.calories, 0);

        return (
          <div key={value} className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-zinc-300">{emoji} {label}</span>
              {meals.length > 0 && (
                <span className="text-xs text-zinc-500">{Math.round(groupCal)} kcal</span>
              )}
            </div>

            {meals.map(meal => (
              <div key={meal.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 truncate">{meal.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {meal.calories} kcal · P {meal.protein}g · K {meal.carbs}g · F {meal.fat}g
                  </p>
                </div>
                {deletingId === meal.id ? (
                  <div className="flex gap-1.5">
                    <button onClick={() => setDeletingId(null)} className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-400">Nein</button>
                    <button onClick={() => { deleteMealEntry(meal.id); setDeletingId(null); }} className="px-2 py-1 text-xs rounded-lg bg-red-500/20 text-red-400">Ja</button>
                  </div>
                ) : (
                  <button onClick={() => setDeletingId(meal.id)} className="w-7 h-7 flex items-center justify-center text-zinc-600 active:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {dayEntries.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-2">
          <p className="text-zinc-400 font-medium">Noch nichts getrackt</p>
          <p className="text-zinc-600 text-sm">Tippe auf + um Essen einzutragen</p>
        </div>
      )}

      {/* FABs */}
      <div className="fixed bottom-24 right-5 flex flex-col gap-3 z-40">
        {/* Barcode scan button */}
        <button
          onClick={() => { setScanError(null); setShowScanner(true); }}
          className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 text-blue-400 flex items-center justify-center shadow-lg active:bg-zinc-700 transition-colors"
        >
          <ScanBarcode size={24} />
        </button>
        {/* Manual add button */}
        <button
          onClick={() => setShowAdd(true)}
          className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:bg-blue-600 transition-colors"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Barcode scanner fullscreen */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scan loading overlay */}
      {scanLoading && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl p-6 flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
            <p className="text-zinc-300 font-medium">Produkt wird gesucht...</p>
          </div>
        </div>
      )}

      {/* Add meal modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full bg-zinc-900 rounded-t-3xl flex flex-col" style={{ maxHeight: '85dvh', marginBottom: '64px' }} onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 shrink-0">
              <h2 className="text-lg font-bold text-zinc-100">Essen eintragen</h2>
            </div>

            <div className="overflow-y-auto px-5 space-y-3 pb-3">
              {scanError && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-400">{scanError}</p>
                </div>
              )}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Was hast du gegessen? *</label>
                <input
                  type="text" placeholder="z.B. Hähnchenbrust mit Reis"
                  value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Mahlzeit</label>
                <div className="grid grid-cols-4 gap-2">
                  {MEAL_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setFormMealType(t.value)}
                      className={`h-10 rounded-xl text-xs font-medium transition-colors ${
                        formMealType === t.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 active:bg-zinc-700'
                      }`}
                    >
                      {t.emoji} {t.label.slice(0, 5)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Kalorien (kcal)</label>
                <input
                  type="number" inputMode="numeric" placeholder="0"
                  value={formCal} onChange={e => setFormCal(e.target.value)}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 text-center text-lg font-bold placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Protein (g)</label>
                  <input
                    type="number" inputMode="decimal" placeholder="0"
                    value={formProtein} onChange={e => setFormProtein(e.target.value)}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Carbs (g)</label>
                  <input
                    type="number" inputMode="decimal" placeholder="0"
                    value={formCarbs} onChange={e => setFormCarbs(e.target.value)}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Fett (g)</label>
                  <input
                    type="number" inputMode="decimal" placeholder="0"
                    value={formFat} onChange={e => setFormFat(e.target.value)}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 flex gap-3 px-5 py-4 border-t border-zinc-800">
              <button onClick={() => setShowAdd(false)} className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:bg-zinc-700">
                Abbrechen
              </button>
              <button
                onClick={handleAdd}
                disabled={!formName.trim()}
                className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-40 active:bg-blue-600 transition-colors"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals modal */}
      {showGoals && (
        <div className="fixed inset-0 z-[200] flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setShowGoals(false)}>
          <div className="w-full bg-zinc-900 rounded-t-3xl p-6 mb-16 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-zinc-100">Tagesziele anpassen</h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Kalorien (kcal)</label>
                <input type="number" inputMode="numeric" value={gCal} onChange={e => setGCal(e.target.value)}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-4 text-zinc-100 text-center outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Protein (g)</label>
                  <input type="number" inputMode="numeric" value={gProtein} onChange={e => setGProtein(e.target.value)}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Carbs (g)</label>
                  <input type="number" inputMode="numeric" value={gCarbs} onChange={e => setGCarbs(e.target.value)}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Fett (g)</label>
                  <input type="number" inputMode="numeric" value={gFat} onChange={e => setGFat(e.target.value)}
                    className="w-full h-12 bg-zinc-800 border border-zinc-700 rounded-xl px-3 text-zinc-100 text-center outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowGoals(false)} className="flex-1 h-12 rounded-xl bg-zinc-800 text-zinc-300 font-medium active:bg-zinc-700">
                Abbrechen
              </button>
              <button onClick={handleSaveGoals} className="flex-1 h-12 rounded-xl bg-blue-500 text-white font-bold active:bg-blue-600 transition-colors">
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
