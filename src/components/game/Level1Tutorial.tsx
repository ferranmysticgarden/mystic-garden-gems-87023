import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Sparkles } from 'lucide-react';

interface Level1TutorialProps {
  levelId: number;
  firstMatchMade: boolean;
  onDismiss?: () => void;
}

const STORAGE_KEY = 'mg_tutorial_level1_done_v1';

export const Level1Tutorial = ({ levelId, firstMatchMade, onDismiss }: Level1TutorialProps) => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (levelId !== 1) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, [levelId]);

  // advance to step 2 on first match, auto-dismiss shortly after
  useEffect(() => {
    if (!visible) return;
    if (firstMatchMade && step === 1) {
      setStep(2);
      const t = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
        onDismiss?.();
      }, 2600);
      return () => clearTimeout(t);
    }
  }, [firstMatchMade, step, visible, onDismiss]);

  if (!visible || levelId !== 1) return null;

  const step1Title =
    language === 'es' ? '¡Bienvenido al Jardín!' :
    language === 'pt' ? 'Bem-vindo ao Jardim!' :
    'Welcome to the Garden!';
  const step1Body =
    language === 'es' ? 'Toca una ficha y luego una adyacente para intercambiarlas. Forma grupos de 3 o más iguales para recolectarlas.' :
    language === 'pt' ? 'Toque em uma peça e depois em uma adjacente para trocá-las. Forme grupos de 3 ou mais iguais para coletá-las.' :
    'Tap a tile, then an adjacent one to swap them. Match 3 or more identical tiles to collect them.';
  const step2Title =
    language === 'es' ? '¡Perfecto! 🎉' :
    language === 'pt' ? 'Perfeito! 🎉' :
    'Perfect! 🎉';
  const step2Body =
    language === 'es' ? 'Sigue así. Recolecta las fichas del objetivo antes de quedarte sin movimientos.' :
    language === 'pt' ? 'Continue assim. Colete as peças do objetivo antes de acabar os movimentos.' :
    'Keep going. Collect the objective tiles before you run out of moves.';
  const tapHint =
    language === 'es' ? 'Toca el tablero para jugar' :
    language === 'pt' ? 'Toque no tabuleiro para jogar' :
    'Tap the board to play';

  const title = step === 1 ? step1Title : step2Title;
  const body = step === 1 ? step1Body : step2Body;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none animate-fade-in">
      {/* tooltip card */}
      <div className="mx-auto max-w-sm m-4 pointer-events-auto">
        <div
          className="relative rounded-2xl p-4 border-2 border-yellow-400/60 shadow-2xl"
          style={{
            background:
              'linear-gradient(140deg, hsl(270 60% 25% / 0.97), hsl(250 55% 18% / 0.97))',
            boxShadow:
              '0 0 30px rgba(255, 215, 0, 0.35), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl shrink-0 animate-bounce" style={{ animationDuration: '1.4s' }}>
              🧚‍♀️
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2 mb-1">
                {title}
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
              </h3>
              <p className="text-sm text-emerald-50/90 leading-snug">
                {body}
              </p>
              {step === 1 && (
                <p className="mt-2 text-xs text-yellow-200/70 italic">
                  👆 {tapHint}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
