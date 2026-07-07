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
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (levelId !== 1) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, [levelId]);

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

  const title = step === 1 ? t('l1tut.welcome_title') : t('l1tut.perfect_title');
  const body = step === 1 ? t('l1tut.welcome_body') : t('l1tut.perfect_body');
  const tapHint = t('l1tut.tap_hint');


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
