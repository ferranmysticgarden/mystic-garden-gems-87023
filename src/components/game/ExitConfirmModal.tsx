import { X, LogOut, Save } from 'lucide-react';
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
      // For web, just close the modal
      onStay();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900 rounded-3xl p-6 max-w-sm w-full border-4 border-purple-400/50 shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-2xl font-bold text-purple-300 mb-2">
            ¿Quieres salir?
          </h2>
          <p className="text-purple-100/80 text-sm">
            Tu progreso está guardado automáticamente
          </p>
        </div>

        {/* Streak reminder */}
        {streak > 0 && (
          <div className="bg-orange-500/20 rounded-xl p-4 mb-6 border border-orange-400/30">
            <div className="flex items-center justify-center gap-2 text-orange-300">
              <span className="text-2xl">🔥</span>
              <span className="font-semibold">Racha de {streak} días</span>
            </div>
            <p className="text-orange-200/70 text-xs text-center mt-1">
              ¡Vuelve mañana para mantenerla!
            </p>
          </div>
        )}

        {/* Tomorrow reminder */}
        <div className="bg-emerald-500/20 rounded-xl p-4 mb-6 border border-emerald-400/30">
          <div className="flex items-center gap-3">
            <Save className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-emerald-300 font-semibold text-sm">
                ¡Vuelve mañana!
              </p>
              <p className="text-emerald-200/70 text-xs">
                Te esperan recompensas diarias 🎁
              </p>
            </div>
          </div>
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
            variant="outline"
            className="w-full py-4 border-red-400/50 text-red-300 hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Salir del Juego
          </Button>
        </div>
      </div>
    </div>
  );
};
