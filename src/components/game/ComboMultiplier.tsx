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
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [combo, onComboEnd]);

  if (!show || combo < 3) return null;

  const getMultiplierText = () => {
    if (combo >= 7) return '🔥 INCREÍBLE! x4';
    if (combo >= 5) return '⚡ GENIAL! x3';
    if (combo >= 3) return '✨ COMBO! x2';
    return '';
  };

  const getColorClass = () => {
    if (combo >= 7) return 'from-red-500 to-orange-500';
    if (combo >= 5) return 'from-yellow-500 to-orange-500';
    return 'from-purple-500 to-pink-500';
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
      <div className={`bg-gradient-to-r ${getColorClass()} px-8 py-4 rounded-2xl animate-bounce shadow-2xl`}>
        <p className="text-3xl font-bold text-white drop-shadow-lg">
          {getMultiplierText()}
        </p>
        <p className="text-center text-white/80 text-sm">
          {combo} combos seguidos
        </p>
      </div>
    </div>
  );
};
