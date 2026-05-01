<script>
  import { createGame } from '../../../domain';
  import { getGame } from '@sudoku/stores/gameInstance';
  import Board from '../../Board/index.svelte';
  import { gameStore } from '@sudoku/stores/gameInstance';
  import Keyboard from '../Keyboard.svelte';
  import { createEventDispatcher } from 'svelte';

  let exploreGame;
  let startSnapshot;
  let failedHashes = new Set(); // 记忆失败局面的 hash
  const dispatch = createEventDispatcher();
  let boardKey = 0;
  

  // 初始化探索游戏（基于当前主游戏的局面）
  function init() {
    const mainGame = getGame();
    const currentSudoku = mainGame.getSudoku();
    startSnapshot = currentSudoku.clone();
    exploreGame = createGame({ sudoku: startSnapshot });
  }
  init();

  // 检查当前探索局面是否冲突
  function hasConflict() {
    const result = exploreGame.getSudoku().validate();
    return !result.isValid;
  }

  // 检查当前局面是否已在失败记忆集中
  function isFailed() {
    const hash = exploreGame.getSudoku().getGridHash();
    return failedHashes.has(hash);
  }

  // 标记当前局面为失败
  function markFailed() {
    const hash = exploreGame.getSudoku().getGridHash();
    failedHashes.add(hash);
  }

  // 重置到探索起点
  function resetToStart() {
    const newSudoku = startSnapshot.clone();
    exploreGame = createGame({ sudoku: newSudoku });
  }

  // 核心猜测包装函数，包含失败检查和冲突检测
  function handleGuess(move) {
    if (isFailed()) {
      alert('此局面已在其他分支尝试失败，请重置到起点或重新开始探索');
      return false;
    }
    const success = exploreGame.guess(move);
    if (success) {
      boardKey++;
      if (hasConflict()) {
        markFailed();
        alert('探索失败：棋盘出现冲突！');
      }
    }
    return success;
  }

  // 新增：独立 Undo
  function handleUndo() {
    if (exploreGame.canUndo()) {
      exploreGame.undo();
      boardKey++;               // 强制 Board 刷新
    }
  }

  // 新增：独立 Redo
  function handleRedo() {
    if (exploreGame.canRedo()) {
      exploreGame.redo();
      boardKey++;
    }
  }

  function commit() {
    const mainGame = getGame();
    const finalSudoku = exploreGame.getSudoku();
    mainGame.replaceCurrentSudoku(finalSudoku, true);
    gameStore.set(mainGame); // 触发主界面刷新
    dispatch('close');
  }

  function abort() {
    dispatch('close');
  }
</script>

<div class="modal-overlay" on:click={e => e.target === e.currentTarget && abort()}>
  <div class="modal-content">
    <h2>探索模式</h2>
    <p>独立尝试，不会影响主游戏。提交后主游戏将更新为当前局面。</p>
    {#key boardKey}
      <div class="explore-board">
        <Board game={exploreGame} />
      </div>
    {/key}
    <div class="explore-controls">
      <button on:click={handleUndo}>↩️ 撤销</button>
      <button on:click={handleRedo}>↪️ 重做</button>
      <button on:click={resetToStart}>重置到起点</button>
      <button on:click={commit}>提交</button>
      <button on:click={abort}>放弃</button>
    </div>
    <Keyboard game={exploreGame} onGuess={handleGuess} />
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .modal-content {
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
  }
  .explore-board {
    margin: 20px 0;
  }
  .explore-controls {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
</style>