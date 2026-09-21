import { INDEX_FINGER_TIP_INDEX } from '../gesture/handLandmarkerConfig'
import { mirrorNormalizedPoint, type NormalizedPoint } from '../game/handCoords'

/** 手の骨格（MediaPipe Hand 21 点） */
export const HAND_BONE_EDGES: readonly [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
]

export function mirroredHandPoints(
  hand: { x: number; y: number }[],
): NormalizedPoint[] {
  return hand.map((point) => mirrorNormalizedPoint(point))
}

export function indexTipsFromHands(
  hands: { x: number; y: number }[][] | null | undefined,
): NormalizedPoint[] {
  if (!hands?.length) return []
  const tips: NormalizedPoint[] = []
  for (const hand of hands) {
    const tip = hand[INDEX_FINGER_TIP_INDEX]
    if (tip) tips.push(mirrorNormalizedPoint(tip))
  }
  return tips
}
