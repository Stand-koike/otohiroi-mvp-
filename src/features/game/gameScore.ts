/** 連続取得が途切れたとみなす無取得時間（ミリ秒）。 */
export const COMBO_IDLE_RESET_MS = 1600

export type ScoreState = {
  /** 取得した音符の総数 */
  total: number
  /** 連続取得数。タイムアウトで 0 に戻る */
  combo: number
  /** 最後に取得した時刻（performance.now 相当） */
  lastCollectAt: number
}

export function createScoreState(): ScoreState {
  return { total: 0, combo: 0, lastCollectAt: 0 }
}

/**
 * 1 フレームで `collectCount` 個取得したときのスコア更新。
 * 直前の取得から COMBO_IDLE_RESET_MS 以内ならコンボを継続する。
 */
export function updateScoreOnCollect(
  state: ScoreState,
  now: number,
  collectCount = 1,
): ScoreState {
  const n = Math.max(0, Math.floor(collectCount))
  if (n === 0) return state

  const continues =
    state.combo > 0 && now - state.lastCollectAt <= COMBO_IDLE_RESET_MS

  return {
    total: state.total + n,
    combo: (continues ? state.combo : 0) + n,
    lastCollectAt: now,
  }
}

/**
 * 一定時間取得がなければコンボをリセットする。
 * 変化がなければ同一参照を返す。
 */
export function expireCombo(
  state: ScoreState,
  now: number,
  idleMs = COMBO_IDLE_RESET_MS,
): ScoreState {
  if (state.combo === 0) return state
  if (now - state.lastCollectAt <= idleMs) return state
  return { ...state, combo: 0 }
}
