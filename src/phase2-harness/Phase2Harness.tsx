import { useMemo, useState, type CSSProperties } from 'react'
import type { GeneratedQuestion } from '../../question-generator/src/types.ts'
import { applySessionAnswer, createInitialStudentProgress, generateSessionQuestion, resolveQuestionTarget, SESSION_LENGTH } from '../data/practiceSession.ts'
import { TOPIC_UNLOCK_ORDER, getZoneTopicIdsForGrade } from '../data/curriculum-map.ts'
import { syncPlayerZonesFromMastery } from '../data/masteryWorldMap.ts'
import { createPlayerState, type PlayerState } from '../data/playerState.ts'
import type { Grade } from '../data/profile.ts'
import { recordAttempt, type StudentProgress } from '../data/studentProgress.ts'
import { applyTopicUnlocksIfNeeded } from '../data/topicUnlock.ts'
import { TOPIC_LABELS, TOPICS, type TopicId } from '../data/topics.ts'
import { getZone, createInitialUnlockedZones, type ZoneId } from '../data/zones.ts'
import { optionKey, optionLabel } from '../../question-generator/src/types.ts'
import { renderMathDisplay } from '../utils/renderMath'
import { renderVisual } from '../visuals/renderVisual'

const GRADES: Grade[] = [1, 2, 3, 4]

function masterAllZonesAtLevel(progress: StudentProgress): StudentProgress {
  let p = unlockAllTopics(progress)
  for (const zoneId of getZoneTopicIdsForGrade(p.contentLevel)) {
    const order = p.topics[zoneId]?.standardOrder ?? []
    for (const code of order) {
      for (const difficulty of ['beginner', 'advanced'] as const) {
        for (let i = 0; i < 8; i++) {
          p = recordAttempt(p, code, difficulty, true, `${code}-${difficulty}-${i}`, 'ok')
        }
      }
      p = applyTopicUnlocksIfNeeded(p, zoneId).progress
    }
  }
  return p
}

function unlockAllTopics(progress: StudentProgress): StudentProgress {
  const topics = { ...progress.topics }
  for (const topicId of TOPICS) {
    const topic = topics[topicId]
    if (topic && topic.status === 'locked') {
      topics[topicId] = { ...topic, status: 'unlocked' }
    }
  }
  return { ...progress, topics }
}

