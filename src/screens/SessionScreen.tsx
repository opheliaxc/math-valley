import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { GeneratedQuestion } from '../../question-generator/src/types.ts'
import { QuestionAnswerArea } from '../components/QuestionAnswerArea'
import {
  type ActiveSessionState,
  newSessionId,
  toActiveSessionPayload,
} from '../data/activeSession'
import {
  clearActiveSession,
  completeStudentSession,
  playerToProgressPayload,
  queueSaveActiveSession,
  queueSaveStudentProgress,
} from '../data/apiClient'
import { getZoneTopicIdsForGrade } from '../data/curriculum-map.ts'
import { syncPlayerZonesFromMastery } from '../data/masteryWorldMap.ts'
import type { PlayerState } from '../data/playerState'
import {
  applySessionAnswer,
  checkGeneratedAnswer,
  generateSessionQuestion,
  resolveQuestionTarget,
} from '../data/practiceSession.ts'
import { applySessionReward } from '../data/progression'
import { SESSION_LENGTH, type SessionSummary } from '../data/session'
import type { TopicId } from '../data/topics'
import { getZone } from '../data/zones'
import { renderMathDisplay } from '../utils/renderMath'
import { renderVisual } from '../visuals/renderVisual'

type SessionScreenProps = {
  studentId: string
  topic: TopicId
  player: PlayerState
  /** When set, resume this unfinished session instead of starting fresh. */
  restoredSession?: ActiveSessionState | null
  onPlayerChange: (state: PlayerState) => void
  onExit: () => void
}

type Phase = 'question' | 'feedback' | 'summary'

function nextTopicAfterAnswer(
  startedTopic: TopicId,
  contentLevelAdvanced: boolean,
  contentLevel: PlayerState['contentLevel'],
): TopicId {
  if (!contentLevelAdvanced) return startedTopic
  return getZoneTopicIdsForGrade(contentLevel)[0] ?? startedTopic
}

function buildInitialSession(
  topic: TopicId,
  player: PlayerState,
  restored: ActiveSessionState | null | undefined,
): {
  sessionId: string
  startedAt: string
  activeTopic: TopicId
  index: number
  question: GeneratedQuestion | null
  phase: Phase
  wasCorrect: boolean
  correctCount: number
  answers: ActiveSessionState['answers']
  sessionUnlockId: TopicId | null
  contentLevelAdvanced: boolean
  error: string | null
} {
  if (restored) {
    const last = restored.answers[restored.answers.length - 1]
    return {
      sessionId: restored.id,
      startedAt: restored.startedAt,
      activeTopic: restored.activeTopicId,
      index: restored.questionIndex,
      question: restored.currentQuestion,
      phase: restored.phase === 'summary' ? 'question' : restored.phase,
      wasCorrect: last?.correct ?? false,
      correctCount: restored.correctCount,
      answers: restored.answers,
      sessionUnlockId: restored.sessionUnlockId,
      contentLevelAdvanced: restored.contentLevelAdvanced,
      error: restored.currentQuestion
        ? null
        : 'Could not restore the current question. Progress was kept.',
    }
  }

  try {
    const question = generateSessionQuestion(player.studentProgress, topic)
    return {
      sessionId: newSessionId(),
      startedAt: new Date().toISOString(),
      activeTopic: topic,
      index: 0,
      question,
      phase: 'question',
      wasCorrect: false,
      correctCount: 0,
      answers: [],
      sessionUnlockId: null,
      contentLevelAdvanced: false,
      error: null,
    }
  } catch (err) {
    return {
      sessionId: newSessionId(),
      startedAt: new Date().toISOString(),
      activeTopic: topic,
      index: 0,
      question: null,
      phase: 'question',
      wasCorrect: false,
      correctCount: 0,
      answers: [],
      sessionUnlockId: null,
      contentLevelAdvanced: false,
      error:
        err instanceof Error
          ? err.message
          : 'Could not start a session for this zone.',
    }
  }
}

