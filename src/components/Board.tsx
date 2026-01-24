import { useState, useEffect, useCallback, useRef } from 'react';
import { Tile } from './Tile';

const TILE_TYPES = ['🌸', '🌺', '🌼', '🍃', '🌻', '🌷'];
const BOARD_SIZE = 8;

interface Position {
  row: number;
  col: number;
}

interface BoardProps {
  onMatch: (tiles: string[], count: number) => void;
  onMove: () => void;
  targetTile?: string;
  disabled?: boolean;
}

// Inline sound utilities to avoid hook dependency issues
const createAudioContext = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('[AUDIO] Created AudioContext, state:', ctx.state);
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => console.log('[AUDIO] AudioContext resumed'));
    }
    return ctx;
  } catch (e) {
    console.error('[AUDIO] Failed to create AudioContext:', e);
    return null;
  }
};

const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

export const Board = ({ onMatch, onMove, targetTile, disabled }: BoardProps) => {
  const [board, setBoard] = useState<string[][]>([]);
  const [selected, setSelected] = useState<Position | null>(null);
  const [animatingTiles, setAnimatingTiles] = useState<Set<string>>(new Set());
  const [isSwapping, setIsSwapping] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const matchCountRef = useRef(0);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = createAudioContext();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().then(() => console.log('[AUDIO] Context resumed from getCtx'));
    }
    return audioCtxRef.current;
  }, []);

  // Sound: tile select
  const playSelectSound = useCallback(() => {
    console.log('[AUDIO] playSelectSound called');
    const ctx = getCtx();
    if (!ctx) {
      console.error('[AUDIO] No AudioContext available');
      return;
    }
    console.log('[AUDIO] AudioContext state:', ctx.state);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.3, now); // Increased volume
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
    console.log('[AUDIO] Select sound played');
    vibrate(20);
  }, [getCtx]);

  // Sound: match (pitch increases with combo)
  const playMatchSound = useCallback((comboLevel: number) => {
    console.log('[AUDIO] playMatchSound called, combo:', comboLevel);
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseFreq = 523.25 + comboLevel * 80; // C5 + combo bonus
    
    [0, 0.08, 0.16].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq + i * 100, now + delay);
      gain.gain.setValueAtTime(0.4, now + delay); // Increased volume
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
    console.log('[AUDIO] Match sound played');
    vibrate([30, 20, 30]);
  }, [getCtx]);

  // Sound: invalid swap
  const playInvalidSound = useCallback(() => {
    console.log('[AUDIO] playInvalidSound called');
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.2);
    gain.gain.setValueAtTime(0.25, now); // Increased volume
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
    console.log('[AUDIO] Invalid sound played');
    vibrate([50, 30, 50]);
  }, [getCtx]);

  const initializeBoard = useCallback(() => {
    const newBoard: string[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const row: string[] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        row.push(TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]);
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setSelected(null);
  }, []);

  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  const findMatches = useCallback((currentBoard: string[][]) => {
    const matches: Position[] = [];
    
    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE - 2; col++) {
        const tile = currentBoard[row][col];
        if (tile && 
            currentBoard[row][col + 1] === tile && 
            currentBoard[row][col + 2] === tile) {
          let matchLength = 3;
          while (col + matchLength < BOARD_SIZE && currentBoard[row][col + matchLength] === tile) {
            matchLength++;
          }
          for (let i = 0; i < matchLength; i++) {
            matches.push({ row, col: col + i });
          }
          col += matchLength - 1;
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (let row = 0; row < BOARD_SIZE - 2; row++) {
        const tile = currentBoard[row][col];
        if (tile && 
            currentBoard[row + 1][col] === tile && 
            currentBoard[row + 2][col] === tile) {
          let matchLength = 3;
          while (row + matchLength < BOARD_SIZE && currentBoard[row + matchLength][col] === tile) {
            matchLength++;
          }
          for (let i = 0; i < matchLength; i++) {
            matches.push({ row: row + i, col });
          }
          row += matchLength - 1;
        }
      }
    }
    
    return matches;
  }, []);

  const removeMatches = useCallback((currentBoard: string[][], matches: Position[]) => {
    if (matches.length === 0) return currentBoard;

    const newBoard = currentBoard.map(row => [...row]);
    const matchedTiles: string[] = [];
    
    // Animate tiles before removing
    const animatingKeys = new Set<string>();
    matches.forEach(({ row, col }) => {
      matchedTiles.push(newBoard[row][col]);
      animatingKeys.add(`${row}-${col}`);
      newBoard[row][col] = '';
    });
    
    setAnimatingTiles(animatingKeys);
    
    setTimeout(() => {
      setAnimatingTiles(new Set());
      
      // Drop tiles
      for (let col = 0; col < BOARD_SIZE; col++) {
        let emptyRow = BOARD_SIZE - 1;
        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
          if (newBoard[row][col] !== '') {
            if (row !== emptyRow) {
              newBoard[emptyRow][col] = newBoard[row][col];
              newBoard[row][col] = '';
            }
            emptyRow--;
          }
        }
        
        // Fill empty spaces
        for (let row = emptyRow; row >= 0; row--) {
          newBoard[row][col] = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
        }
      }
      
      setBoard(newBoard);
      onMatch(matchedTiles, matches.length);
    }, 300);

    return newBoard;
  }, [onMatch]);

  useEffect(() => {
    if (board.length === 0) return;
    if (animatingTiles.size > 0) return; // Don't check while animating
    if (isSwapping) return; // Don't resolve cascades while validating a swap

    const timeoutId = setTimeout(() => {
      const matches = findMatches(board);
      if (matches.length > 0) {
        removeMatches(board, matches);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [board, findMatches, removeMatches, animatingTiles.size, isSwapping]);

  const swapTiles = useCallback((pos1: Position, pos2: Position) => {
    setIsSwapping(true);

    const prevBoard = board.map(row => [...row]);
    const newBoard = board.map(row => [...row]);

    const temp = newBoard[pos1.row][pos1.col];
    newBoard[pos1.row][pos1.col] = newBoard[pos2.row][pos2.col];
    newBoard[pos2.row][pos2.col] = temp;

    setBoard(newBoard);
    onMove();

    // Check for matches after swap
    setTimeout(() => {
      const matches = findMatches(newBoard);
      if (matches.length === 0) {
        // No match, swap back
        playInvalidSound();
        setBoard(prevBoard);
        setIsSwapping(false);
      } else {
        matchCountRef.current += 1;
        playMatchSound(matchCountRef.current);
        removeMatches(newBoard, matches);
        setIsSwapping(false);
      }
    }, 300);
  }, [board, findMatches, removeMatches, onMove, playInvalidSound, playMatchSound]);

  const handleTileClick = useCallback((row: number, col: number) => {
    if (disabled) return;
    if (isSwapping || animatingTiles.size > 0) return;

    if (!selected) {
      playSelectSound();
      setSelected({ row, col });
      matchCountRef.current = 0; // Reset combo on new selection
    } else {
      const rowDiff = Math.abs(selected.row - row);
      const colDiff = Math.abs(selected.col - col);

      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        swapTiles(selected, { row, col });
      }
      setSelected(null);
    }
  }, [selected, swapTiles, disabled, isSwapping, animatingTiles.size, playSelectSound]);

  if (board.length === 0) {
    return <div className="w-full aspect-square flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="grid grid-cols-8 gap-1 p-3 rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, hsl(270 50% 20% / 0.9), hsl(270 60% 12% / 0.95))',
          boxShadow: '0 0 30px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '2px solid rgba(147, 51, 234, 0.3)',
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((tile, colIndex) => (
            <Tile
              key={`${rowIndex}-${colIndex}`}
              tile={tile}
              isSelected={selected?.row === rowIndex && selected?.col === colIndex}
              isAnimating={animatingTiles.has(`${rowIndex}-${colIndex}`)}
              isTarget={targetTile === tile}
              onClick={() => handleTileClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  );
};
