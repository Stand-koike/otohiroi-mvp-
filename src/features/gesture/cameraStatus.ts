export type CameraStatus =
  | 'off'
  | 'starting'
  | 'ready'
  | 'hand_detected'
  | 'no_hand'
  | 'error'

/** ゲーム向け Hand Landmarker スナップショット（プレゼン操作フィールドなし） */
export type GestureRuntimeSnapshot = {
  cameraStatus: CameraStatus
  errorMessage: string | null
  handDetected: boolean
  /** 第 1 手（互換） */
  landmarks: { x: number; y: number }[] | null
  /** 検出した各手の 21 点 */
  handsLandmarks: { x: number; y: number }[][] | null
}

export function cameraStatusLabel(status: CameraStatus): string {
  switch (status) {
    case 'starting':
      return 'カメラ準備中'
    case 'ready':
    case 'no_hand':
      return '手を探しています'
    case 'hand_detected':
      return '手を認識中'
    case 'error':
      return 'カメラエラー'
    default:
      return 'カメラオフ'
  }
}
