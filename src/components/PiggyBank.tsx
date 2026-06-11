import { PiggyBank as PiggyBankIcon } from "lucide-react";

interface PiggyBankProps {
  amount: number;
  cap: number;
  onClick: () => void;
}

export const PiggyBank = ({ amount, cap, onClick }: PiggyBankProps) => {
  const progress = Math.min(1, amount / cap);
  const isFull = amount >= cap;

  return (
    <button
      onClick={onClick}
      aria-label={`Hucha ${amount} de ${cap} gemas`}
      className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 border transition-all ${
        isFull
          ? "bg-yellow-500/20 border-yellow-400 animate-pulse"
          : "bg-pink-500/15 border-pink-400/40 hover:scale-105"
      }`}
    >
      <PiggyBankIcon className={`w-5 h-5 ${isFull ? "text-yellow-400" : "text-pink-400"}`} />
      <div className="flex flex-col items-start">
        <span className={`text-xs font-bold leading-none ${isFull ? "text-yellow-200" : "text-pink-200"}`}>
          {amount}/{cap}
        </span>
        <div className="w-12 h-1 mt-1 bg-black/30 rounded-full overflow-hidden">
          <div
            className={`h-full ${isFull ? "bg-yellow-400" : "bg-pink-400"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      {isFull && (
        <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white px-1 rounded-full font-bold">
          !
        </span>
      )}
    </button>
  );
};
