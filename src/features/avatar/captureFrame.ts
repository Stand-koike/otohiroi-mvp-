/** カメラ video から 1 フレームを canvas にコピーする（外部 API なし）。 */

export type CaptureFrameOptions = {
  mirrorX?: boolean
  maxWidth?: number
}

export function captureFrame(
  video: HTMLVideoElement,
  options: CaptureFrameOptions = {},
): HTMLCanvasElement {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !vw || !vh) {
    throw new Error('no video frame')
  }

  const maxWidth = options.maxWidth ?? 480
  const scale = Math.min(1, maxWidth / vw)
  const width = Math.max(1, Math.round(vw * scale))
  const height = Math.max(1, Math.round(vh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('2d context unavailable')
  }

  const mirrorX = options.mirrorX ?? true
  if (mirrorX) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, width, height)
  return canvas
}
