import { useCallback, useEffect, useRef, useState } from 'react'
import { AvatarLayer } from '../avatar'
import type { GestureRuntimeSnapshot } from '../gesture/cameraStatus'
import { GestureController } from '../gesture/GestureController'
import { useGestureSettings } from '../gesture/useGestureSettings'
import {
  createScoreState,
  expireCombo,
  updateScoreOnCollect,
  type ScoreState,
} from './gameScore'
import { indexFingerFromLandmarks, type NormalizedPoint } from './handCoords'

const NOTE_RADIUS_PX = 52
const FINGER_RADIUS_PX = 28
/** 指先と音符の当たり半径（px）。重なっていても各音符を独立判定する。 */
const HIT_RADIUS_PX = NOTE_RADIUS_PX + FINGER_RADIUS_PX
const MARGIN = 0.1
const SIMULTANEOUS_NOTE_COUNT = 3
/** 指の直下への再スポーンを避ける正規化距離。 */
const SPAWN_CLEARANCE = 0.14

const PITCHES_HZ = [261.63, 329.63, 392, 523.25] // C4, E4, G4, C5

type GameNote = {
  id: string
  x: number
  y: number
  pitchIndex: number
}

let noteSeq = 0

function randomNote(avoid?: NormalizedPoint | null): GameNote {
  noteSeq += 1
  const id = `note-${noteSeq}`
  for (let attempt = 0; attempt < 16; attempt++) {
    const x = MARGIN + Math.random() * (1 - MARGIN * 2)
    const y = MARGIN + Math.random() * (1 - MARGIN * 2)
    if (
      avoid &&
      Math.hypot(x - avoid.x, y - avoid.y) < SPAWN_CLEARANCE
    ) {
      continue
    }
    return {
      id,
      x,
      y,
      pitchIndex: Math.floor(Math.random() * PITCHES_HZ.length),
    }
  }
  return {
    id,
    x: MARGIN + Math.random() * (1 - MARGIN * 2),
    y: MARGIN + Math.random() * (1 - MARGIN * 2),
    pitchIndex: Math.floor(Math.random() * PITCHES_HZ.length),
  }
}

function createInitialNotes(count: number): GameNote[] {
  return Array.from({ length: count }, () => randomNote())
}

function playShortTone(ctx: AudioContext, frequencyHz: number) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequencyHz
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.24)
}

/** Agent A の playCollectedNote 未マージ時の暫定。差し替えポイント。 */
function playCollectedNote(ctx: AudioContext, pitchIndex: number) {
  const hz = PITCHES_HZ[pitchIndex] ?? PITCHES_HZ[0]
  playShortTone(ctx, hz)
}

type Props = {
  onBack: () => void
}

export function OtohiroiGame({ onBack }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const notesRef = useRef<GameNote[]>([])
  const scoreRef = useRef<ScoreState>(createScoreState())
  const stageSizeRef = useRef({ width: 1, height: 1 })
  const { gestureConfig } = useGestureSettings()
  const [finger, setFinger] = useState<{ x: number; y: number } | null>(null)
  const [notes, setNotes] = useState<GameNote[]>(() =>
    createInitialNotes(SIMULTANEOUS_NOTE_COUNT),
  )
  const [score, setScore] = useState<ScoreState>(() => createScoreState())
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 })
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)

  notesRef.current = notes
  scoreRef.current = score
  stageSizeRef.current = stageSize

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new AudioContext()
    }
    void audioRef.current.resume()
    return audioRef.current
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const measure = () => {
      const rect = stage.getBoundingClientRect()
      setStageSize({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = expireCombo(scoreRef.current, performance.now())
      if (next === scoreRef.current) return
      scoreRef.current = next
      setScore(next)
    }, 120)
    return () => window.clearInterval(timer)
  }, [])

  const handleStatusChange = useCallback(
    (snapshot: GestureRuntimeSnapshot) => {
      const nextFinger = indexFingerFromLandmarks(snapshot.landmarks)
      setFinger(nextFinger)
      if (!nextFinger) return

      const { width, height } = stageSizeRef.current
      const fx = nextFinger.x * width
      const fy = nextFinger.y * height
      const hits = notesRef.current.filter((note) => {
        const dist = Math.hypot(note.x * width - fx, note.y * height - fy)
        return dist <= HIT_RADIUS_PX
      })
      if (hits.length === 0) return

      const hitIds = new Set(hits.map((note) => note.id))
      const remaining = notesRef.current.filter((note) => !hitIds.has(note.id))
      const spawned = hits.map(() => randomNote(nextFinger))
      const nextNotes = [...remaining, ...spawned]
      notesRef.current = nextNotes
      setNotes(nextNotes)

      try {
        const ctx = ensureAudio()
        for (const hit of hits) {
          playCollectedNote(ctx, hit.pitchIndex)
        }
      } catch {
        // 無音環境でもゲームは継続する
      }

      const nextScore = updateScoreOnCollect(
        scoreRef.current,
        performance.now(),
        hits.length,
      )
      scoreRef.current = nextScore
      setScore(nextScore)
    },
    [ensureAudio],
  )

  useEffect(() => {
    return () => {
      void audioRef.current?.close()
      audioRef.current = null
    }
  }, [])

  return (
    <main className="otohiroi">
      <header className="otohiroi-header">
        <h1 className="otohiroi-title">おとひろい</h1>
        <div className="otohiroi-scorebar" aria-live="polite">
          <div className="otohiroi-score">
            <span className="otohiroi-score__label">ひろった</span>
            <span className="otohiroi-score__value">{score.total}</span>
          </div>
          <div className={`otohiroi-combo${score.combo >= 2 ? ' is-hot' : ''}`}>
            <span className="otohiroi-combo__label">コンボ</span>
            <span className="otohiroi-combo__value">{score.combo}</span>
          </div>
        </div>
        <button type="button" className="otohiroi-back" onClick={onBack}>
          もどる
        </button>
      </header>

      <div ref={stageRef} className="otohiroi-stage" aria-label="おとひろいプレイ画面">
        <AvatarLayer video={videoEl} finger={finger} />
        {notes.map((note, index) => (
          <span
            key={note.id}
            className="otohiroi-note"
            style={{
              left: `${note.x * 100}%`,
              top: `${note.y * 100}%`,
              width: NOTE_RADIUS_PX * 2,
              height: NOTE_RADIUS_PX * 2,
              marginLeft: -NOTE_RADIUS_PX,
              marginTop: -NOTE_RADIUS_PX,
              fontSize: NOTE_RADIUS_PX * 1.35,
              lineHeight: `${NOTE_RADIUS_PX * 2}px`,
              zIndex: 2 + index,
            }}
            aria-hidden
          >
            ♪
          </span>
        ))}
        {finger ? (
          <span
            className="otohiroi-finger"
            style={{
              left: `${finger.x * 100}%`,
              top: `${finger.y * 100}%`,
              width: FINGER_RADIUS_PX * 2,
              height: FINGER_RADIUS_PX * 2,
              marginLeft: -FINGER_RADIUS_PX,
              marginTop: -FINGER_RADIUS_PX,
            }}
            aria-hidden
          />
        ) : null}
      </div>

      {cameraError ? <p className="otohiroi-error">{cameraError}</p> : null}

      <GestureController
        enabled
        gesturesActive={false}
        gestureConfig={gestureConfig}
        presentationMode="PRESENTATION"
        onStatusChange={handleStatusChange}
        onRuntimeError={setCameraError}
        onVideoReady={setVideoEl}
      />
    </main>
  )
}
