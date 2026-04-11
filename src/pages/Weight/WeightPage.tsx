import { useState } from 'react';
import { Scale, Utensils, Settings } from 'lucide-react';
import Header from '../../components/Header';
import WeightTab from './WeightTab';
import NutritionTab from './NutritionTab';
import { useNavigate } from 'react-router-dom';

type SubTab = 'weight' | 'nutrition';

export default function WeightPage() {
  const [activeTab, setActiveTab] = useState<SubTab>('weight');
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto">
      <Header
        title="Körper"
        right={
          <button
            onClick={() => navigate('/settings')}
            className="w-9 h-9 flex items-center justify-center rounded-lg active:bg-zinc-800 transition-colors text-zinc-400"
          >
            <Settings size={18} />
          </button>
        }
      />

      {/* Sub-tab bar */}
      <div className="px-4 pt-3">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('weight')}
            className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'weight'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <Scale size={16} />
            Gewicht
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'nutrition'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 active:text-zinc-300'
            }`}
          >
            <Utensils size={16} />
            Ernährung
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === 'weight' ? <WeightTab /> : <NutritionTab />}
      </div>
    </div>
  );
}
