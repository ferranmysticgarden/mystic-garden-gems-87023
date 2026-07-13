import { useState, useEffect, useCallback, useRef } from 'react';
import { Tile } from './Tile';
import { useMysticSounds } from '@/hooks/useMysticSounds';
import { backgroundMusic } from '@/hooks/useBackgroundMusic';
import { useLanguage } from '@/hooks/useLanguage';
import { TILE_TYPES } from '@/constants/tileTypes';
import { ScreenShake } from '@/components/game/ScreenShake';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { useHaptics } from '@/hooks/useHaptics';

const BOARD_SIZE = 8;

interface Position {
  row: number;
  col: number;
}

interface BoardProps {
  /** CAMBIO SCORING — emite tiles, tamaño del grupo más grande de esta cascada, y nº de cascada (1 = jugada inicial, 2+ = combos automáticos) */
  onMatch: (tiles: string[], biggestGroupSize: number, cascadeStep: number) => void;
  onMove: () => void;
  targetTile?: string;
  disabled?: boolean;
  levelId?: number;
  isHammerActive?: boolean;
  onHammerUse?: (row: number, col: number) => void;
  isChangeActive?: boolean;
  onChangeTileClick?: (row: number, col: number) => void;
  changeApply?: { row: number; col: number; newType: string; seq: number } | null;
  triggerUndo?: number;
  highlightedTiles?: Position[];
  onFirstValidMatch?: () => void;
  /** CAMBIO 4 — boost probabilístico (0-0.4) para crear más coincidencias tras 2+ derrotas */
  adaptiveBoost?: number;
}

