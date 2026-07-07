import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface Step {
  title: { es: string; en: string; pt: string };
  description: { es: string; en: string; pt: string };
  image: string;
}

const STEPS: Step[] = [
  {
    title: {
      es: '¡Bienvenido a Mystic Garden! 🌸',
      en: 'Welcome to Mystic Garden! 🌸',
      pt: 'Bem-vindo ao Mystic Garden! 🌸',
    },
    description: {
      es: 'Combina 3 o más flores iguales para hacerlas desaparecer',
      en: 'Match 3 or more identical flowers to clear them',
      pt: 'Combine 3 ou mais flores iguais para removê-las',
    },
    image: '🌺🌸🌺',
  },
  {
    title: {
      es: 'Completa objetivos 🎯',
      en: 'Complete objectives 🎯',
      pt: 'Complete objetivos 🎯',
    },
    description: {
      es: 'Cada nivel tiene un objetivo: recolectar flores o conseguir puntos',
      en: 'Each level has an objective: collect flowers or reach a score',
      pt: 'Cada nível tem um objetivo: coletar flores ou alcançar pontos',
    },
    image: '🎯',
  },
  {
    title: {
      es: 'Cascadas gratis ✨',
      en: 'Free cascades ✨',
      pt: 'Cascatas grátis ✨',
    },
    description: {
      es: '¡Las cascadas no gastan movimientos! Aprovéchalas',
      en: "Cascades don't spend moves! Use them to your advantage",
      pt: 'As cascatas não gastam movimentos! Aproveite-as',
    },
    image: '💥',
  },
  {
    title: {
      es: 'Recompensas diarias 🎁',
      en: 'Daily rewards 🎁',
      pt: 'Recompensas diárias 🎁',
    },
    description: {
      es: 'Juega cada día para conseguir gemas y vidas gratis',
      en: 'Play every day to earn free gems and lives',
      pt: 'Jogue todos os dias para ganhar gemas e vidas grátis',
    },
    image: '💎❤️',
  },
  {
    title: {
      es: '¡Listo para jugar! 🎉',
      en: "You're ready to play! 🎉",
      pt: 'Pronto para jogar! 🎉',
    },
    description: {
      es: 'Completa niveles para desbloquear más contenido',
      en: 'Complete levels to unlock more content',
      pt: 'Complete níveis para desbloquear mais conteúdo',
    },
    image: '🏆',
  },
];

interface TutorialProps {
  onComplete: () => void;
}

export const Tutorial = ({ onComplete }: TutorialProps) => {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Tutorial DESACTIVADO — los usuarios abandonan antes de jugar
    // El nivel 1 es autoexplicativo (30 movimientos, objetivo sencillo)
    const hasSeenTutorial = localStorage.getItem('tutorial-completed');
    if (!hasSeenTutorial) {
      // Auto-completar sin mostrar
      localStorage.setItem('tutorial-completed', 'true');
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem('tutorial-completed', 'true');
      setShow(false);
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial-completed', 'true');
    setShow(false);
    onComplete();
  };

  if (!show) return null;

  const step = STEPS[currentStep];
  const lang: 'es' | 'en' | 'pt' = language;
  const skipLabel = t('tutorial_ui.skip');
  const nextLabel = t('tutorial_ui.next');
  const startLabel = t('tutorial_ui.start');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-sm mx-4 border-4 border-purple-400 shadow-2xl animate-scale-in">
        <div className="text-6xl text-center mb-6">{step.image}</div>

        <h2 className="text-2xl font-bold text-center text-white mb-4">
          {step.title[lang]}
        </h2>

        <p className="text-center text-purple-200 mb-8">
          {step.description[lang]}
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep ? 'bg-purple-400' : 'bg-purple-700'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="flex-1 text-purple-300 hover:text-white"
          >
            {skipLabel}
          </Button>

          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
          >
            {currentStep === STEPS.length - 1 ? startLabel : nextLabel}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
