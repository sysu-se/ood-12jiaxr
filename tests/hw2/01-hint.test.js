import { describe, expect, it, beforeEach } from 'vitest';
import { createSudoku } from '../../src/domain/Sudoku.js';
import { makePuzzle } from '../hw1/helpers/domain-api.js';

describe('多等级提示功能', () => {
  let sudoku;
  
  beforeEach(() => {
    sudoku = createSudoku(makePuzzle()); // 标准数独
  });

  it('轻度提示应返回一个空格坐标', () => {
    const hint = sudoku.getLightHint();
    expect(hint).toHaveProperty('row');
    expect(hint).toHaveProperty('col');
    expect(sudoku.getGrid()[hint.row][hint.col]).toBe(0);
  });

  it('中度提示应返回唯一候选格的数字和坐标', () => {
    const hint = sudoku.getMediumHint();
    // 如果存在唯一候选，验证其合理性
    if (hint) {
      expect(hint).toHaveProperty('value');
      const candidates = sudoku.getCandidates(hint.row, hint.col);
      expect(candidates).toContain(hint.value);
      expect(candidates.length).toBe(1);
    } else {
      // 如果没有唯一候选，返回 null 是合理的
      expect(hint).toBeNull();
    }
  });

  it('深度提示应返回解释文本', () => {
    const hint = sudoku.getDeepHint();
    if (hint) {
      expect(hint).toHaveProperty('reason');
      expect(typeof hint.reason).toBe('string');
      expect(hint.reason.length).toBeGreaterThan(10);
    } else {
      expect(hint).toBeNull();
    }
  });

  it('提示方法应正确处理已填满的网格', () => {
    const fullGrid = Array(9).fill().map(() => Array(9).fill(1));
    const fullSudoku = createSudoku(fullGrid);
    expect(fullSudoku.getLightHint()).toBeNull();
    expect(fullSudoku.getMediumHint()).toBeNull();
    expect(fullSudoku.getDeepHint()).toBeNull();
  });
});