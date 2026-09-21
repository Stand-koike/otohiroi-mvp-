import { captureFrame } from './captureFrame'
import { stylizeFrame } from './stylizeFrame'

export function captureStylizedPortrait(video: HTMLVideoElement): string {
  const frame = captureFrame(video)
  const styled = stylizeFrame(frame)
  return styled.toDataURL('image/png')
}
