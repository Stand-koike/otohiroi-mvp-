import { COMBO_IDLE_RESET_MS } from './gameTuning'
import type { HitJudgment } from '../rhythm/judgment'
import { judgmentPoints } from '../rhythm/judgment'

export { COMBO_IDLE_RESET_MS } from './gameTuning'

export type ScoreState = {
  /** リズム判定の合計点数 */
  points: number
  combo: number
  lastCollectAt: number
  perfects: number
  goods: number
  misses: number
}

export function createScoreState(): ScoreState {
  return { points: 0, combo: 0, lastCollectAt: 0, perfects: 0, goods: 0, misses: 0 }
}

export function applyHitJudgment(
  state: ScoreState,
  judgment: HitJudgment,
  now: number,
): ScoreState {
  if (judgment === 'miss') {
    return {
      ...state,
      combo: 0,
      misses: state.misses + 1,
      lastCollectAt: now,
    }
  }

  const continues =
    state.combo > 0 && now - state.lastCollectAt <= COMBO_IDLE_RESET_MS

  const combo = (continues ? state.combo : 0) + 1
  const points = judgmentPoints(judgment)

  return {
    points: state.points + points,
    combo,
    lastCollectAt: now,
    perfects: state.perfects + (judgment === 'perfect' ? 1 : 0),
    goods: state.goods + (judgment === 'good' ? 1 : 0),
    misses: state.misses,
  }
}

export function applyAutoMiss(state: ScoreState, now: number): ScoreState {
  if (state.combo === 0) {
    return { ...state, misses: state.misses + 1, lastCollectAt: now }
  }
  return {
    ...state,
    combo: 0,
    misses: state.misses + 1,
    lastCollectAt: now,
  }
}

/** @deprecated リズムモードでは applyHitJudgment を使用 */
export function updateScoreOnCollect(
  state: ScoreState,
  now: number,
  collectCount = 1,
): ScoreState {
  const n = Math.max(0, Math.floor(collectCount))
  if (n === 0) return state
  let next = state
  for (let i = 0; i < n; i += 1) {
    next = applyHitJudgment(next, 'good', now)
  }
  return next
}

export function expireCombo(
  state: ScoreState,
  now: number,
  idleMs = COMBO_IDLE_RESET_MS,
): ScoreState {
  if (state.combo === 0) return state
  if (now - state.lastCollectAt <= idleMs) return state
  return { ...state, combo: 0 }
}
