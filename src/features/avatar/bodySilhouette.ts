import type { NormalizedPoint } from '../game/handCoords'

const POSE_LEFT_WRIST = 15
const POSE_RIGHT_WRIST = 16

export type HandPoseLink = {
  handIndex: number
  poseWristIndex: typeof POSE_LEFT_WRIST | typeof POSE_RIGHT_WRIST
  handWrist: NormalizedPoint
  poseWrist: NormalizedPoint
}

function distance(a: NormalizedPoint, b: NormalizedPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function lerp(a: NormalizedPoint, b: NormalizedPoint, t: number): NormalizedPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function perpendicularOffset(
  from: NormalizedPoint,
  to: NormalizedPoint,
  halfWidth: number,
): [NormalizedPoint, NormalizedPoint] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * halfWidth
  const ny = (dx / len) * halfWidth
  return [
    { x: from.x + nx, y: from.y + ny },
    { x: from.x - nx, y: from.y - ny },
  ]
}

/** 2 点間の太い limb（カプセル） */
export function limbCapsulePath(
  from: NormalizedPoint,
  to: NormalizedPoint,
  halfWidth: number,
): string {
  const [fromA, fromB] = perpendicularOffset(from, to, halfWidth)
  const [toA, toB] = perpendicularOffset(to, from, halfWidth)
  return [
    `M ${fromA.x} ${fromA.y}`,
    `L ${toA.x} ${toA.y}`,
    `L ${toB.x} ${toB.y}`,
    `L ${fromB.x} ${fromB.y}`,
    'Z',
  ].join(' ')
}

/** 肩〜腰の胴体シルエット（1 パス） */
export function torsoSilhouettePath(points: NormalizedPoint[]): string | null {
  const leftShoulder = points[11]
  const rightShoulder = points[12]
  const leftHip = points[23]
  const rightHip = points[24]
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null

  const shoulderW = distance(leftShoulder, rightShoulder)
  const hipW = distance(leftHip, rightHip)
  const shoulderPad = Math.max(0.028, shoulderW * 0.22)
  const hipPad = Math.max(0.032, hipW * 0.28)
  const neck = lerp(leftShoulder, rightShoulder, 0.5)
  neck.y -= shoulderPad * 0.35

  const [lsOut, lsIn] = perpendicularOffset(leftShoulder, rightShoulder, shoulderPad)
  const [rsOut, rsIn] = perpendicularOffset(rightShoulder, leftShoulder, shoulderPad)
  const [lhOut, lhIn] = perpendicularOffset(leftHip, rightHip, hipPad)
  const [rhOut, rhIn] = perpendicularOffset(rightHip, leftHip, hipPad)

  return [
    `M ${neck.x} ${neck.y}`,
    `L ${lsOut.x} ${lsOut.y}`,
    `L ${lhOut.x} ${lhOut.y}`,
    `L ${rhOut.x} ${rhOut.y}`,
    `L ${rsOut.x} ${rsOut.y}`,
    `L ${rsIn.x} ${rsIn.y}`,
    `L ${rhIn.x} ${rhIn.y}`,
    `L ${lhIn.x} ${lhIn.y}`,
    `L ${lsIn.x} ${lsIn.y}`,
    'Z',
  ].join(' ')
}

export function legSilhouettePaths(points: NormalizedPoint[]): string[] {
  const paths: string[] = []
  const legPairs: [number, number, number][] = [
    [23, 25, 27],
    [24, 26, 28],
  ]
  for (const [hip, knee, ankle] of legPairs) {
    const a = points[hip]
    const b = points[knee]
    const c = points[ankle]
    if (!a || !b || !c) continue
    const wUpper = Math.max(0.022, distance(a, b) * 0.28)
    const wLower = Math.max(0.018, distance(b, c) * 0.24)
    paths.push(limbCapsulePath(a, b, wUpper))
    paths.push(limbCapsulePath(b, c, wLower))
  }
  return paths
}

export function armSilhouettePaths(points: NormalizedPoint[]): string[] {
  const paths: string[] = []
  const arms: [number, number, number][] = [
    [11, 13, POSE_LEFT_WRIST],
    [12, 14, POSE_RIGHT_WRIST],
  ]
  for (const [shoulder, elbow, wristIndex] of arms) {
    const a = points[shoulder]
    const b = points[elbow]
    const c = points[wristIndex]
    if (!a || !b) continue
    paths.push(
      limbCapsulePath(a, b, Math.max(0.02, distance(a, b) * 0.26)),
    )
    if (!c) continue
    paths.push(
      limbCapsulePath(b, c, Math.max(0.018, distance(b, c) * 0.22)),
    )
  }
  return paths
}

export function wristBridgePath(
  poseWrist: NormalizedPoint,
  handWrist: NormalizedPoint,
): string {
  const halfWidth = Math.max(0.012, distance(poseWrist, handWrist) * 0.18)
  return limbCapsulePath(poseWrist, handWrist, halfWidth)
}

/** Hand 手首(0) を Pose 手首 15/16 に距離で割り当て */
export function linkHandsToPoseWrists(
  hands: { x: number; y: number }[][] | null | undefined,
  points: NormalizedPoint[],
  handWristAt: (hand: { x: number; y: number }[]) => NormalizedPoint | null,
): HandPoseLink[] {
  if (!hands?.length) return []

  const poseWrists: Array<typeof POSE_LEFT_WRIST | typeof POSE_RIGHT_WRIST> = [
    POSE_LEFT_WRIST,
    POSE_RIGHT_WRIST,
  ]
  const candidates: {
    handIndex: number
    poseWristIndex: typeof POSE_LEFT_WRIST | typeof POSE_RIGHT_WRIST
    dist: number
    handWrist: NormalizedPoint
    poseWrist: NormalizedPoint
  }[] = []

  for (let handIndex = 0; handIndex < hands.length; handIndex++) {
    const handWrist = handWristAt(hands[handIndex])
    if (!handWrist) continue
    for (const poseWristIndex of poseWrists) {
      const poseWrist = points[poseWristIndex]
      if (!poseWrist) continue
      candidates.push({
        handIndex,
        poseWristIndex,
        dist: distance(handWrist, poseWrist),
        handWrist,
        poseWrist,
      })
    }
  }

  candidates.sort((a, b) => a.dist - b.dist)
  const usedHands = new Set<number>()
  const usedPose = new Set<number>()
  const links: HandPoseLink[] = []

  for (const item of candidates) {
    if (usedHands.has(item.handIndex) || usedPose.has(item.poseWristIndex)) continue
    if (item.dist > 0.22) continue
    usedHands.add(item.handIndex)
    usedPose.add(item.poseWristIndex)
    links.push({
      handIndex: item.handIndex,
      poseWristIndex: item.poseWristIndex,
      handWrist: item.handWrist,
      poseWrist: item.poseWrist,
    })
  }

  return links
}

export function headClipMetrics(points: NormalizedPoint[]): {
  cx: number
  cy: number
  r: number
} {
  const nose = points[0]
  const leftShoulder = points[11]
  const rightShoulder = points[12]
  const cx =
    nose?.x ??
    (leftShoulder && rightShoulder
      ? (leftShoulder.x + rightShoulder.x) / 2
      : 0.5)
  const cy = nose?.y ?? 0.22
  const shoulderW =
    leftShoulder && rightShoulder
      ? distance(leftShoulder, rightShoulder)
      : 0.18
  return { cx, cy, r: shoulderW * 0.42 }
}
