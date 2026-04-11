import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import PlansPage from './pages/Plans/PlansPage';
import PlanDetailPage from './pages/Plans/PlanDetailPage';
import DayEditorPage from './pages/Plans/DayEditorPage';
import TrainingPage from './pages/Training/TrainingPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import StatsPage from './pages/Stats/StatsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import WeightPage from './pages/Weight/WeightPage';

export default function App() {
  return (
    <BrowserRouter basename="/fitness-app">
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/plans" replace />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/plans/:planId" element={<PlanDetailPage />} />
          <Route path="/plans/:planId/day/:dayId" element={<DayEditorPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/weight" element={<WeightPage />} />
        </Routes>
      </div>
      <BottomNav />
    </BrowserRouter>
  );
}
