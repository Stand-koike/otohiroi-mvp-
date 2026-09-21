import { useEffect, useId, useRef, useState } from 'react'
import type { PoseLandmarker } from '@mediapipe/tasks-vision'
import { mirrorNormalizedPoint } from '../game/handCoords'
import {
  assertPoseLandmarkerModelExists,
  createPoseLandmarker,
} from '../pose/createPoseLandmarker'
import { captureStylizedPortrait } from './capturePortrait'
import {
  armSilhouettePaths,
  headClipMetrics,
  legSilhouettePaths,
  linkHandsToPoseWrists,
  torsoSilhouettePath,
  wristBridgePath,
} from './bodySilhouette'
import { HAND_BONE_EDGES, mirroredHandPoints } from './handDrawing'

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
  const faceClipId = useId().replace(/:/g, '')
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
  const head = headClipMetrics(points)
  const torsoPath = torsoSilhouettePath(points)
  const legPaths = legSilhouettePaths(points)
  const handLinks =
    showHands && handsLandmarks?.length
      ? linkHandsToPoseWrists(handsLandmarks, points, (hand) => {
          const mirrored = mirroredHandPoints(hand)
          return mirrored[0] ?? null
        })
      : []
  const armPaths = armSilhouettePaths(points)
  const bridgePaths = handLinks.map((link) =>
    wristBridgePath(link.poseWrist, link.handWrist),
  )

  const portraitSize = head.r * 2.15
  const portraitX = head.cx - portraitSize / 2
  const portraitY = head.cy - portraitSize * 0.52

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
      <defs>
        <clipPath id={faceClipId}>
          <circle cx={head.cx} cy={head.cy} r={head.r} />
        </clipPath>
      </defs>

      <g className="otohiroi-avatar__body">
        {torsoPath ? <path d={torsoPath} className="otohiroi-avatar__fill" /> : null}
        {legPaths.map((path, index) => (
          <path key={`leg-${index}`} d={path} className="otohiroi-avatar__fill" />
        ))}
        {armPaths.map((path, index) => (
          <path key={`arm-${index}`} d={path} className="otohiroi-avatar__fill" />
        ))}
        {bridgePaths.map((path, index) => (
          <path key={`bridge-${index}`} d={path} className="otohiroi-avatar__fill" />
        ))}
      </g>

      {portraitUrl ? (
        <image
          href={portraitUrl}
          x={portraitX}
          y={portraitY}
          width={portraitSize}
          height={portraitSize}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${faceClipId})`}
          className="otohiroi-avatar__face"
        />
      ) : null}

      {handLayers}
    </svg>
  )
}

export { captureStylizedPortrait }
