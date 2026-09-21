import { useEffect, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { mirrorNormalizedPoint } from '../game/handCoords'
import {
  assertPoseLandmarkerModelExists,
  createPoseLandmarker,
} from '../pose/createPoseLandmarker'
import { captureStylizedPortrait } from './capturePortrait'
import { HAND_BONE_EDGES, mirroredHandPoints } from './handDrawing'

const BODY_EDGES: readonly [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [0, 11],
  [0, 12],
]

const POSE_STABLE_FRAMES = 45

type Props = {
  video: HTMLVideoElement | null
  handsLandmarks: { x: number; y: number }[][] | null
  portraitUrl: string | null
  showHands: boolean
  onPoseStableChange?: (stable: boolean) => void
}

export function FullBodyAvatar({
  video,
  handsLandmarks,
  portraitUrl,
  showHands,
  onPoseStableChange,
}: Props) {
  const [landmarks, setLandmarks] = useState<{ x: number; y: number }[] | null>(null)
  const stableFramesRef = useRef(0)
  const stableSentRef = useRef(false)

  useEffect(() => {
    if (!video) return

    let stopped = false
    let raf = 0
    let landmarker: PoseLandmarker | null = null

    const loop = (now: number) => {
      if (stopped) return
      raf = requestAnimationFrame(loop)
      if (!landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return
      }

      try {
        const result = landmarker.detectForVideo(video, now)
        const pose = result.landmarks?.[0] ?? null
        if (!pose) {
          stableFramesRef.current = 0
          onPoseStableChange?.(false)
          return
        }
        setLandmarks(pose.map((point) => ({ x: point.x, y: point.y })))

        const points = pose.map((point) => mirrorNormalizedPoint(point))
        const torsoOk = [11, 12, 23, 24].every((index) => Boolean(points[index]))
        if (torsoOk) {
          stableFramesRef.current += 1
        } else {
          stableFramesRef.current = 0
        }
        const stable = stableFramesRef.current >= POSE_STABLE_FRAMES
        if (stable && !stableSentRef.current) {
          stableSentRef.current = true
        }
        onPoseStableChange?.(stable)
      } catch {
        stableFramesRef.current = 0
        onPoseStableChange?.(false)
      }
    }

    void (async () => {
      try {
        const modelUrl = await assertPoseLandmarkerModelExists()
        landmarker = await createPoseLandmarker(modelUrl)
        raf = requestAnimationFrame(loop)
      } catch {
        onPoseStableChange?.(false)
      }
    })()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      landmarker?.close()
      landmarker = null
    }
  }, [video, onPoseStableChange])

  if (!landmarks?.length) {
    return (
      <p className="otohiroi-avatar-hint" aria-live="polite">
        からだ全体がうつるように立ってね
      </p>
    )
  }

  const points = landmarks.map((point) => mirrorNormalizedPoint(point))
  const nose = points[0]
  const leftShoulder = points[11]
  const rightShoulder = points[12]
  const headCx =
    nose?.x ??
    (leftShoulder && rightShoulder ? (leftShoulder.x + rightShoulder.x) / 2 : 0.5)
  const headCy = nose?.y ?? 0.22
  const shoulderW =
    leftShoulder && rightShoulder
      ? Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y)
      : 0.18

  const handLayers =
    showHands && handsLandmarks?.length
      ? handsLandmarks.map((hand, handIndex) => {
          const mirrored = mirroredHandPoints(hand)
          return (
            <g key={`hand-${handIndex}`} className="otohiroi-avatar__hand">
              {HAND_BONE_EDGES.map(([from, to]) => {
                const start = mirrored[from]
                const end = mirrored[to]
                if (!start || !end) return null
                return (
                  <line
                    key={`${handIndex}-${from}-${to}`}
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    className="otohiroi-avatar__hand-bone"
                  />
                )
              })}
              {mirrored[8] ? (
                <circle
                  cx={mirrored[8].x}
                  cy={mirrored[8].y}
                  r={0.022}
                  className="otohiroi-avatar__touch"
                />
              ) : null}
            </g>
          )
        })
      : null

  return (
    <svg
      className="otohiroi-avatar"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden
    >
      {portraitUrl ? (
        <image
          href={portraitUrl}
          x={headCx - shoulderW * 0.55}
          y={headCy - shoulderW * 0.75}
          width={shoulderW * 1.15}
          height={shoulderW * 1.15}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : null}
      {BODY_EDGES.map(([from, to]) => {
        const start = points[from]
        const end = points[to]
        if (!start || !end) return null
        return (
          <line
            key={`${from}-${to}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            className="otohiroi-avatar__bone"
          />
        )
      })}
      {handLayers}
    </svg>
  )
}

export { captureStylizedPortrait }
