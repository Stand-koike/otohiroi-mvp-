const PALETTE: readonly [number, number, number][] = [
  [36, 28, 58],
  [90, 72, 148],
  [80, 168, 228],
  [250, 220, 90],
  [240, 176, 132],
  [92, 56, 42],
  [248, 112, 140],
  [248, 248, 252],
]

const PIXEL_WIDTH = 160
const OUTLINE: [number, number, number] = [30, 24, 48]

function nearestPalette(r: number, g: number, b: number): [number, number, number] {
  let best = PALETTE[0]
  let bestDist = Infinity
  for (const color of PALETTE) {
    const dr = r - color[0]
    const dg = g - color[1]
    const db = b - color[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      best = color
    }
  }
  return best
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function drawSilhouette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const cx = width * 0.5
  const headY = height * 0.34
  const headR = Math.min(width, height) * 0.16
  const bodyTop = headY + headR * 0.7
  const bodyW = width * 0.38
  const bodyH = height * 0.38

  ctx.save()
  ctx.globalAlpha = 0.28
  ctx.fillStyle = '#7dd3fc'
  ctx.beginPath()
  ctx.ellipse(cx, headY, headR, headR * 1.08, 0, 0, Math.PI * 2)
  ctx.fill()

  const x = cx - bodyW / 2
  const r = Math.min(bodyW, bodyH) * 0.28
  ctx.beginPath()
  ctx.moveTo(x + r, bodyTop)
  ctx.lineTo(x + bodyW - r, bodyTop)
  ctx.quadraticCurveTo(x + bodyW, bodyTop, x + bodyW, bodyTop + r)
  ctx.lineTo(x + bodyW, bodyTop + bodyH - r)
  ctx.quadraticCurveTo(x + bodyW, bodyTop + bodyH, x + bodyW - r, bodyTop + bodyH)
  ctx.lineTo(x + r, bodyTop + bodyH)
  ctx.quadraticCurveTo(x, bodyTop + bodyH, x, bodyTop + bodyH - r)
  ctx.lineTo(x, bodyTop + r)
  ctx.quadraticCurveTo(x, bodyTop, x + r, bodyTop)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.strokeStyle = 'rgba(30, 27, 75, 0.7)'
  ctx.lineWidth = Math.max(2, width / 80)
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.ellipse(cx, headY, headR, headR * 1.08, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeRect(x + 1, bodyTop + 1, bodyW - 2, bodyH - 2)
  ctx.restore()
}

/** Canvas 2D のみでパレット化・輪郭強調・シルエット overlay。 */
export function stylizeFrame(source: HTMLCanvasElement): HTMLCanvasElement {
  const srcW = source.width
  const srcH = source.height
  if (!srcW || !srcH) {
    throw new Error('empty source')
  }

  const width = PIXEL_WIDTH
  const height = Math.max(1, Math.round((srcH / srcW) * width))

  const work = document.createElement('canvas')
  work.width = width
  work.height = height
  const ctx = work.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('2d context unavailable')
  }

  ctx.imageSmoothingEnabled = true
  ctx.drawImage(source, 0, 0, width, height)

  const image = ctx.getImageData(0, 0, width, height)
  const { data } = image
  const quantized = new Uint8ClampedArray(data.length)
  quantized.set(data)

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = nearestPalette(data[i], data[i + 1], data[i + 2])
    quantized[i] = r
    quantized[i + 1] = g
    quantized[i + 2] = b
    quantized[i + 3] = 255
  }

  const outlined = new Uint8ClampedArray(quantized)
  const threshold = 38
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const i = (y * width + x) * 4
      const right = i + 4
      const down = ((y + 1) * width + x) * 4
      const lum = luminance(quantized[i], quantized[i + 1], quantized[i + 2])
      const lumR = luminance(quantized[right], quantized[right + 1], quantized[right + 2])
      const lumD = luminance(quantized[down], quantized[down + 1], quantized[down + 2])
      if (Math.abs(lum - lumR) > threshold || Math.abs(lum - lumD) > threshold) {
        outlined[i] = OUTLINE[0]
        outlined[i + 1] = OUTLINE[1]
        outlined[i + 2] = OUTLINE[2]
      }
    }
  }

  image.data.set(outlined)
  ctx.putImageData(image, 0, 0)
  drawSilhouette(ctx, width, height)

  const out = document.createElement('canvas')
  const scale = 3
  out.width = width * scale
  out.height = height * scale
  const outCtx = out.getContext('2d')
  if (!outCtx) {
    throw new Error('2d context unavailable')
  }
  outCtx.imageSmoothingEnabled = false
  outCtx.drawImage(work, 0, 0, out.width, out.height)
  return out
}
