<script>
  import { candidates } from '@sudoku/stores/candidates';
  import { cursor } from '@sudoku/stores/cursor';
  import { hints } from '@sudoku/stores/hints';
  import { notes } from '@sudoku/stores/notes';
  import { settings } from '@sudoku/stores/settings';
  import { keyboardDisabled } from '@sudoku/stores/keyboard';
  import { gamePaused } from '@sudoku/stores/game';
  import { getGame, gameStore } from '@sudoku/stores/gameInstance';
  import { userGrid } from '@sudoku/stores/grid';
  import { solveSudoku } from '@sudoku/sudoku';
  import ExploreModal from './ExploreModal.svelte';
  import { isExploring } from '@sudoku/stores/explore';

  $: hintsAvailable = $hints > 0;

  let exploreModalOpen = false;

  function showCandidatesHint() {
    const game = getGame();
    if (!game) return;
    const pos = $cursor;
    if (pos.x === null || pos.y === null) {
      alert('请先选中一个格子');
      return;
    }
    const candidatesList = game.getSudoku().getCandidates(pos.y, pos.x);
    if (candidatesList.length === 0) {
      alert('该格子已有数字或没有候选数');
    } else {
      alert(`候选数字: ${candidatesList.join(', ')}`);
    }
  }

  function showLightHint() {
    const game = getGame();
    if (!game) return;
    const hint = game.getSudoku().getLightHint();
    if (!hint) {
        alert('当前没有可填数字的空格');
    } else {
        alert(`💡 轻度提示：可以尝试在 (${hint.row+1}, ${hint.col+1}) 填入数字。`);
    }
}

function showMediumHint() {
    const game = getGame();
    if (!game) return;
    const hint = game.getSudoku().getMediumHint();
    if (!hint) {
        alert('没有唯一候选的格子，请使用探索模式');
    } else {
        alert(`📌 中度提示：在 (${hint.row+1}, ${hint.col+1}) 填入 ${hint.value}`);
    }
}

function showDeepHint() {
    const game = getGame();
    if (!game) return;
    const hint = game.getSudoku().getDeepHint();
    if (!hint) {
        alert('没有唯一候选的格子，请使用探索模式');
    } else {
        alert(`🔍 深度提示：在 (${hint.row+1}, ${hint.col+1}) 填入 ${hint.value}\n原因：${hint.reason}`);
    }
}

  function handleHint() {
  const game = getGame();
  if (!hintsAvailable || !game) return;
  const pos = $cursor;
  if (pos.x === null || pos.y === null) return;

  // 获取当前网格的完整解
  const currentGrid = game.getSudoku().getGrid();
  const solvedGrid = solveSudoku(currentGrid);  
  const correctValue = solvedGrid[pos.y][pos.x];

  if (correctValue && correctValue !== currentGrid[pos.y][pos.x]) {
    const success = game.guess({ row: pos.y, col: pos.x, value: correctValue });
    if (success) {
      gameStore.set(game);           // 触发 UI 更新
      hints.useHint();               // 减少提示次数
      candidates.clear(pos);         // 清除该格笔记
    }
  }
}

  function handleUndo() {
    const game = getGame();
    if (game && game.canUndo()) {
      game.undo();
      gameStore.set(game);
      if ($cursor.x !== null && $cursor.y !== null) {
        candidates.clear($cursor);
      }
    }
  }

  function handleRedo() {
    const game = getGame();
    if (game && game.canRedo()) {
      game.redo();
      gameStore.set(game);
      if ($cursor.x !== null && $cursor.y !== null) {
        candidates.clear($cursor);
      }
    }
  }

  function handleNotesToggle() {
    notes.toggle();
  }

  function openExplore() {
    exploreModalOpen = true;
    isExploring.set(true);
  }

  function closeExplore() {
    exploreModalOpen = false;
    isExploring.set(false);
  }
</script>

<div class="action-buttons space-x-3">
  <button class="btn btn-round" disabled={$gamePaused} on:click={handleUndo} title="Undo">
    <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  </button>

  <button class="btn btn-round" disabled={$gamePaused} on:click={handleRedo} title="Redo">
    <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
    </svg>
  </button>

  <button class="btn btn-round" disabled={$keyboardDisabled || $gamePaused} on:click={showCandidatesHint} title="候选提示">
    <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </button>

  <button class="btn btn-round" disabled={$gamePaused} on:click={showLightHint} title="轻度提示">
        ℹ️
  </button>
  <button class="btn btn-round" disabled={$gamePaused} on:click={showMediumHint} title="中度提示">
        📘
  </button>
  <button class="btn btn-round" disabled={$gamePaused} on:click={showDeepHint} title="深度提示">
        📚
  </button>

  <button class="btn btn-round btn-badge" disabled={$keyboardDisabled || !hintsAvailable || ($cursor.x !== null && $cursor.y !== null && $userGrid[$cursor.y]?.[$cursor.x] !== 0)} on:click={handleHint} title="自动填入提示 ({$hints})">
    <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
    {#if $settings.hintsLimited}
      <span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
    {/if}
  </button>

  <button class="btn btn-round btn-badge" on:click={handleNotesToggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
    <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
    <span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
  </button>

  <button class="btn btn-round" disabled={$gamePaused} on:click={openExplore} title="探索模式">
    <svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  </button>
</div>

{#if exploreModalOpen}
  <ExploreModal on:close={closeExplore} />
{/if}

<style>
  .action-buttons {
    @apply flex flex-wrap justify-evenly self-end;
  }
  .btn-badge {
    @apply relative;
  }
  .badge {
    min-height: 20px;
    min-width: 20px;
    @apply p-1 rounded-full leading-none text-center text-xs text-white bg-gray-600 inline-block absolute top-0 left-0;
  }
  .badge-primary {
    @apply bg-primary;
  }
</style>
