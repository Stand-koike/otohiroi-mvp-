import { useCallback, useEffect, useRef, useState } from 'react'
import { playCollectedNote } from '../audio'
import type { GestureRuntimeSnapshot } from '../gesture/cameraStatus'
import { AvatarSetupOverlay } from '../avatar/AvatarSetupOverlay'
import { captureStylizedPortrait, FullBodyAvatar } from '../avatar/FullBodyAvatar'
import { GestureController } from '../gesture/GestureController'
import {
  createChartNoteSpawner,
  createRandomNoteSpawner,
  loadScoreChart,
  type ChartNoteSpawner,
  type ScoreChart,
  type SpawnedChartNote,
} from '../score-chart'
import {
  touchPointsFromSnapshot,
} from './handCoords'
import {
  createScoreState,
  expireCombo,
  updateScoreOnCollect,
  type ScoreState,
} from './gameScore'
import {
  COMBO_EXPIRE_POLL_MS,
  HIT_RADIUS_PX,
  NOTE_RADIUS_PX,
  SIMULTANEOUS_NOTE_COUNT,
} from './gameTuning'

type GameNote = SpawnedChartNote

type Props = {
  chartUrl: string
  songTitle: string
  onBack: () => void
}

export function OtohiroiGame({ chartUrl, songTitle, onBack }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const notesRef = useRef<GameNote[]>([])
  const scoreRef = useRef<ScoreState>(createScoreState())
  const stageSizeRef = useRef({ width: 1, height: 1 })
  const chartRef = useRef<ScoreChart | null>(null)
  const spawnerRef = useRef<ChartNoteSpawner>(createRandomNoteSpawner())
  const playStartMsRef = useRef<number>(0)
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [handsLandmarks, setHandsLandmarks] = useState<
    { x: number; y: number }[][] | null
  >(null)
  const [poseStable, setPoseStable] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState<GameNote[]>([])
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
    if (!chartUrl) {
      chartRef.current = null
      return
    }
    let cancelled = false
    void loadScoreChart(chartUrl)
      .then((chart) => {
        if (!cancelled) chartRef.current = chart
      })
      .catch(() => {
        if (!cancelled) chartRef.current = null
      })
    return () => {
      cancelled = true
    }
  }, [chartUrl])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = expireCombo(scoreRef.current, performance.now())
      if (next === scoreRef.current) return
      scoreRef.current = next
      setScore(next)
    }, COMBO_EXPIRE_POLL_MS)
    return () => window.clearInterval(timer)
  }, [])

  const handlePoseStableChange = useCallback((stable: boolean) => {
    setPoseStable(stable)
  }, [])

  const handleStartPlay = useCallback(() => {
    if (videoEl) {
      try {
        setPortraitUrl(captureStylizedPortrait(videoEl))
      } catch {
        // キャプチャ失敗時もプレイ開始
      }
    }
    spawnerRef.current = chartRef.current
      ? createChartNoteSpawner(chartRef.current)
      : createRandomNoteSpawner()
    playStartMsRef.current = performance.now()
    const initial = spawnerRef.current.initialNotes(SIMULTANEOUS_NOTE_COUNT)
    notesRef.current = initial
    setNotes(initial)
    setPlaying(true)
    void ensureAudio()
  }, [videoEl, ensureAudio])

  useEffect(() => {
    if (!playing) return
    const playStartMs = playStartMsRef.current
    const timer = window.setInterval(() => {
      const due = spawnerRef.current.pollBeatSpawns(performance.now(), playStartMs)
      if (due.length === 0) return
      setNotes((prev) => {
        const next = [...prev, ...due]
        notesRef.current = next
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [playing])

  const handleStatusChange = useCallback(
    (snapshot: GestureRuntimeSnapshot) => {
      setHandsLandmarks(snapshot.handsLandmarks)
      if (!playing) return

      const points = touchPointsFromSnapshot(snapshot)
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
      const spawned = hits.map(() => spawnerRef.current.replacementNote(avoid))
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
    [ensureAudio, playing],
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
        <p className="otohiroi-song-title">{songTitle}</p>
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
        <FullBodyAvatar
          video={videoEl}
          handsLandmarks={handsLandmarks}
          portraitUrl={portraitUrl}
          showHands={playing}
          onPoseStableChange={handlePoseStableChange}
        />
        {!playing ? (
          <AvatarSetupOverlay poseStable={poseStable} onStartPlay={handleStartPlay} />
        ) : null}
        {playing
          ? notes.map((note, index) => (
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
              zIndex: 4 + index,
            }}
            aria-hidden
          >
            ♪
          </span>
        ))
          : null}
      </div>

      {cameraError ? <p className="otohiroi-error">{cameraError}</p> : null}

      <GestureController
        enabled
        concealVideo
        onStatusChange={handleStatusChange}
        onRuntimeError={setCameraError}
        onVideoReady={setVideoEl}
      />
    </main>
  )
}
