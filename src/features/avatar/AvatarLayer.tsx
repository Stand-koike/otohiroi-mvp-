import { useCallback, useEffect, useRef, useState } from 'react'
import type { NormalizedPoint } from '../game/handCoords'
import { MIRROR_LANDMARK_X } from '../gesture/handLandmarkerConfig'
import { captureFrame } from './captureFrame'
import { stylizeFrame } from './stylizeFrame'
import './avatar.css'

type Props = {
  video: HTMLVideoElement | null
  finger: NormalizedPoint | null
}

/** とりくみキャプチャ + デフォルメ表示。ゲーム側は video / finger を渡すだけ。 */
export function AvatarLayer({ video, finger }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(true)
  const [hint, setHint] = useState<string | null>(null)

  const handleCapture = useCallback(() => {
    try {
      if (!video) {
        throw new Error('no video')
      }
      const frame = captureFrame(video, { mirrorX: MIRROR_LANDMARK_X })
      const stylized = stylizeFrame(frame)
      setImageSrc(stylized.toDataURL('image/png'))
      setHint(null)
      setCapturing(false)
    } catch {
      setImageSrc(null)
      setHint('しゃしんがとれませんでした。とばすと、ゆびだけであそべます。')
    }
  }, [video])

  const handleSkip = useCallback(() => {
    setImageSrc(null)
    setHint(null)
    setCapturing(false)
  }, [])

  const x = finger?.x ?? 0.5
  const y = finger?.y ?? 0.58

  return (
    <>
      {!capturing && imageSrc ? (
        <img
          className="otohiroi-avatar"
          src={imageSrc}
          alt=""
          aria-hidden
          style={{
            left: `${x * 100}%`,
            top: `${y * 100}%`,
          }}
        />
      ) : null}
      {capturing ? (
        <TorikumiOverlay
          video={video}
          hint={hint}
          onCapture={handleCapture}
          onSkip={handleSkip}
        />
      ) : null}
    </>
  )
}

type OverlayProps = {
  video: HTMLVideoElement | null
  hint: string | null
  onCapture: () => void
  onSkip: () => void
}

function TorikumiOverlay({ video, hint, onCapture, onSkip }: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const ctx = canvas.getContext('2d')
      if (!ctx || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return
      }
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = Math.max(1, canvas.clientWidth)
        canvas.height = Math.max(1, canvas.clientHeight)
      }

      const { width, height } = canvas
      const videoRatio = vw / vh
      const canvasRatio = width / height
      let dw = width
      let dh = height
      let dx = 0
      let dy = 0
      if (videoRatio > canvasRatio) {
        dh = height
        dw = height * videoRatio
        dx = (width - dw) / 2
      } else {
        dw = width
        dh = width / videoRatio
        dy = (height - dh) / 2
      }

      ctx.save()
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)
      if (MIRROR_LANDMARK_X) {
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, dx, dy, dw, dh)
      ctx.restore()
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [video])

  return (
    <div className="otohiroi-avatar-torikumi" role="dialog" aria-labelledby="otohiroi-avatar-title">
      <div className="otohiroi-avatar-panel">
        <h2 id="otohiroi-avatar-title">とりくみ</h2>
        <p className="otohiroi-avatar-hint">カメラのまえにたって、しゃしんをとろう</p>
        <canvas ref={canvasRef} className="otohiroi-avatar-preview" aria-hidden />
        {hint ? <p className="otohiroi-avatar-error">{hint}</p> : null}
        <div className="otohiroi-avatar-actions">
          <button type="button" className="otohiroi-avatar-capture" onClick={onCapture}>
            しゃしんをとる
          </button>
          <button type="button" className="otohiroi-avatar-skip" onClick={onSkip}>
            とばす
          </button>
        </div>
      </div>
    </div>
  )
}