export const Board = ({ 
  onMatch, 
  onMove, 
  targetTile, 
  disabled, 
  levelId,
  isHammerActive,
  onHammerUse,
  isChangeActive,
  onChangeTileClick,
  changeApply,
  triggerUndo,
  highlightedTiles,
  onFirstValidMatch,
  adaptiveBoost = 0,
}: BoardProps) => {
  const { t } = useLanguage();
  const [board, setBoard] = useState<string[][]>([]);
  const [boardHistory, setBoardHistory] = useState<string[][][]>([]);
  const [selected, setSelected] = useState<Position | null>(null);
  const [animatingTiles, setAnimatingTiles] = useState<Set<string>>(new Set());
  const [isSwapping, setIsSwapping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showShuffleMessage, setShowShuffleMessage] = useState(false);
  const matchCountRef = useRef(0);
  const cascadeStepRef = useRef(0);
  const hasFiredFirstMatchRef = useRef(false);

  // FX: shake trigger + intensity + particle bursts + white flash for x5+
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const shakeIntensityRef = useRef<'light' | 'medium' | 'heavy'>('light');
  const [bursts, setBursts] = useState<Array<{ id: number; row: number; col: number; big: boolean }>>([]);
  const burstIdRef = useRef(0);
  const [flash, setFlash] = useState(false);
  const { impact } = useHaptics();

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
        ['t5','t2','t6','t2','t1','t5','t2','t3'],
        ['t4','t5','t6','t3','t4','t5','t2','t1'],
        ['t4','t3','t2','t4','t4','t2','t6','t5'],
        ['t3','t4','t2','t4','t2','t2','t4','t2'],
        ['t2','t2','t5','t3','t3','t4','t6','t1'],
        ['t5','t6','t1','t5','t2','t2','t6','t2'],
        ['t4','t3','t5','t6','t4','t5','t2','t5'],
        ['t6','t1','t6','t5','t1','t1','t5','t1'],
      ];
    }
    if (lvl === 2) {
      // 27x t1 on board, 33 valid swaps — collect t1 is trivial
      return [
        ['t3','t1','t3','t1','t4','t1','t6','t1'],
        ['t2','t1','t3','t5','t1','t1','t4','t1'],
        ['t1','t4','t1','t1','t6','t3','t4','t4'],
        ['t1','t1','t5','t1','t1','t5','t1','t1'],
        ['t6','t1','t1','t5','t1','t1','t3','t1'],
        ['t2','t3','t5','t5','t2','t4','t5','t6'],
        ['t1','t6','t4','t2','t4','t4','t3','t5'],
        ['t4','t1','t5','t1','t1','t2','t1','t5'],
      ];
    }
    if (lvl === 3) {
      // 26x t4 on board, 32 valid swaps — collect t4 is trivial
      return [
        ['t4','t2','t5','t4','t2','t2','t3','t4'],
        ['t3','t2','t3','t1','t6','t4','t1','t4'],
        ['t4','t4','t3','t1','t4','t4','t5','t6'],
        ['t2','t4','t1','t4','t4','t6','t4','t4'],
        ['t4','t3','t4','t4','t3','t4','t4','t2'],
        ['t4','t1','t6','t1','t4','t4','t2','t1'],
        ['t1','t2','t2','t6','t6','t2','t2','t4'],
        ['t1','t4','t4','t6','t5','t4','t1','t3'],
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
    setBoardHistory([]); // Limpiar historial al empezar nivel
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

  // CAMBIO SCORING — calcula tamaño del grupo conectado más grande (gestiona T/L correctamente)
  const computeBiggestGroup = useCallback((currentBoard: string[][], positions: Position[]): number => {
    if (positions.length === 0) return 0;
    const posSet = new Set(positions.map(p => `${p.row}-${p.col}`));
    const visited = new Set<string>();
    let maxGroup = 0;
    for (const p of positions) {
      const key = `${p.row}-${p.col}`;
      if (visited.has(key)) continue;
      const tileType = currentBoard[p.row][p.col];
      if (!tileType) { visited.add(key); continue; }
      const stack: Position[] = [p];
      let size = 0;
      while (stack.length) {
        const cur = stack.pop()!;
        const k = `${cur.row}-${cur.col}`;
        if (visited.has(k)) continue;
        visited.add(k);
        size++;
        const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr, dc] of neighbors) {
          const nr = cur.row + dr, nc = cur.col + dc;
          const nk = `${nr}-${nc}`;
          if (posSet.has(nk) && !visited.has(nk) && currentBoard[nr][nc] === tileType) {
            stack.push({ row: nr, col: nc });
          }
        }
      }
      if (size > maxGroup) maxGroup = size;
    }
    return maxGroup;
  }, []);

  const removeMatches = useCallback((currentBoard: string[][], matches: Position[]) => {
    if (matches.length === 0) return currentBoard;

    const newBoard = currentBoard.map(row => [...row]);
    const matchedTiles: string[] = [];
    const biggestGroup = computeBiggestGroup(currentBoard, matches);

    // Animate tiles before removing
    const animatingKeys = new Set<string>();
    matches.forEach(({ row, col }) => {
      matchedTiles.push(newBoard[row][col]);
      animatingKeys.add(`${row}-${col}`);
      newBoard[row][col] = '';
    });
    
    setAnimatingTiles(animatingKeys);

    // FX: shake + partículas + flash + haptics según tamaño del match / cascada
    try {
      const step = cascadeStepRef.current + 1; // este step está a punto de emitirse
      const big = biggestGroup >= 5 || step >= 4;
      // Screen shake
      if (FEATURE_FLAGS.screenShake && biggestGroup >= 4) {
        shakeIntensityRef.current =
          biggestGroup >= 6 || step >= 4 ? 'heavy' : biggestGroup >= 5 ? 'medium' : 'light';
        setShakeTrigger((n) => n + 1);
      }
      // Haptics
      if (biggestGroup >= 5 || step >= 4) impact('heavy');
      else if (biggestGroup >= 4) impact('medium');
      else impact('light');
      // Flash blanco en combo x5+
      if (step >= 5) {
        setFlash(true);
        setTimeout(() => setFlash(false), 140);
      }
      // Partículas: burst por cada tile eliminado
      if (FEATURE_FLAGS.tileParticles) {
        const now = burstIdRef.current;
        const added = matches.map((m, i) => ({ id: now + i, row: m.row, col: m.col, big }));
        burstIdRef.current = now + matches.length;
        setBursts((prev) => [...prev, ...added]);
        const ids = added.map((a) => a.id);
        setTimeout(() => setBursts((prev) => prev.filter((b) => !ids.includes(b.id))), 700);
      }
    } catch {}

    
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
        
        // Fill empty spaces — CAMBIO 4: with adaptiveBoost prob, copy tile below
        for (let row = emptyRow; row >= 0; row--) {
          const below = (row + 1 < BOARD_SIZE) ? newBoard[row + 1][col] : '';
          if (adaptiveBoost > 0 && below && Math.random() < adaptiveBoost) {
            newBoard[row][col] = below;
          } else if (adaptiveBoost > 0 && targetTile && Math.random() < adaptiveBoost * 0.5) {
            newBoard[row][col] = targetTile;
          } else {
            newBoard[row][col] = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
          }
        }
      }
      
      setBoard(newBoard);
      // CAMBIO SCORING — incrementa paso de cascada y emite tamaño real del grupo + sonido escalado
      cascadeStepRef.current += 1;
      const step = cascadeStepRef.current;
      try { playMatchSound(Math.max(0, step - 1)); } catch {}
      onMatch(matchedTiles, biggestGroup, step);
    }, 90);

    return newBoard;
  }, [onMatch, adaptiveBoost, targetTile, computeBiggestGroup, playMatchSound]);

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
        }, 250);
      }
    }, 110);

    return () => clearTimeout(timeoutId);
  }, [board, findMatches, removeMatches, animatingTiles.size, isSwapping, isShuffling, hasValidMoves, shuffleBoard, disabled, playShuffleSound]);

  // Ejecutar Cambio: transforma la ficha seleccionada en el nuevo tipo elegido por el usuario.
  // El settle effect (linea ~407) detectará matches automáticamente tras la mutación.
  useEffect(() => {
    if (!changeApply || changeApply.seq <= 0) return;
    playShuffleSound();
    setBoard((prev) => {
      if (!prev.length) return prev;
      const next = prev.map((r) => [...r]);
      if (next[changeApply.row] && next[changeApply.row][changeApply.col] !== undefined) {
        next[changeApply.row][changeApply.col] = changeApply.newType;
      }
      return next;
    });
    // Reset combo cascade ref para que el próximo match cuente como cascada 1
    cascadeStepRef.current = 0;
  }, [changeApply?.seq]);

  // Ejecutar Undo manual
  useEffect(() => {
    if (triggerUndo && triggerUndo > 0 && boardHistory.length > 0) {
      const lastBoard = boardHistory[boardHistory.length - 1];
      setBoard(lastBoard);
      setBoardHistory(prev => prev.slice(0, -1));
    }
  }, [triggerUndo]);

  const swapTiles = useCallback((pos1: Position, pos2: Position) => {
    setIsSwapping(true);

    const prevBoard = board.map(row => [...row]);
    // Guardar estado actual antes del swap (máximo 5)
    setBoardHistory(prev => [...prev.slice(-4), prevBoard]);

    const newBoard = board.map(row => [...row]);

    const temp = newBoard[pos1.row][pos1.col];
    newBoard[pos1.row][pos1.col] = newBoard[pos2.row][pos2.col];
    newBoard[pos2.row][pos2.col] = temp;

    setBoard(newBoard);

    // Check for matches after swap — only consume move if valid
    setTimeout(() => {
      const matches = findMatches(newBoard);
      if (matches.length === 0) {
        playInvalidSound();
        setBoard(prevBoard);
        setIsSwapping(false);
        // Move NOT consumed — swap was invalid
      } else {
        onMove(); // Only consume move on valid swap
        // CAMBIO SCORING — nueva jugada: reset paso de cascada (removeMatches lo incrementará a 1)
        cascadeStepRef.current = 0;
        matchCountRef.current += 1;
        backgroundMusic.duck(400);
        removeMatches(newBoard, matches);
        setIsSwapping(false);
        if (!hasFiredFirstMatchRef.current) {
          hasFiredFirstMatchRef.current = true;
          try { onFirstValidMatch?.(); } catch {}
        }
      }
    }, 80);
  }, [board, findMatches, removeMatches, onMove, playInvalidSound, onFirstValidMatch]);

  const handleTileClick = useCallback((row: number, col: number) => {
    if (disabled) return;
    if (isSwapping || animatingTiles.size > 0) return;

    // MODO MARTILLO: Si está activo, elimina la ficha y sale
    if (isHammerActive) {
      removeMatches(board, [{ row, col }]);
      onHammerUse?.(row, col);
      return;
    }

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

      <ScreenShake trigger={shakeTrigger} intensity={shakeIntensityRef.current}>
        <div className="relative">
          <div
            className={`grid grid-cols-8 gap-1 p-3 rounded-2xl transition-all duration-200 ${isShuffling ? 'opacity-60 scale-95' : ''}`}
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
                  isHighlighted={highlightedTiles?.some(p => p.row === rowIndex && p.col === colIndex)}
                  onTileClick={handleTileClick}
                />
              ))
            )}
          </div>

          {FEATURE_FLAGS.tileParticles && bursts.length > 0 && (
            <div className="absolute inset-3 pointer-events-none z-30">
              {bursts.map((b) => {
                const parts = b.big ? 6 : 4;
                const size = b.big ? 'text-lg' : 'text-sm';
                return (
                  <div
                    key={b.id}
                    className="absolute"
                    style={{
                      left: `${((b.col + 0.5) / BOARD_SIZE) * 100}%`,
                      top: `${((b.row + 0.5) / BOARD_SIZE) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {Array.from({ length: parts }).map((_, i) => {
                      const angle = (i / parts) * Math.PI * 2;
                      const dist = b.big ? 42 : 26;
                      const dx = Math.cos(angle) * dist;
                      const dy = Math.sin(angle) * dist + (b.big ? 8 : 4);
                      const emoji = i % 2 === 0 ? '✨' : '⭐';
                      return (
                        <span
                          key={i}
                          className={`absolute ${size} select-none`}
                          style={{
                            left: 0,
                            top: 0,
                            animation: 'tile-burst 600ms ease-out forwards',
                            ['--tx' as never]: `${dx}px`,
                            ['--ty' as never]: `${dy}px`,
                            filter: 'drop-shadow(0 0 3px rgba(255,220,120,0.9))',
                          } as React.CSSProperties}
                        >
                          {emoji}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {flash && (
            <div
              className="absolute inset-0 pointer-events-none z-40 rounded-2xl"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)',
                animation: 'fade-out 140ms ease-out forwards',
              }}
            />
          )}
        </div>
      </ScreenShake>
    </div>
  );
};
