import type { NormalizedPoint } from './handCoords'

/** 音符 ♪ の表示半径（px） */
export const NOTE_RADIUS_PX = 58

/**
 * 指先（正規化座標）と音符中心の距離がこの px 以下なら取得。
 * 子ども向けに表示よりやや広め（取りこぼしを減らす）。
 */
export const HIT_RADIUS_PX = 98

/** 画面に同時に出す ♪ の数（多すぎない） */
export const SIMULTANEOUS_NOTE_COUNT = 2

/** 左右の出現余白（正規化 0–1） */
export const SPAWN_X_MARGIN = 0.08

/** 出現 Y の下限・上限（正規化）。腰〜胸あたりの操作しやすい帯 */
export const SPAWN_Y_MIN = 0.2
export const SPAWN_Y_MAX = 0.68

/** 再スポーン時、指の近くを避ける正規化距離 */
export const SPAWN_CLEARANCE = 0.16

export const SPAWN_MAX_ATTEMPTS = 16

/** コンボが途切れたとみなす無取得時間（ms）— 子ども向けに長め */
export const COMBO_IDLE_RESET_MS = 2400

/** コンボタイムアウトの UI 更新間隔（ms） */
export const COMBO_EXPIRE_POLL_MS = 120

/** ♪ を何 beat 前から表示するか（DDR の早め表示） */
export const NOTE_SPAWN_LEAD_BEATS = 1

/** 判定: Perfect / Good の許容（beat 単位） */
export const JUDGMENT_PERFECT_BEATS = 0.12
export const JUDGMENT_GOOD_BEATS = 0.28

/** この beat を過ぎたらミスとして ♪ を消す（target + late） */
export const JUDGMENT_MISS_LATE_BEATS = 0.38

/** リズムループの tick（ms） */
export const RHYTHM_TICK_MS = 50

/** 譜面 BGM 用の短音音量（0–1） */
export const CHART_MUSIC_GAIN = 0.42

export function randomSpawnPosition(avoid?: NormalizedPoint | null): {
  x: number
  y: number
} {
  const xSpan = 1 - SPAWN_X_MARGIN * 2
  const ySpan = SPAWN_Y_MAX - SPAWN_Y_MIN
  for (let attempt = 0; attempt < SPAWN_MAX_ATTEMPTS; attempt += 1) {
    const x = SPAWN_X_MARGIN + Math.random() * xSpan
    const y = SPAWN_Y_MIN + Math.random() * ySpan
    if (avoid && Math.hypot(x - avoid.x, y - avoid.y) < SPAWN_CLEARANCE) {
      continue
    }
    return { x, y }
  }
  return {
    x: SPAWN_X_MARGIN + Math.random() * xSpan,
    y: SPAWN_Y_MIN + Math.random() * ySpan,
  }
}
