interface TileProps {
  tile: string;
  isSelected: boolean;
  isAnimating: boolean;
  isTarget: boolean;
  onClick: () => void;
}

export const Tile = ({ tile, isSelected, isAnimating, isTarget, onClick }: TileProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        aspect-square rounded-lg flex items-center justify-center text-2xl
        transition-all duration-300 bg-card/80
        ${isSelected ? 'scale-110 shadow-glow ring-2 ring-primary' : 'hover:scale-105'}
        ${isAnimating ? 'animate-pop' : 'animate-scale-in'}
        ${isTarget ? 'ring-2 ring-secondary animate-bounce-subtle' : ''}
      `}
    >
      {tile}
    </button>
  );
};
