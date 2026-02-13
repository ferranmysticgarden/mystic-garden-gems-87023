import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface Level4RewardProps {
  open: boolean;
  onClaim: () => void;
}

export const Level4Reward = ({ open, onClaim }: Level4RewardProps) => {
  const [claimed, setClaimed] = useState(false);

  const handleClaim = () => {
    if (claimed) return;
    setClaimed(true);
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => onClaim(), 400);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-xs rounded-2xl text-center border-2 border-primary/40 bg-gradient-to-b from-background to-primary/10" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader className="items-center">
          <div className="text-5xl mb-2">🌸</div>
          <DialogTitle className="text-xl text-gold">Tu jardín está creciendo 🌸</DialogTitle>
          <DialogDescription className="text-base mt-1">
            Has desbloqueado un regalo especial.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gold my-2">
          +50 💎
        </div>
        <Button
          onClick={handleClaim}
          disabled={claimed}
          className="w-full gradient-gold shadow-gold text-lg py-5 hover:scale-105 transition-all"
        >
          Continuar
        </Button>
      </DialogContent>
    </Dialog>
  );
};