export function SessionScreen({
  studentId,
  topic,
  player,
  restoredSession = null,
  onPlayerChange,
  onExit,
}: SessionScreenProps) {
  const [boot] = useState(() =>
    buildInitialSession(topic, player, restoredSession),
  )
  const [playerRef, setPlayerRef] = useState(player)
  const [activeTopic, setActiveTopic] = useState(boot.activeTopic)
  const [index, setIndex] = useState(boot.index)
  const [question, setQuestion] = useState<GeneratedQuestion | null>(
    boot.question,
  )
  const [loadError, setLoadError] = useState<string | null>(boot.error)
  const [phase, setPhase] = useState<Phase>(boot.phase)
  const [wasCorrect, setWasCorrect] = useState(boot.wasCorrect)
  const [statusNote, setStatusNote] = useState<string | null>(
    restoredSession ? 'Welcome back — continuing where you left off.' : null,
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(boot.correctCount)
  const [answers, setAnswers] = useState(boot.answers)
  const [sessionUnlockId, setSessionUnlockId] = useState<TopicId | null>(
    boot.sessionUnlockId,
  )
  const [contentLevelAdvanced, setContentLevelAdvanced] = useState(
    boot.contentLevelAdvanced,
  )
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const sessionIdRef = useRef(boot.sessionId)
  const startedAtRef = useRef(boot.startedAt)
  const completedRef = useRef(false)
  const zone = getZone(activeTopic, playerRef.contentLevel)

  function persistSession(partial: {
    questionIndex: number
    correctCount: number
    phase: Phase
    activeTopicId: TopicId
    sessionUnlockId: TopicId | null
    contentLevelAdvanced: boolean
    answers: ActiveSessionState['answers']
    currentQuestion: GeneratedQuestion | null
  }) {
    if (completedRef.current || partial.phase === 'summary') return

    const payload = toActiveSessionPayload({
      id: sessionIdRef.current,
      status: 'in_progress',
      topicId: topic,
      startedAt: startedAtRef.current,
      updatedAt: new Date().toISOString(),
      questionIndex: partial.questionIndex,
      correctCount: partial.correctCount,
      phase: partial.phase,
      activeTopicId: partial.activeTopicId,
      sessionUnlockId: partial.sessionUnlockId,
      contentLevelAdvanced: partial.contentLevelAdvanced,
      answers: partial.answers,
      currentQuestion: partial.currentQuestion,
    })

    void queueSaveActiveSession(studentId, payload).then(
      () => setSaveError(null),
      (err: unknown) => {
        setSaveError(
          err instanceof Error
            ? err.message
            : 'Could not save this quiz. Check that the server is running.',
        )
      },
    )
  }

  // Save as soon as a new session has its first question (or when restoring).
  useEffect(() => {
    if (!question || loadError || phase === 'summary') return
    persistSession({
      questionIndex: index,
      correctCount,
      phase,
      activeTopicId: activeTopic,
      sessionUnlockId,
      contentLevelAdvanced,
      answers,
      currentQuestion: question,
    })
    // Intentionally once on mount for initial snapshot; later saves are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function persistProgress(nextPlayer: PlayerState): PlayerState {
    const synced = syncPlayerZonesFromMastery(
      nextPlayer,
      nextPlayer.studentProgress,
    )
    void queueSaveStudentProgress(studentId, synced.player).then(
      () => setSaveError(null),
      (err: unknown) => {
        setSaveError(
          err instanceof Error
            ? err.message
            : 'Could not save progress. Check that the server is running.',
        )
      },
    )
    return synced.player
  }

  function handleAnswer(submitted: string) {
    if (phase !== 'question' || !question) return

    const correct = checkGeneratedAnswer(question, submitted)
    const result = applySessionAnswer(
      playerRef.studentProgress,
      activeTopic,
      question,
      correct,
    )

    const nextState = persistProgress({
      ...playerRef,
      studentProgress: result.progress,
      contentLevel: result.contentLevel,
    })
    setPlayerRef(nextState)
    onPlayerChange(nextState)

    const followTopic = nextTopicAfterAnswer(
      activeTopic,
      result.contentLevelAdvanced,
      result.contentLevel,
    )
    setActiveTopic(followTopic)

    if (result.contentLevelAdvanced) {
      setContentLevelAdvanced(true)
      setStatusNote(
        `New content level! School grade stays ${nextState.profile.grade}.`,
      )
    } else if (result.newlyUnlockedTopicId) {
      setSessionUnlockId(result.newlyUnlockedTopicId)
      setStatusNote(
        `New zone unlocked: ${getZone(result.newlyUnlockedTopicId, nextState.contentLevel).name}!`,
      )
    } else if (result.newlyMasteredTopicId) {
      setStatusNote(
        `${getZone(result.newlyMasteredTopicId, nextState.contentLevel).name} mastered!`,
      )
    } else {
      setStatusNote(
        masteryAdvanceNote(
          question.standard,
          question.difficulty,
          result.progress,
          followTopic,
        ),
      )
    }

    const nextCorrect = correctCount + (correct ? 1 : 0)
    const nextAnswers = [
      ...answers,
      {
        submitted,
        correct,
        answeredAt: new Date().toISOString(),
      },
    ]
    const nextUnlock = result.newlyUnlockedTopicId ?? sessionUnlockId
    const nextLevelAdvanced =
      contentLevelAdvanced || result.contentLevelAdvanced

    setCorrectCount(nextCorrect)
    setAnswers(nextAnswers)
    setWasCorrect(correct)
    setPhase('feedback')

    persistSession({
      questionIndex: index,
      correctCount: nextCorrect,
      phase: 'feedback',
      activeTopicId: followTopic,
      sessionUnlockId: nextUnlock,
      contentLevelAdvanced: nextLevelAdvanced,
      answers: nextAnswers,
      currentQuestion: question,
    })
  }

  async function finishSession(finalCorrect: number) {
    const reward = applySessionReward(
      playerRef,
      topic,
      finalCorrect,
      sessionUnlockId,
    )
    try {
      await queueSaveStudentProgress(studentId, reward.player)
      await completeStudentSession(studentId, {
        total: SESSION_LENGTH,
        correctCount: finalCorrect,
        xpEarned: reward.xpEarned,
        topicId: topic,
        sessionId: sessionIdRef.current,
        startedAt: startedAtRef.current,
        player: playerToProgressPayload(reward.player),
      })
      completedRef.current = true
      setSaveError(null)
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Could not save session score. Check that the server is running.',
      )
    }
    setPlayerRef(reward.player)
    onPlayerChange(reward.player)

    const level = reward.player.contentLevel
    setSummary({
      topicLabel: getZone(topic, level).name,
      zoneName: getZone(topic, level).name,
      total: SESSION_LENGTH,
      correctCount: finalCorrect,
      xpEarned: reward.xpEarned,
      totalXp: reward.totalXp,
      lunaraEvolved: reward.lunaraEvolved,
      lunaraLabel: reward.lunaraLabel,
      unlockedZoneName: reward.newlyUnlockedZone
        ? getZone(reward.newlyUnlockedZone, level).name
        : sessionUnlockId
          ? getZone(sessionUnlockId, level).name
          : null,
      contentLevelAdvanced,
      contentLevel: contentLevelAdvanced
        ? reward.player.contentLevel
        : null,
    })
    setPhase('summary')
  }

  function handleContinue() {
    if (index + 1 >= SESSION_LENGTH) {
      void finishSession(correctCount)
      return
    }

    try {
      const next = generateSessionQuestion(
        playerRef.studentProgress,
        activeTopic,
      )
      const nextIndex = index + 1
      setLoadError(null)
      setQuestion(next)
      setIndex(nextIndex)
      setStatusNote(null)
      setPhase('question')
      persistSession({
        questionIndex: nextIndex,
        correctCount,
        phase: 'question',
        activeTopicId: activeTopic,
        sessionUnlockId,
        contentLevelAdvanced,
        answers,
        currentQuestion: next,
      })
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err))
    }
  }

  async function abandonBrokenSession() {
    try {
      await clearActiveSession(studentId)
    } catch {
      // Still leave the screen; progress data remains.
    }
    onExit()
  }

  if (loadError && phase !== 'summary') {
    return (
      <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-md text-center space-y-4">
          <p className="text-rose-300">{loadError}</p>
          <button
            type="button"
            onClick={() => void abandonBrokenSession()}
            className="w-full min-h-14 rounded-2xl bg-amber-400 text-slate-900 text-lg font-bold hover:bg-amber-300"
          >
            Back to map
          </button>
        </div>
      </main>
    )
  }

  if (phase === 'summary' && summary) {
    return (
      <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
        <motion.div
          className="w-full max-w-md text-center space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-amber-300 text-sm tracking-widest uppercase">
            Session complete
          </p>
          <h1 className="text-3xl font-bold">{summary.zoneName}</h1>
          <p className="text-xl text-slate-200">
            You got{' '}
            <span className="text-amber-300 font-semibold">
              {summary.correctCount}/{summary.total}
            </span>{' '}
            correct
          </p>
          <p className="text-lg text-violet-300">+{summary.xpEarned} XP</p>

          <AnimatePresence>
            {summary.lunaraEvolved && (
              <motion.p
                className="rounded-2xl border border-violet-400/40 bg-violet-950/60 px-4 py-3 text-violet-200"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                Lunara evolved into {summary.lunaraLabel}!
              </motion.p>
            )}
            {summary.unlockedZoneName && (
              <motion.p
                className="rounded-2xl border border-amber-400/40 bg-amber-950/40 px-4 py-3 text-amber-200"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                New zone unlocked: {summary.unlockedZoneName}!
              </motion.p>
            )}
            {summary.contentLevelAdvanced && summary.contentLevel && (
              <motion.p
                className="rounded-2xl border border-sky-400/40 bg-sky-950/40 px-4 py-3 text-sky-200"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                Content level {summary.contentLevel} unlocked. School grade
                stays {playerRef.profile.grade}.
              </motion.p>
            )}
          </AnimatePresence>

          <div className="text-sm text-slate-400 space-y-1">
            <p>Total XP: {summary.totalXp}</p>
          </div>

          {saveError ? (
            <p className="text-sm text-rose-300" role="alert">
              {saveError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onExit}
            className="w-full min-h-14 rounded-2xl bg-amber-400 text-slate-900 text-lg font-bold hover:bg-amber-300"
          >
            Back to map
          </button>
        </motion.div>
      </main>
    )
  }

  if (!question) {
    return (
      <main className="min-h-screen bg-slate-900 text-white px-4 py-8 flex items-center justify-center">
        <p className="text-slate-400">Loading question…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white px-4 py-6 flex items-start justify-center">
      <div className="w-full max-w-lg space-y-6 pt-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-amber-300">{zone.name}</p>
            <p className="text-slate-400 text-sm">
              Question {index + 1} of {SESSION_LENGTH}
            </p>
            <p className="text-slate-500 text-xs">
              {question.standard} · {question.difficulty}
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="min-h-11 px-3 rounded-xl text-sm text-slate-400 border border-slate-700 hover:border-slate-500"
          >
            Exit
          </button>
        </header>

        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all"
            style={{
              width: `${((index + (phase === 'feedback' ? 1 : 0)) / SESSION_LENGTH) * 100}%`,
            }}
          />
        </div>

        {saveError ? (
          <p className="text-sm text-rose-300" role="alert">
            {saveError}
          </p>
        ) : null}

        {statusNote && phase === 'question' ? (
          <p className="text-sm text-sky-300">{statusNote}</p>
        ) : null}

        <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 space-y-5">
          <h1 className="text-xl font-semibold leading-relaxed text-slate-100">
            {renderMathDisplay(question.prompt)}
          </h1>

          {question.visual
            ? renderVisual(question.visual, { altText: question.altText })
            : null}

          {phase === 'question' && (
            <QuestionAnswerArea
              key={question.id}
              question={question}
              onSubmit={handleAnswer}
            />
          )}

          {phase === 'feedback' && (
            <div className="space-y-4">
              <p
                className={`text-lg font-semibold ${
                  wasCorrect ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {wasCorrect ? 'Correct!' : 'Not quite'}
              </p>
              {!wasCorrect && (
                <p className="text-slate-300">
                  The answer was{' '}
                  <span className="text-amber-300 font-semibold">
                    {renderMathDisplay(question.correctAnswer)}
                  </span>
                </p>
              )}
              {statusNote && (
                <p className="text-sky-300 text-sm">{statusNote}</p>
              )}
              <button
                type="button"
                onClick={handleContinue}
                className="w-full min-h-14 rounded-2xl bg-amber-400 text-slate-900 text-lg font-bold hover:bg-amber-300"
              >
                {index + 1 >= SESSION_LENGTH ? 'See results' : 'Next question'}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

/** Note only when this answer moves beginner→advanced or to a new standard. */
function masteryAdvanceNote(
  answeredStandard: string,
  answeredDifficulty: string,
  progress: PlayerState['studentProgress'],
  topicId: TopicId,
): string | null {
  try {
    const next = resolveQuestionTarget(progress, topicId)
    if (next.standard !== answeredStandard) {
      return `Skill cleared! Next up: ${next.standard}`
    }
    if (
      answeredDifficulty === 'beginner' &&
      next.difficulty === 'advanced'
    ) {
      return 'Beginner cleared — advanced next!'
    }
  } catch {
    // Topic may be mastered with nothing left to serve.
  }
  return null
}
