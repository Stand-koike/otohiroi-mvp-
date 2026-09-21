import {
  INDEX_FINGER_TIP_INDEX,
  MIRROR_LANDMARK_X,
} from '../gesture/handLandmarkerConfig'

export type NormalizedPoint = {
  x: number
  y: number
}

export function mirrorNormalizedPoint(point: {
  x: number
  y: number
}): NormalizedPoint {
  const x = Math.min(1, Math.max(0, MIRROR_LANDMARK_X ? 1 - point.x : point.x))
  const y = Math.min(1, Math.max(0, point.y))
  return { x, y }
}

/** MediaPipe 正規化座標（0–1）を画面操作向けに変換（人差し指先）。 */
export function indexFingerFromLandmarks(
  landmarks: { x: number; y: number }[] | null | undefined,
): NormalizedPoint | null {
  const tip = landmarks?.[INDEX_FINGER_TIP_INDEX]
  if (!tip) return null
  return mirrorNormalizedPoint(tip)
}

/** 両手の人差し指先（検出できた手のみ）。 */
export function indexFingersFromHands(
  hands: { x: number; y: number }[][] | null | undefined,
): NormalizedPoint[] {
  if (!hands?.length) return []
  const points: NormalizedPoint[] = []
  for (const hand of hands) {
    const tip = indexFingerFromLandmarks(hand)
    if (tip) points.push(tip)
  }
  return points
}

export function touchPointsFromSnapshot(snapshot: {
  handsLandmarks: { x: number; y: number }[][] | null
  landmarks: { x: number; y: number }[] | null
}): NormalizedPoint[] {
  const fromHands = indexFingersFromHands(snapshot.handsLandmarks)
  if (fromHands.length > 0) return fromHands
  const single = indexFingerFromLandmarks(snapshot.landmarks)
  return single ? [single] : []
}
