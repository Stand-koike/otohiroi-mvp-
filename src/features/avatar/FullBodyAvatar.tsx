import { useEffect, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { mirrorNormalizedPoint } from '../game/handCoords'
import {
  assertPoseLandmarkerModelExists,
  createPoseLandmarker,
} from '../pose/createPoseLandmarker'
import { captureFrame } from './captureFrame'
import { stylizeFrame } from './stylizeFrame'

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

const JOINT_INDICES = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

type Props = {
  video: HTMLVideoElement | null
}

export function FullBodyAvatar({ video }: Props) {
  const [landmarks, setLandmarks] = useState<{ x: number; y: number }[] | null>(null)
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const capturedRef = useRef(false)

  useEffect(() => {
    if (!video) return

    let stopped = false
    let raf = 0
    let landmarker: PoseLandmarker | null = null

    const tryCapturePortrait = () => {
      if (capturedRef.current) return
      try {
        const frame = captureFrame(video)
        const styled = stylizeFrame(frame)
        setPortraitUrl(styled.toDataURL('image/png'))
        capturedRef.current = true
      } catch {
        // 次フレームで再試行
      }
    }

    const loop = (now: number) => {
      if (stopped) return
      raf = requestAnimationFrame(loop)
      if (!landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return
      }

      try {
        const result = landmarker.detectForVideo(video, now)
        const pose = result.landmarks?.[0] ?? null
        if (!pose) return
        setLandmarks(pose.map((point) => ({ x: point.x, y: point.y })))
        tryCapturePortrait()
      } catch {
        // 推論失敗はスキップ
      }
    }

    void (async () => {
      try {
        const modelUrl = await assertPoseLandmarkerModelExists()
        landmarker = await createPoseLandmarker(modelUrl)
        raf = requestAnimationFrame(loop)
      } catch {
        // Pose 未セットアップ時は待機表示のまま
      }
    })()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      landmarker?.close()
      landmarker = null
    }
  }, [video])

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
      {JOINT_INDICES.map((index) => {
        const point = points[index]
        if (!point) return null
        return (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={0.016}
            className="otohiroi-avatar__joint"
          />
        )
      })}
    </svg>
  )
}
