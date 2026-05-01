import { describe, expect, it, beforeEach } from 'vitest';
import { createSudoku, createGame } from '../../src/domain';

describe('探索模式独立 Game 行为', () => {
  let mainGame;
  let exploreGame;
  
  beforeEach(() => {
    const grid = Array(9).fill().map(() => Array(9).fill(0));
    const sudoku = createSudoku(grid);
    mainGame = createGame({ sudoku });
    const exploreSudoku = createSudoku(mainGame.getSudoku().getGrid());
    exploreGame = createGame({ sudoku: exploreSudoku });
  });

  it('探索游戏应完全独立于主游戏', () => {
    exploreGame.guess({ row: 0, col: 0, value: 5 });
    expect(exploreGame.getSudoku().getGrid()[0][0]).toBe(5);
    expect(mainGame.getSudoku().getGrid()[0][0]).toBe(0);
  });

  it('探索游戏应支持独立的 Undo/Redo', () => {
    exploreGame.guess({ row: 0, col: 0, value: 5 });
    exploreGame.guess({ row: 0, col: 1, value: 3 });
    expect(exploreGame.getSudoku().getGrid()[0][1]).toBe(3);
    
    exploreGame.undo();
    expect(exploreGame.getSudoku().getGrid()[0][1]).toBe(0);
    expect(exploreGame.getSudoku().getGrid()[0][0]).toBe(5);
    
    exploreGame.redo();
    expect(exploreGame.getSudoku().getGrid()[0][1]).toBe(3);
    
    // 主游戏历史不受影响
    expect(mainGame.canUndo()).toBe(false);
  });
});