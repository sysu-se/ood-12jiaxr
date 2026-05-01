import { describe, expect, it, vi } from 'vitest';
import { createGame, createSudoku } from '../../src/domain';

// 模拟 ExploreModal 的核心函数
function createExploreSession(mainGame) {
  let exploreGame = createGame({ sudoku: createSudoku(mainGame.getSudoku().getGrid()) });
  const startSnapshot = mainGame.getSudoku().clone();
  let boardKey = 0;
  let failedHashes = new Set();
  
  function hasConflict() { return !exploreGame.getSudoku().validate().isValid; }
  function isFailed() { return failedHashes.has(exploreGame.getSudoku().getGridHash()); }
  function markFailed() { failedHashes.add(exploreGame.getSudoku().getGridHash()); }
  
  function handleGuess(move) {
    if (isFailed()) return false;
    const success = exploreGame.guess(move);
    if (success) {
      boardKey++;
      if (hasConflict()) {
        markFailed();
      }
    }
    return success;
  }
  
  function commit() {
    mainGame.replaceCurrentSudoku(exploreGame.getSudoku(), true);
  }
  
  function abort() {
    // 什么都不做
  }
  
  return { handleGuess, commit, abort, exploreGame, boardKey, isFailed };
}

describe('探索模式集成测试', () => {
  it('提交探索结果应更新主游戏', () => {
    const mainSudoku = createSudoku(Array(9).fill().map(() => Array(9).fill(0)));
    const mainGame = createGame({ sudoku: mainSudoku });
    const session = createExploreSession(mainGame);
    
    session.handleGuess({ row: 0, col: 0, value: 5 });
    session.commit();
    
    expect(mainGame.getSudoku().getGrid()[0][0]).toBe(5);
  });
  
  it('放弃探索后主游戏应保持不变', () => {
    const mainSudoku = createSudoku(Array(9).fill().map(() => Array(9).fill(0)));
    const mainGame = createGame({ sudoku: mainSudoku });
    const originalGrid = mainGame.getSudoku().getGrid();
    const session = createExploreSession(mainGame);
    
    session.handleGuess({ row: 0, col: 0, value: 5 });
    session.abort();
    
    expect(mainGame.getSudoku().getGrid()).toEqual(originalGrid);
  });
  
  it('冲突应正确标记失败并阻止后续操作', () => {
    const mainSudoku = createSudoku(Array(9).fill().map(() => Array(9).fill(0)));
    const mainGame = createGame({ sudoku: mainSudoku });
    const session = createExploreSession(mainGame);
    
    // 制造冲突：同一行两个相同数字
    session.handleGuess({ row: 0, col: 0, value: 5 });
    session.handleGuess({ row: 0, col: 1, value: 5 });
    expect(session.isFailed()).toBe(true);
    
    // 再尝试修改其他格子应失败
    const result = session.handleGuess({ row: 1, col: 0, value: 3 });
    expect(result).toBe(false);
  });
});