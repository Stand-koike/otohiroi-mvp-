import { useEffect, useRef } from 'react'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import { startCameraStream, toCameraFailure } from '../camera/startCamera'
import { type GestureRuntimeSnapshot } from './cameraStatus'
import { assertHandLandmarkerModelExists, createHandLandmarker } from './createHandLandmarker'

type Props = {
  enabled?: boolean
  onRuntimeError?: (message: string | null) => void
  onStatusChange?: (snapshot: GestureRuntimeSnapshot) => void
  concealVideo?: boolean
  onVideoReady?: (video: HTMLVideoElement) => void
}

const EMPTY_SNAPSHOT: GestureRuntimeSnapshot = {
  cameraStatus: 'off',
  errorMessage: null,
  handDetected: false,
  landmarks: null,
  handsLandmarks: null,
}

export function GestureController({
  enabled = true,
  onRuntimeError,
  onStatusChange,
  concealVideo = false,
  onVideoReady,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onRuntimeErrorRef = useRef(onRuntimeError)
  const onStatusChangeRef = useRef(onStatusChange)
  const onVideoReadyRef = useRef(onVideoReady)
  const enabledRef = useRef(enabled)

  onRuntimeErrorRef.current = onRuntimeError
  onStatusChangeRef.current = onStatusChange
  onVideoReadyRef.current = onVideoReady
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) {
      onRuntimeErrorRef.current?.(null)
      onStatusChangeRef.current?.(EMPTY_SNAPSHOT)
      return
    }

    let stopped = false
    let raf = 0
    let stream: MediaStream | null = null
    let landmarker: HandLandmarker | null = null
    let modelUrl: string | null = null
    let lastSnapshot = EMPTY_SNAPSHOT

    const publish = (next: GestureRuntimeSnapshot) => {
      if (
        lastSnapshot.cameraStatus === next.cameraStatus &&
        lastSnapshot.errorMessage === next.errorMessage &&
        lastSnapshot.handDetected === next.handDetected &&
        lastSnapshot.landmarks === next.landmarks &&
        lastSnapshot.handsLandmarks === next.handsLandmarks
      ) {
        return
      }
      lastSnapshot = next
      onStatusChangeRef.current?.(next)
    }

    const fail = (message: string) => {
      onRuntimeErrorRef.current?.(message)
      publish({
        ...EMPTY_SNAPSHOT,
        cameraStatus: 'error',
        errorMessage: message,
      })
    }

    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
      if (videoRef.current) videoRef.current.srcObject = null
    }

    async function ensureLandmarker() {
      if (landmarker) return landmarker
      if (!modelUrl) {
        modelUrl = await assertHandLandmarkerModelExists()
      }
      landmarker = await createHandLandmarker(modelUrl)
      return landmarker
    }

    async function start() {
      const video = videoRef.current
      if (!video) return

      publish({ ...EMPTY_SNAPSHOT, cameraStatus: 'starting' })

      try {
        stream = await startCameraStream()
        if (stopped) {
          stopStream()
          return
        }
        video.srcObject = stream
        video.muted = true
        await video.play()
        onVideoReadyRef.current?.(video)
      } catch (error) {
        fail(toCameraFailure(error).message)
        return
      }

      try {
        await ensureLandmarker()
      } catch (error) {
        stopStream()
        fail(error instanceof Error ? error.message : String(error))
        return
      }

      if (stopped) return
      onRuntimeErrorRef.current?.(null)

      const loop = (now: number) => {
        if (stopped || !enabledRef.current) return
        raf = requestAnimationFrame(loop)

        if (!landmarker || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          return
        }

        try {
          const result = landmarker.detectForVideo(video, now)
          const handsRaw = result.landmarks ?? []
          const hand = handsRaw[0] ?? null
          const handsLandmarks = handsRaw.length
            ? handsRaw.map((item) => item.map((p) => ({ x: p.x, y: p.y })))
            : null

          publish({
            cameraStatus: hand ? 'hand_detected' : 'no_hand',
            errorMessage: null,
            handDetected: Boolean(hand),
            landmarks: hand ? hand.map((p) => ({ x: p.x, y: p.y })) : null,
            handsLandmarks,
          })
        } catch {
          publish({
            cameraStatus: 'no_hand',
            errorMessage: lastSnapshot.errorMessage,
            handDetected: false,
            landmarks: null,
            handsLandmarks: null,
          })
        }
      }

      publish({ ...EMPTY_SNAPSHOT, cameraStatus: 'no_hand' })
      raf = requestAnimationFrame(loop)
    }

    void start()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
      stopStream()
      landmarker?.close()
      landmarker = null
    }
  }, [enabled])

  useEffect(() => {
    if (enabled) return
    if (videoRef.current) videoRef.current.srcObject = null
  }, [enabled])

  if (!enabled) {
    return null
  }

  return (
    <video
      ref={videoRef}
      className={concealVideo ? 'camera-video camera-video--concealed' : 'camera-video'}
      muted
      playsInline
      autoPlay
      aria-hidden
    />
  )
}
