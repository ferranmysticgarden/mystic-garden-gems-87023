import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const STEPS = [
  {
    title: '¡Bienvenido a Mystic Garden! 🌸',
    description: 'Combina 3 o más flores iguales para hacerlas desaparecer',
    image: '🌺🌸🌺'
  },
  {
    title: 'Completa objetivos 🎯',
    description: 'Cada nivel tiene un objetivo: recolectar flores o conseguir puntos',
    image: '🎯'
  },
  {
    title: 'Cascadas gratis ✨',
    description: '¡Las cascadas no gastan movimientos! Aprovéchalas',
    image: '💥'
  },
  {
    title: 'Recompensas diarias 🎁',
    description: 'Juega cada día para conseguir gemas y vidas gratis',
    image: '💎❤️'
  },
  {
    title: '¡Listo para jugar! 🎉',
    description: 'Completa niveles para desbloquear más contenido',
    image: '🏆'
  }
];

interface TutorialProps {
  onComplete: () => void;
}

export const Tutorial = ({ onComplete }: TutorialProps) => {
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
      setCurrentStep(prev => prev + 1);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-purple-900 to-indigo-900 rounded-3xl p-8 max-w-sm mx-4 border-4 border-purple-400 shadow-2xl animate-scale-in">
        <div className="text-6xl text-center mb-6">
          {step.image}
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-4">
          {step.title}
        </h2>
        
        <p className="text-center text-purple-200 mb-8">
          {step.description}
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
            Saltar
          </Button>
          
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
          >
            {currentStep === STEPS.length - 1 ? '¡Empezar!' : 'Siguiente'}
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
