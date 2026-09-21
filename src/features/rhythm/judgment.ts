import {
  JUDGMENT_GOOD_BEATS,
  JUDGMENT_MISS_LATE_BEATS,
  JUDGMENT_PERFECT_BEATS,
} from '../game/gameTuning'

export type HitJudgment = 'perfect' | 'good' | 'miss'

export function beatFromAudioTime(
  audioContextTime: number,
  songStartTime: number,
  bpm: number,
): number {
  const elapsedSec = Math.max(0, audioContextTime - songStartTime)
  return (elapsedSec * bpm) / 60
}

/** まだ早すぎる / 判定窓内 / 遅すぎる */
export function judgeTiming(
  targetBeat: number,
  currentBeat: number,
): HitJudgment | null {
  const delta = currentBeat - targetBeat
  if (delta < -JUDGMENT_GOOD_BEATS) return null
  if (delta > JUDGMENT_MISS_LATE_BEATS) return 'miss'
  if (Math.abs(delta) <= JUDGMENT_PERFECT_BEATS) return 'perfect'
  if (Math.abs(delta) <= JUDGMENT_GOOD_BEATS) return 'good'
  return 'miss'
}

export function isNoteExpired(targetBeat: number, currentBeat: number): boolean {
  return currentBeat - targetBeat > JUDGMENT_MISS_LATE_BEATS
}

export function judgmentPoints(judgment: HitJudgment): number {
  if (judgment === 'perfect') return 2
  if (judgment === 'good') return 1
  return 0
}

export function judgmentLabel(judgment: HitJudgment): string {
  if (judgment === 'perfect') return 'パーフェクト'
  if (judgment === 'good') return 'グッド'
  return 'ミス'
}
