import { useCallback, useEffect, useRef, useState } from 'react'
import { playCollectedNote } from '../audio'
import { listNotes } from '../audio/noteCatalog'
import type { GestureRuntimeSnapshot } from '../gesture/cameraStatus'
import { GestureController } from '../gesture/GestureController'
import { useGestureSettings } from '../gesture/useGestureSettings'
import {
  createScoreState,
  expireCombo,
  updateScoreOnCollect,
  type ScoreState,
} from './gameScore'
import { FullBodyAvatar } from '../avatar/FullBodyAvatar'
import {
  touchPointsFromSnapshot,
  type NormalizedPoint,
} from './handCoords'

const NOTE_RADIUS_PX = 52
const FINGER_RADIUS_PX = 28
/** 指先と音符の当たり半径（px）。重なっていても各音符を独立判定する。 */
const HIT_RADIUS_PX = NOTE_RADIUS_PX + FINGER_RADIUS_PX
const MARGIN = 0.1
const SIMULTANEOUS_NOTE_COUNT = 3
/** 指の直下への再スポーンを避ける正規化距離。 */
const SPAWN_CLEARANCE = 0.14

const NOTE_POOL = listNotes()

type GameNote = {
  id: string
  x: number
  y: number
  noteId: string
}

let noteSeq = 0

function pickRandomNoteId(): string {
  const pick = NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)]
  return pick?.id ?? 'c4'
}

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
      noteId: pickRandomNoteId(),
    }
  }
  return {
    id,
    x: MARGIN + Math.random() * (1 - MARGIN * 2),
    y: MARGIN + Math.random() * (1 - MARGIN * 2),
    noteId: pickRandomNoteId(),
  }
}

function createInitialNotes(count: number): GameNote[] {
  return Array.from({ length: count }, () => randomNote())
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
  const [touchPoints, setTouchPoints] = useState<NormalizedPoint[]>([])
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [notes, setNotes] = useState<GameNote[]>(() =>
    createInitialNotes(SIMULTANEOUS_NOTE_COUNT),
  )
  const [score, setScore] = useState<ScoreState>(() => createScoreState())
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 })
  const [cameraError, setCameraError] = useState<string | null>(null)

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
      const points = touchPointsFromSnapshot(snapshot)
      setTouchPoints(points)
      if (points.length === 0) return

      const { width, height } = stageSizeRef.current
      const hits = notesRef.current.filter((note) =>
        points.some((point) => {
          const dist = Math.hypot(
            note.x * width - point.x * width,
            note.y * height - point.y * height,
          )
          return dist <= HIT_RADIUS_PX
        }),
      )
      if (hits.length === 0) return

      const hitIds = new Set(hits.map((note) => note.id))
      const remaining = notesRef.current.filter((note) => !hitIds.has(note.id))
      const avoid = points[0] ?? null
      const spawned = hits.map(() => randomNote(avoid))
      const nextNotes = [...remaining, ...spawned]
      notesRef.current = nextNotes
      setNotes(nextNotes)

      try {
        const ctx = ensureAudio()
        for (const hit of hits) {
          void playCollectedNote(ctx, hit.noteId)
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
        <FullBodyAvatar video={videoEl} />
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
        {touchPoints.map((point, index) => (
          <span
            key={`touch-${index}`}
            className="otohiroi-finger"
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              width: FINGER_RADIUS_PX * 2,
              height: FINGER_RADIUS_PX * 2,
              marginLeft: -FINGER_RADIUS_PX,
              marginTop: -FINGER_RADIUS_PX,
            }}
            aria-hidden
          />
        ))}
      </div>

      {cameraError ? <p className="otohiroi-error">{cameraError}</p> : null}

      <GestureController
        enabled
        gesturesActive={false}
        concealVideo
        gestureConfig={gestureConfig}
        presentationMode="PRESENTATION"
        onStatusChange={handleStatusChange}
        onRuntimeError={setCameraError}
        onVideoReady={setVideoEl}
      />
    </main>
  )
}