function summarizeProgress(
  progress: StudentProgress,
  topicId: TopicId,
  unlockedZoneIds: ZoneId[],
) {
  const topic = progress.topics[topicId]
  const target = (() => {
    try {
      return resolveQuestionTarget(progress, topicId)
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  })()

  const standards: Record<string, unknown> = {}
  for (const code of topic?.standardOrder ?? []) {
    const s = progress.standards[code]
    standards[code] = s
      ? {
          status: s.status,
          beginner: {
            mastered: s.beginner.mastered,
            correctInWindow: s.beginner.attempts.filter((a) => a.correct).length,
            attempts: s.beginner.attempts.length,
          },
          advanced: {
            mastered: s.advanced.mastered,
            correctInWindow: s.advanced.attempts.filter((a) => a.correct).length,
            attempts: s.advanced.attempts.length,
          },
        }
      : '(no attempts yet)'
  }

  return {
    profileId: progress.profileId,
    contentLevel: progress.contentLevel,
    topicStatuses: Object.fromEntries(
      TOPIC_UNLOCK_ORDER.map((id) => [
        id,
        {
          status: progress.topics[id]?.status ?? 'missing',
          standards: progress.topics[id]?.standardOrder.length ?? 0,
        },
      ]),
    ),
    worldMapUnlockedZones: unlockedZoneIds,
    topic: topic
      ? {
          status: topic.status,
          contentLevel: topic.contentLevel,
          activeStandardIndex: topic.activeStandardIndex,
          activeStandard: topic.standardOrder[topic.activeStandardIndex] ?? null,
          standardOrder: topic.standardOrder,
        }
      : null,
    nextTarget: target,
    standards,
    missedQuestions: progress.missedQuestions.length,
  }
}

export function Phase2Harness() {
  const [profileId, setProfileId] = useState('fake-kid-1')
  /** School grade (profile) — fixed for this harness profile. */
  const [schoolGrade, setSchoolGrade] = useState<Grade>(1)
  /** Curriculum band under test — drives standards/zones. */
  const [contentLevel, setContentLevel] = useState<Grade>(1)
  const [topicId, setTopicId] = useState<TopicId>('operations-algebraic-thinking')
  const [unlockAll, setUnlockAll] = useState(false)
  const [progress, setProgress] = useState<StudentProgress | null>(null)
  const [playerMirror, setPlayerMirror] = useState<PlayerState | null>(null)
  const [mapUnlockedZones, setMapUnlockedZones] = useState<ZoneId[]>([])
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [sessionActive, setSessionActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [unlockBanner, setUnlockBanner] = useState<string | null>(null)

  const debug = useMemo(() => {
    if (!progress) return null
    return {
      ...summarizeProgress(progress, topicId, mapUnlockedZones),
      schoolGrade,
      playerContentLevel: playerMirror?.contentLevel,
    }
  }, [progress, topicId, mapUnlockedZones, schoolGrade, playerMirror])

  function buildProgress(): StudentProgress {
    let next = createInitialStudentProgress(
      profileId.trim() || 'anonymous',
      contentLevel,
    )
    if (unlockAll) next = unlockAllTopics(next)
    return next
  }

  function buildPlayer(nextProgress: StudentProgress): PlayerState {
    const player = createPlayerState({
      name: profileId.trim() || 'Harness Kid',
      grade: schoolGrade,
      avatarId: 'ember',
    })
    return {
      ...player,
      contentLevel: nextProgress.contentLevel,
      studentProgress: nextProgress,
      unlockedZones: createInitialUnlockedZones(nextProgress.contentLevel),
    }
  }

  function syncMap(
    nextProgress: StudentProgress,
    basePlayer?: PlayerState | null,
  ): ZoneId | null {
    const base = basePlayer ?? playerMirror ?? buildPlayer(nextProgress)
    const { player, newlyUnlockedZone } = syncPlayerZonesFromMastery(
      { ...base, studentProgress: nextProgress },
      nextProgress,
    )
    setPlayerMirror(player)
    setMapUnlockedZones(player.unlockedZones)
    return newlyUnlockedZone
  }

  function handleMasterAllZones() {
    setError(null)
    setLastResult(null)
    try {
      const base = progress ?? buildProgress()
      const mastered = masterAllZonesAtLevel(base)
      const lastZone =
        getZoneTopicIdsForGrade(mastered.contentLevel).at(-1) ?? topicId
      const dummy: GeneratedQuestion = {
        id: 'harness-master-all',
        standard: mastered.topics[lastZone]?.standardOrder[0] ?? 'NY-1.OA.1',
        grade: mastered.contentLevel,
        topic: lastZone,
        difficulty: 'advanced',
        type: 'short-answer',
        prompt: 'Harness: finish this content level',
        correctAnswer: '1',
        explanation: 'n/a',
      }
      const result = applySessionAnswer(mastered, lastZone, dummy, true)
      setProgress(result.progress)
      syncMap(result.progress, playerMirror ?? buildPlayer(result.progress))
      if (result.contentLevelAdvanced) {
        setContentLevel(result.contentLevel)
        const firstZone = getZoneTopicIdsForGrade(result.contentLevel)[0]
        if (firstZone) setTopicId(firstZone)
        setUnlockBanner(
          `Content level ${result.previousContentLevel} → ${result.contentLevel}. ` +
            `School grade stays ${schoolGrade}. Zones re-locked; start with the first zone.`,
        )
      }
      setLastResult('Mastered all zones at the current content level (harness).')
      setSessionActive(false)
      setQuestion(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function handleResetProfile() {
    setError(null)
    setLastResult(null)
    setUnlockBanner(null)
    setQuestion(null)
    setAnsweredCount(0)
    setSessionActive(false)
    const next = buildProgress()
    setProgress(next)
    const player = buildPlayer(next)
    setPlayerMirror(player)
    syncMap(next, player)
  }

  function handleStartSession() {
    setError(null)
    setLastResult(null)
    setUnlockBanner(null)
    try {
      const base = progress ?? buildProgress()
      const q = generateSessionQuestion(base, topicId)
      setProgress(base)
      if (!playerMirror) {
        const player = buildPlayer(base)
        setPlayerMirror(player)
        syncMap(base, player)
      } else {
        syncMap(base, playerMirror)
      }
      setQuestion(q)
      setAnsweredCount(0)
      setSessionActive(true)
    } catch (err) {
      setQuestion(null)
      setSessionActive(false)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  function handleAnswer(correct: boolean) {
    if (!progress || !question) return
    setError(null)
    try {
      const result = applySessionAnswer(progress, topicId, question, correct)
      const nextProgress = result.progress
      const nextCount = answeredCount + 1
      setProgress(nextProgress)
      setAnsweredCount(nextCount)

      const newlyUnlockedZone = syncMap(nextProgress, playerMirror)
      if (result.contentLevelAdvanced) {
        setContentLevel(result.contentLevel)
        const firstZone = getZoneTopicIdsForGrade(result.contentLevel)[0]
        if (firstZone) setTopicId(firstZone)
        setUnlockBanner(
          `Content level ${result.previousContentLevel} → ${result.contentLevel}. ` +
            `School grade stays ${schoolGrade}. Zones re-locked; start with the first zone.`,
        )
      } else if (result.newlyUnlockedTopicId) {
        setUnlockBanner(
          `New zone unlocked: ${getZone(result.newlyUnlockedTopicId, result.contentLevel).name}!`,
        )
      } else if (newlyUnlockedZone) {
        setUnlockBanner(
          `New zone unlocked: ${getZone(newlyUnlockedZone, nextProgress.contentLevel).name}!`,
        )
      }

      setLastResult(
        correct
          ? `Marked correct (${question.standard} / ${question.difficulty})`
          : `Marked incorrect (${question.standard} / ${question.difficulty})`,
      )

      if (nextCount >= SESSION_LENGTH) {
        setSessionActive(false)
        setQuestion(null)
        return
      }

      const questionTopic = result.contentLevelAdvanced
        ? (getZoneTopicIdsForGrade(result.contentLevel)[0] ?? topicId)
        : topicId
      const nextQuestion = generateSessionQuestion(nextProgress, questionTopic)
      setQuestion(nextQuestion)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSessionActive(false)
    }
  }

  return (
    <div
      style={{
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        maxWidth: 1100,
        margin: '0 auto',
        padding: 24,
        display: 'grid',
        gap: 20,
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      <div style={{ gridColumn: '1 / -1' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Phase 2–4 — Session harness</h1>
        <p style={{ margin: '8px 0 0', color: '#555' }}>
          Fake profile + practice session. Mark answers correct/incorrect and watch
          progress, zone unlocks, and content-level bumps. School grade stays fixed.
        </p>
      </div>

      {unlockBanner && (
        <div
          style={{
            gridColumn: '1 / -1',
            borderRadius: 12,
            border: '1px solid #f59e0b66',
            background: '#78350f66',
            color: '#fde68a',
            padding: '12px 16px',
            fontWeight: 600,
          }}
        >
          {unlockBanner}
        </div>
      )}
      <section style={panelStyle}>
        <h2 style={headingStyle}>Setup</h2>
        <label style={labelStyle}>
          Profile id
          <input
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            style={inputStyle}
            disabled={sessionActive}
          />
        </label>
        <label style={labelStyle}>
          School grade (profile, fixed)
          <select
            value={schoolGrade}
            onChange={(e) => setSchoolGrade(Number(e.target.value) as Grade)}
            style={inputStyle}
            disabled={sessionActive}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Content level (curriculum band)
          <select
            value={contentLevel}
            onChange={(e) => setContentLevel(Number(e.target.value) as Grade)}
            style={inputStyle}
            disabled={sessionActive}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Topic
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value as TopicId)}
            style={inputStyle}
            disabled={sessionActive}
          >
            {TOPICS.map((id) => (
              <option key={id} value={id}>
                {TOPIC_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={unlockAll}
            onChange={(e) => setUnlockAll(e.target.checked)}
            disabled={sessionActive}
          />
          Unlock all topics (harness only)
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={handleResetProfile} style={buttonStyle}>
            Create / reset progress
          </button>
          <button
            type="button"
            onClick={handleMasterAllZones}
            style={buttonStyle}
            disabled={sessionActive}
          >
            Master all zones at this level
          </button>
          <button
            type="button"
            onClick={handleStartSession}
            style={buttonStyle}
            disabled={sessionActive}
          >
            Start session ({SESSION_LENGTH} questions)
          </button>
        </div>
        {error && (
          <p style={{ color: '#b91c1c', margin: 0, whiteSpace: 'pre-wrap' }}>{error}</p>
        )}
        {lastResult && <p style={{ color: '#166534', margin: 0 }}>{lastResult}</p>}
        {!sessionActive && answeredCount > 0 && answeredCount >= SESSION_LENGTH && (
          <p style={{ margin: 0 }}>Session complete ({SESSION_LENGTH} answers logged).</p>
        )}
      </section>

      <section style={panelStyle}>
        <h2 style={headingStyle}>
          Question {sessionActive ? `${answeredCount + 1} / ${SESSION_LENGTH}` : '—'}
        </h2>
        {!question && (
          <p style={{ color: '#666', margin: 0 }}>
            Create progress, then start a session to see a generated question.
          </p>
        )}
        {question && (
          <>
            <p style={{ margin: 0, fontSize: 14, color: '#444' }}>
              <strong>{question.standard}</strong> · {question.difficulty} · {question.type}
            </p>
            <p style={{ margin: '12px 0', fontSize: 18, lineHeight: 1.4 }}>
              {renderMathDisplay(question.prompt)}
            </p>
            {question.visual
              ? renderVisual(question.visual, { altText: question.altText })
              : null}
            {question.options && (
              <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
                {question.options.map((opt, idx) => (
                  <li key={optionKey(opt, idx)}>
                    {renderMathDisplay(optionLabel(opt))}
                  </li>
                ))}
              </ul>
            )}
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>
              Answer key (for you): {renderMathDisplay(question.correctAnswer)}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                style={{ ...buttonStyle, background: '#166534', color: '#fff' }}
                disabled={!sessionActive}
              >
                Mark correct
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                style={{ ...buttonStyle, background: '#991b1b', color: '#fff' }}
                disabled={!sessionActive}
              >
                Mark incorrect
              </button>
            </div>
          </>
        )}
      </section>

      <section style={{ ...panelStyle, gridColumn: '1 / -1' }}>
        <h2 style={headingStyle}>Debug — student progress</h2>
        {!debug && (
          <p style={{ color: '#666', margin: 0 }}>No progress object yet.</p>
        )}
        {debug && (
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#0f172a',
              color: '#e2e8f0',
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.45,
            }}
          >
            {JSON.stringify(debug, null, 2)}
          </pre>
        )}
      </section>
    </div>
  )
}

const panelStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  background: '#fff',
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 13,
}

const inputStyle: CSSProperties = {
  minHeight: 36,
  padding: '4px 8px',
  fontSize: 14,
}

const buttonStyle: CSSProperties = {
  minHeight: 40,
  padding: '8px 12px',
  fontSize: 14,
  cursor: 'pointer',
  borderRadius: 8,
  border: '1px solid #94a3b8',
  background: '#f8fafc',
}
