import { useEffect, useState } from 'react';

interface ComboMultiplierProps {
  combo: number;
  onComboEnd?: () => void;
}

export const ComboMultiplier = ({ combo, onComboEnd }: ComboMultiplierProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (combo >= 3) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComboEnd?.();
      }, 800); // Reducido de 2000ms a 800ms para no molestar
      return () => clearTimeout(timer);
    }
  }, [combo, onComboEnd]);

  if (!show || combo < 3) return null;

  const getMultiplierText = () => {
    if (combo >= 7) return '🔥x4';
    if (combo >= 5) return '⚡x3';
    if (combo >= 3) return '✨x2';
    return '';
  };

  const getColorClass = () => {
    if (combo >= 7) return 'from-red-500 to-orange-500';
    if (combo >= 5) return 'from-yellow-500 to-orange-500';
    return 'from-purple-500 to-pink-500';
  };

  // Ahora aparece en la esquina superior derecha, pequeño y sin bloquear
  return (
    <div className="fixed top-20 right-4 pointer-events-none z-40 animate-in slide-in-from-right duration-300">
      <div className={`bg-gradient-to-r ${getColorClass()} px-3 py-1.5 rounded-full shadow-lg`}>
        <p className="text-lg font-bold text-white drop-shadow">
          {getMultiplierText()}
        </p>
      </div>
    </div>
  );
};
