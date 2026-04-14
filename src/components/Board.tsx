import { useState, useEffect, useCallback, useRef } from 'react';
import { Tile } from './Tile';
import { useMysticSounds } from '@/hooks/useMysticSounds';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { useLanguage } from '@/hooks/useLanguage';

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
  levelId?: number;
}

export const Board = ({ onMatch, onMove, targetTile, disabled, levelId }: BoardProps) => {
  const { t } = useLanguage();
  const [board, setBoard] = useState<string[][]>([]);
  const [selected, setSelected] = useState<Position | null>(null);
  const [animatingTiles, setAnimatingTiles] = useState<Set<string>>(new Set());
  const [isSwapping, setIsSwapping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showShuffleMessage, setShowShuffleMessage] = useState(false);
  const matchCountRef = useRef(0);
  
  // Use mystical fairy sounds
  const { playSelectSound, playMatchSound, playInvalidSound, playShuffleSound } = useMysticSounds();

  // Check if there are any valid moves on the board
  const hasValidMoves = useCallback((currentBoard: string[][]): boolean => {
    if (currentBoard.length === 0) return true;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const tile = currentBoard[row][col];
        if (!tile) continue;
        
        // Check swap right
        if (col < BOARD_SIZE - 1) {
          const testBoard = currentBoard.map(r => [...r]);
          testBoard[row][col] = testBoard[row][col + 1];
          testBoard[row][col + 1] = tile;
          if (wouldCreateMatch(testBoard, row, col) || wouldCreateMatch(testBoard, row, col + 1)) {
            return true;
          }
        }
        
        // Check swap down
        if (row < BOARD_SIZE - 1) {
          const testBoard = currentBoard.map(r => [...r]);
          testBoard[row][col] = testBoard[row + 1][col];
          testBoard[row + 1][col] = tile;
          if (wouldCreateMatch(testBoard, row, col) || wouldCreateMatch(testBoard, row + 1, col)) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Check if a position would be part of a match
  const wouldCreateMatch = (testBoard: string[][], row: number, col: number): boolean => {
    const tile = testBoard[row][col];
    if (!tile) return false;
    
    // Check horizontal
    let hCount = 1;
    let c = col - 1;
    while (c >= 0 && testBoard[row][c] === tile) { hCount++; c--; }
    c = col + 1;
    while (c < BOARD_SIZE && testBoard[row][c] === tile) { hCount++; c++; }
    if (hCount >= 3) return true;
    
    // Check vertical
    let vCount = 1;
    let r = row - 1;
    while (r >= 0 && testBoard[r][col] === tile) { vCount++; r--; }
    r = row + 1;
    while (r < BOARD_SIZE && testBoard[r][col] === tile) { vCount++; r++; }
    if (vCount >= 3) return true;
    
    return false;
  };

  // Shuffle the board ensuring valid moves exist
  const shuffleBoard = useCallback((currentBoard: string[][]): string[][] => {
    let newBoard: string[][];
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      // Fisher-Yates shuffle
      const flat = currentBoard.flat();
      for (let i = flat.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flat[i], flat[j]] = [flat[j], flat[i]];
      }
      
      newBoard = [];
      for (let i = 0; i < BOARD_SIZE; i++) {
        newBoard.push(flat.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE));
      }
      attempts++;
    } while (!hasValidMoves(newBoard) && attempts < maxAttempts);
    
    // If still no valid moves after max attempts, regenerate with fresh tiles
    if (!hasValidMoves(newBoard)) {
      newBoard = [];
      for (let i = 0; i < BOARD_SIZE; i++) {
        const row: string[] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
          row.push(TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]);
        }
        newBoard.push(row);
      }
    }
    
    return newBoard;
  }, [hasValidMoves]);

  // Pre-designed boards for early levels — NO existing matches, many valid swaps
  // Validated: no 3-in-a-row, Board 1: 17 swaps, Board 2: 33 swaps, Board 3: 32 swaps
  const getEasyBoard = useCallback((lvl: number): string[][] | null => {
    if (lvl === 1) {
      return [
        ['🌻','🌺','🌷','🌺','🌸','🌻','🌺','🌼'],
        ['🍃','🌻','🌷','🌼','🍃','🌻','🌺','🌸'],
        ['🍃','🌼','🌺','🍃','🍃','🌺','🌷','🌻'],
        ['🌼','🍃','🌺','🍃','🌺','🌺','🍃','🌺'],
        ['🌺','🌺','🌻','🌼','🌼','🍃','🌷','🌸'],
        ['🌻','🌷','🌸','🌻','🌺','🌺','🌷','🌺'],
        ['🍃','🌼','🌻','🌷','🍃','🌻','🌺','🌻'],
        ['🌷','🌸','🌷','🌻','🌸','🌸','🌻','🌸'],
      ];
    }
    if (lvl === 2) {
      // 27x 🌸 on board, 33 valid swaps — collect 🌸 is trivial
      return [
        ['🌼','🌸','🌼','🌸','🍃','🌸','🌷','🌸'],
        ['🌺','🌸','🌼','🌻','🌸','🌸','🍃','🌸'],
        ['🌸','🍃','🌸','🌸','🌷','🌼','🍃','🍃'],
        ['🌸','🌸','🌻','🌸','🌸','🌻','🌸','🌸'],
        ['🌷','🌸','🌸','🌻','🌸','🌸','🌼','🌸'],
        ['🌺','🌼','🌻','🌻','🌺','🍃','🌻','🌷'],
        ['🌸','🌷','🍃','🌺','🍃','🍃','🌼','🌻'],
        ['🍃','🌸','🌻','🌸','🌸','🌺','🌸','🌻'],
      ];
    }
    if (lvl === 3) {
      // 26x 🍃 on board, 32 valid swaps — collect 🍃 is trivial
      return [
        ['🍃','🌺','🌻','🍃','🌺','🌺','🌼','🍃'],
        ['🌼','🌺','🌼','🌸','🌷','🍃','🌸','🍃'],
        ['🍃','🍃','🌼','🌸','🍃','🍃','🌻','🌷'],
        ['🌺','🍃','🌸','🍃','🍃','🌷','🍃','🍃'],
        ['🍃','🌼','🍃','🍃','🌼','🍃','🍃','🌺'],
        ['🍃','🌸','🌷','🌸','🍃','🍃','🌺','🌸'],
        ['🌸','🌺','🌺','🌷','🌷','🌺','🌺','🍃'],
        ['🌸','🍃','🍃','🌷','🌻','🍃','🌸','🌼'],
      ];
    }
    return null;
  }, []);

  const initializeBoard = useCallback(() => {
    // Use pre-designed easy board for levels 1-3
    const easyBoard = levelId ? getEasyBoard(levelId) : null;
    if (easyBoard) {
      setBoard(easyBoard);
      setSelected(null);
      return;
    }

    let newBoard: string[][] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const row: string[] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        row.push(TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]);
      }
      newBoard.push(row);
    }
    
    // Ensure initial board has valid moves
    if (!hasValidMoves(newBoard)) {
      newBoard = shuffleBoard(newBoard);
    }
    
    setBoard(newBoard);
    setSelected(null);
  }, [hasValidMoves, shuffleBoard, levelId, getEasyBoard]);

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
    }, 150);

    return newBoard;
  }, [onMatch]);

  // Check for no valid moves after board settles
  useEffect(() => {
    if (board.length === 0) return;
    if (animatingTiles.size > 0) return;
    if (isSwapping) return;
    if (isShuffling) return;
    if (disabled) return;

    const timeoutId = setTimeout(() => {
      const matches = findMatches(board);
      if (matches.length > 0) {
        removeMatches(board, matches);
      } else if (!hasValidMoves(board)) {
        setIsShuffling(true);
        setShowShuffleMessage(true);
        playShuffleSound();
        
        const allTiles = new Set<string>();
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            allTiles.add(`${r}-${c}`);
          }
        }
        setAnimatingTiles(allTiles);
        
        setTimeout(() => {
          const shuffledBoard = shuffleBoard(board);
          setBoard(shuffledBoard);
          setAnimatingTiles(new Set());
          setIsShuffling(false);
          setTimeout(() => setShowShuffleMessage(false), 500);
        }, 350);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [board, findMatches, removeMatches, animatingTiles.size, isSwapping, isShuffling, hasValidMoves, shuffleBoard, disabled, playShuffleSound]);

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
        playInvalidSound();
        setBoard(prevBoard);
        setIsSwapping(false);
      } else {
        matchCountRef.current += 1;
        backgroundMusic.duck(400);
        playMatchSound(matchCountRef.current);
        removeMatches(newBoard, matches);
        setIsSwapping(false);
      }
    }, 150);
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
    <div className="w-full max-w-md mx-auto relative">
      {/* Shuffle Message Overlay */}
      {showShuffleMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div 
            className="px-6 py-4 rounded-2xl animate-scale-in"
            style={{
              background: 'linear-gradient(135deg, hsl(270 60% 30% / 0.95), hsl(280 50% 20% / 0.95))',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.3)',
              border: '2px solid rgba(168, 85, 247, 0.5)',
            }}
          >
            <div className="text-center">
              <div className="text-3xl mb-2 animate-pulse">✨🔮✨</div>
              <p className="text-lg font-bold text-white/90">
                {t('game.magic_shuffle')}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div 
        className={`grid grid-cols-8 gap-1 p-3 rounded-2xl transition-all duration-300 ${isShuffling ? 'opacity-60 scale-95' : ''}`}
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
              row={rowIndex}
              col={colIndex}
              isSelected={selected?.row === rowIndex && selected?.col === colIndex}
              isAnimating={animatingTiles.has(`${rowIndex}-${colIndex}`)}
              isTarget={targetTile === tile}
              onTileClick={handleTileClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
