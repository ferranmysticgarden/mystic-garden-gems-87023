import { LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

interface ExitConfirmModalProps {
  onStay: () => void;
  streak: number;
}

export const ExitConfirmModal = ({ onStay, streak }: ExitConfirmModalProps) => {
  const handleExit = async () => {
    if (Capacitor.isNativePlatform()) {
      await App.exitApp();
    } else {
      onStay();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-emerald-900 via-teal-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-emerald-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Emotional header - positive guilt */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🌱</div>
          <h2 className="text-xl font-bold text-emerald-300 mb-2">
            Tu jardín te estará esperando mañana
          </h2>
          <p className="text-emerald-100/70 text-sm">
            Las flores seguirán creciendo...
          </p>
        </div>

        {/* Streak warning with more friction */}
        {streak > 0 && (
          <div className="bg-red-500/30 rounded-xl p-4 mb-5 border-2 border-red-400/50 text-center animate-pulse">
            <div className="flex items-center justify-center gap-2 text-red-300 mb-2">
              <span className="text-3xl">🔥</span>
              <span className="font-bold text-lg">¡CUIDADO!</span>
              <span className="text-3xl">🔥</span>
            </div>
            <p className="text-red-200 font-semibold">
              Tu racha de <span className="text-yellow-400 font-bold">{streak} días</span> se perderá si no juegas mañana
            </p>
            <p className="text-red-300/70 text-xs mt-2">
              ¡No pierdas todo tu progreso!
            </p>
          </div>
        )}

        {/* Tomorrow teaser */}
        <div className="bg-purple-500/20 rounded-xl p-4 mb-6 border border-purple-400/30 text-center">
          <p className="text-purple-300 font-semibold text-sm">
            🎁 Mañana te esperan recompensas nuevas
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onStay}
            className="w-full py-5 text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-2 border-emerald-300 shadow-lg"
          >
            🎮 Seguir Jugando
          </Button>
          
          <Button
            onClick={handleExit}
            variant="ghost"
            className="w-full py-3 text-emerald-300/60 hover:text-emerald-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir por ahora
          </Button>
        </div>
      </div>
    </div>
  );
};
