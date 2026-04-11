import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  right?: React.ReactNode;
}

export default function Header({ title, showBack = false, backTo, right }: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-blue-500 -ml-2 h-10 px-2 rounded-lg active:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 className="flex-1 font-semibold text-lg truncate">{title}</h1>
        {right && <div className="ml-2">{right}</div>}
      </div>
    </header>
  );
}
