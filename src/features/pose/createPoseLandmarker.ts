import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { MEDIAPIPE_WASM_PATH } from '../gesture/handLandmarkerConfig'
import {
  POSE_LANDMARKER_MODEL_PATH,
  POSE_LANDMARKER_OPTIONS,
} from './poseLandmarkerConfig'

function assetUrl(relativePath: string): string {
  return new URL(`${import.meta.env.BASE_URL}${relativePath}`, window.location.href).href
}

export async function assertPoseLandmarkerModelExists(): Promise<string> {
  const modelUrl = assetUrl(POSE_LANDMARKER_MODEL_PATH)

  try {
    const head = await fetch(modelUrl, { method: 'HEAD' })
    const length = Number(head.headers.get('content-length') ?? 0)
    if (head.ok && length >= 1024) {
      return modelUrl
    }
  } catch {
    // fall through
  }

  let response: Response
  try {
    response = await fetch(modelUrl)
  } catch {
    throw new Error(
      `PoseLandmarkerのモデルファイルを読み込めませんでした: ${modelUrl}。npm run setup:models を実行してください。`,
    )
  }

  if (response.status === 404 || !response.ok) {
    throw new Error(
      `PoseLandmarkerのモデルファイルが見つかりません (HTTP ${response.status}): ${modelUrl}。`,
    )
  }

  const buffer = await response.arrayBuffer()
  if (buffer.byteLength < 1024) {
    throw new Error(`PoseLandmarkerのモデルファイルが不正です: ${modelUrl}。`)
  }

  return modelUrl
}

export async function createPoseLandmarker(modelUrl: string): Promise<PoseLandmarker> {
  const wasmUrl = assetUrl(MEDIAPIPE_WASM_PATH).replace(/\/?$/, '/')
  const vision = await FilesetResolver.forVisionTasks(wasmUrl)

  const shared = {
    runningMode: POSE_LANDMARKER_OPTIONS.runningMode,
    numPoses: POSE_LANDMARKER_OPTIONS.numPoses,
    minPoseDetectionConfidence: POSE_LANDMARKER_OPTIONS.minPoseDetectionConfidence,
    minPosePresenceConfidence: POSE_LANDMARKER_OPTIONS.minPosePresenceConfidence,
    minTrackingConfidence: POSE_LANDMARKER_OPTIONS.minTrackingConfidence,
  }

  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelUrl,
        delegate: 'GPU',
      },
      ...shared,
    })
  } catch {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelUrl,
        delegate: 'CPU',
      },
      ...shared,
    })
  }
}
