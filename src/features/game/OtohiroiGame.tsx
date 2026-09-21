import { useCallback, useEffect, useRef, useState } from 'react'
import type { GestureRuntimeSnapshot } from '../gesture/cameraStatus'
import { AvatarSetupOverlay } from '../avatar/AvatarSetupOverlay'
import { captureStylizedPortrait, FullBodyAvatar } from '../avatar/FullBodyAvatar'
import { GestureController } from '../gesture/GestureController'
import { loadScoreChart, type ScoreChart, type SpawnedChartNote } from '../score-chart'
import { scheduleChartMusic } from '../rhythm/chartMusic'
import {
  beatFromAudioTime,
  isNoteExpired,
  judgeTiming,
  judgmentLabel,
  type HitJudgment,
} from '../rhythm/judgment'
import { createRhythmNoteSpawner, type RhythmNoteSpawner } from '../rhythm/rhythmSpawner'
import { touchPointsFromSnapshot } from './handCoords'
import {
  applyAutoMiss,
  applyHitJudgment,
  createScoreState,
  expireCombo,
  type ScoreState,
} from './gameScore'
import {
  COMBO_EXPIRE_POLL_MS,
  HIT_RADIUS_PX,
  NOTE_RADIUS_PX,
  RHYTHM_TICK_MS,
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
  const spawnerRef = useRef<RhythmNoteSpawner | null>(null)
  const songStartTimeRef = useRef(0)
  const stopMusicRef = useRef<(() => void) | null>(null)
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
  const [lastJudgment, setLastJudgment] = useState<HitJudgment | null>(null)

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
    const chart = chartRef.current
    if (!chart) return

    if (videoEl) {
      try {
        setPortraitUrl(captureStylizedPortrait(videoEl))
      } catch {
        // キャプチャ失敗時もプレイ開始
      }
    }

    const ctx = ensureAudio()
    const startAt = ctx.currentTime + 0.25
    songStartTimeRef.current = startAt
    stopMusicRef.current?.()
    stopMusicRef.current = null

    void scheduleChartMusic(ctx, chart, startAt).then((stop) => {
      stopMusicRef.current = stop
    })

    spawnerRef.current = createRhythmNoteSpawner(chart)
    scoreRef.current = createScoreState()
    setScore(createScoreState())
    notesRef.current = []
    setNotes([])
    setLastJudgment(null)
    setPlaying(true)
  }, [videoEl, ensureAudio])

  useEffect(() => {
    if (!playing) return

    const timer = window.setInterval(() => {
      const ctx = audioRef.current
      const spawner = spawnerRef.current
      const chart = chartRef.current
      if (!ctx || !spawner || !chart) return

      const currentBeat = beatFromAudioTime(
        ctx.currentTime,
        songStartTimeRef.current,
        chart.bpm,
      )

      const spawned = spawner.pollSpawnNotes(currentBeat)
      const expired: GameNote[] = []
      const alive = notesRef.current.filter((note) => {
        if (note.beat == null) return true
        if (!isNoteExpired(note.beat, currentBeat)) return true
        expired.push(note)
        return false
      })

      if (expired.length > 0) {
        const now = performance.now()
        for (let i = 0; i < expired.length; i += 1) {
          scoreRef.current = applyAutoMiss(scoreRef.current, now)
        }
        setScore({ ...scoreRef.current })
      }

      if (spawned.length === 0 && expired.length === 0) return

      const next = [...alive, ...spawned]
      notesRef.current = next
      setNotes(next)
    }, RHYTHM_TICK_MS)

    return () => window.clearInterval(timer)
  }, [playing])

  const handleStatusChange = useCallback(
    (snapshot: GestureRuntimeSnapshot) => {
      setHandsLandmarks(snapshot.handsLandmarks)
      if (!playing) return

      const ctx = audioRef.current
      const chart = chartRef.current
      if (!ctx || !chart) return

      const points = touchPointsFromSnapshot(snapshot)
      if (points.length === 0) return

      const currentBeat = beatFromAudioTime(
        ctx.currentTime,
        songStartTimeRef.current,
        chart.bpm,
      )

      const { width, height } = stageSizeRef.current
      const touched = notesRef.current.filter((note) =>
        points.some((point) => {
          const dist = Math.hypot(
            note.x * width - point.x * width,
            note.y * height - point.y * height,
          )
          return dist <= HIT_RADIUS_PX
        }),
      )
      if (touched.length === 0) return

      const now = performance.now()
      let best: { note: GameNote; judgment: HitJudgment } | null = null

      for (const note of touched) {
        if (note.beat == null) continue
        const judgment = judgeTiming(note.beat, currentBeat)
        if (judgment == null) continue
        if (!best) {
          best = { note, judgment }
          continue
        }
        if (judgment === 'perfect') {
          best = { note, judgment }
        }
      }

      if (!best) return

      const hitIds = new Set([best.note.id])
      const nextNotes = notesRef.current.filter((note) => !hitIds.has(note.id))
      notesRef.current = nextNotes
      setNotes(nextNotes)

      scoreRef.current = applyHitJudgment(scoreRef.current, best.judgment, now)
      setScore({ ...scoreRef.current })
      setLastJudgment(best.judgment)
    },
    [playing],
  )

  useEffect(() => {
    if (!lastJudgment) return
    const timer = window.setTimeout(() => setLastJudgment(null), 700)
    return () => window.clearTimeout(timer)
  }, [lastJudgment])

  useEffect(() => {
    return () => {
      stopMusicRef.current?.()
      stopMusicRef.current = null
      void audioRef.current?.close()
      audioRef.current = null
    }
  }, [])

  const handleBack = () => {
    stopMusicRef.current?.()
    stopMusicRef.current = null
    setPlaying(false)
    onBack()
  }

  return (
    <main className="otohiroi">
      <header className="otohiroi-header">
        <h1 className="otohiroi-title">おとひろい</h1>
        <p className="otohiroi-song-title">{songTitle}</p>
        <div className="otohiroi-scorebar" aria-live="polite">
          <div className="otohiroi-score">
            <span className="otohiroi-score__label">点数</span>
            <span className="otohiroi-score__value">{score.points}</span>
          </div>
          <div className={`otohiroi-combo${score.combo >= 2 ? ' is-hot' : ''}`}>
            <span className="otohiroi-combo__label">コンボ</span>
            <span className="otohiroi-combo__value">{score.combo}</span>
          </div>
        </div>
        <button type="button" className="otohiroi-back" onClick={handleBack}>
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
        {lastJudgment ? (
          <p
            className={`otohiroi-judgment otohiroi-judgment--${lastJudgment}`}
            aria-live="polite"
          >
            {judgmentLabel(lastJudgment)}
          </p>
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
