import { Play } from "lucide-react";

interface WatchAdCornerButtonProps {
  onClick: () => void;
  reward?: number;
  disabled?: boolean;
}

export const WatchAdCornerButton = ({
  onClick,
  reward = 10,
  disabled = false,
}: WatchAdCornerButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`Ver anuncio +${reward} gemas`}
      className="fixed top-16 right-2 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg border-2 border-emerald-300/50 flex flex-col items-center justify-center active:scale-95 transition-transform hover:scale-105 disabled:opacity-50"
      style={{ pointerEvents: "auto" }}
    >
      <Play className="w-4 h-4 text-white -mt-0.5" fill="white" />
      <span className="text-[9px] font-bold text-white leading-none mt-0.5">
        +{reward}💎
      </span>
    </button>
  );
};
