import { NavLink } from 'react-router-dom';
import { CalendarDays, BarChart2, Dumbbell, ClipboardList, Scale } from 'lucide-react';
import { useStore } from '../store/useStore';

const tabs = [
  { to: '/plans', label: 'Pläne', icon: ClipboardList },
  { to: '/training', label: 'Training', icon: Dumbbell },
  { to: '/calendar', label: 'Kalender', icon: CalendarDays },
  { to: '/stats', label: 'Statistik', icon: BarChart2 },
  { to: '/weight', label: 'Körper', icon: Scale },
];

export default function BottomNav() {
  const activeSessionId = useStore(s => s.activeSessionId);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 safe-area-bottom">
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 gap-0.5 text-xs transition-colors relative ${
                isActive ? 'text-blue-500' : 'text-zinc-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  {to === '/training' && activeSessionId && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-zinc-900" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-500' : 'text-zinc-500'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
