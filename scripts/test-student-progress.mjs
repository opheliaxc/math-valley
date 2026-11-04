/**
 * Phase 1 test — mastery threshold & helpers (no UI).
 *
 * Run from repo root:
 *   node scripts/test-student-progress.mjs
 *
 * Exit 0 = all assertions passed; non-zero = failure details printed.
 */
import {
  MASTERY_THRESHOLD,
  MASTERY_WINDOW,
  advanceActiveStandardIfNeeded,
  isStandardMastered,
  isTopicMastered,
  recordAttempt,
} from '../src/data/studentProgress.ts'

let passed = 0
let failed = 0

function assert(label, condition) {
  if (condition) {
    passed += 1
    console.log(`  ✓ ${label}`)
  } else {
    failed += 1
    console.error(`  ✗ ${label}`)
  }
}

function emptyProgress(topics = {}) {
  return {
    profileId: 'phase1-test',
    contentLevel: 3,
    topics,
    standards: {},
    missedQuestions: [],
  }
}

function masterDifficulty(progress, standardCode, difficulty) {
  let p = progress
  for (let i = 0; i < MASTERY_THRESHOLD; i++) {
    p = recordAttempt(p, standardCode, difficulty, true, `${standardCode}-${difficulty}-${i}`, 'ok')
  }
  return p
}

function masterStandard(progress, standardCode) {
  let p = progress
  p = masterDifficulty(p, standardCode, 'beginner')
  p = masterDifficulty(p, standardCode, 'advanced')
  return p
}

// ── 1. Mastery flips at 8 correct, stays false below ─────────────────────
console.log('\n1. Mastery threshold (8/10 window)')
{
  let p = emptyProgress()
  const code = 'NY-3.NBT.2'

  for (let i = 0; i < MASTERY_THRESHOLD - 1; i++) {
    p = recordAttempt(p, code, 'beginner', true, `pre-${i}`, 'ok')
  }
  assert(
    `after ${MASTERY_THRESHOLD - 1} correct → beginner.mastered === false`,
    p.standards[code].beginner.mastered === false,
  )

  p = recordAttempt(p, code, 'beginner', true, 'pre-flip', 'ok')
  assert(
    `after ${MASTERY_THRESHOLD} correct → beginner.mastered === true`,
    p.standards[code].beginner.mastered === true,
  )
}

// ── 2. Window of 10: early misses drop off; late misses can un-master ─────
console.log('\n2. Rolling window keeps only last 10')
{
  let p = emptyProgress()
  const code = 'NY-3.NBT.2'

  // 2 wrong + 8 correct = 8/10 → mastered
  p = recordAttempt(p, code, 'beginner', false, 'w0', 'miss')
  p = recordAttempt(p, code, 'beginner', false, 'w1', 'miss')
  for (let i = 0; i < 8; i++) {
    p = recordAttempt(p, code, 'beginner', true, `c${i}`, 'ok')
  }
  assert('2 wrong + 8 correct → mastered', p.standards[code].beginner.mastered === true)
  assert('attempt log length === 10', p.standards[code].beginner.attempts.length === MASTERY_WINDOW)

  // Push 3 more wrong → window is 5 correct + 5 wrong = not mastered
  p = recordAttempt(p, code, 'beginner', false, 'w2', 'miss')
  p = recordAttempt(p, code, 'beginner', false, 'w3', 'miss')
  p = recordAttempt(p, code, 'beginner', false, 'w4', 'miss')
  assert(
    'after extra misses in window → mastered flips back to false',
    p.standards[code].beginner.mastered === false,
  )
  assert('still only 10 attempts stored', p.standards[code].beginner.attempts.length === MASTERY_WINDOW)
}

// ── 3. missedQuestions logs wrong answers with prompt ────────────────────
console.log('\n3. missedQuestions log')
{
  let p = emptyProgress()
  p = recordAttempt(p, 'NY-3.NBT.2', 'beginner', false, 'q-miss', 'What is 12 + 7?')
  p = recordAttempt(p, 'NY-3.NBT.2', 'beginner', true, 'q-hit', 'What is 1 + 1?')
  assert('one missed entry after one wrong', p.missedQuestions.length === 1)
  assert('missed prompt preserved', p.missedQuestions[0].prompt === 'What is 12 + 7?')
  assert('correct answer does not add to missed', p.missedQuestions.length === 1)
}

// ── 4. isStandardMastered needs both difficulties ────────────────────────
console.log('\n4. isStandardMastered')
{
  let p = emptyProgress()
  const code = 'NY-3.NBT.2'
  assert('unknown standard → false', isStandardMastered(p, code) === false)

  p = masterDifficulty(p, code, 'beginner')
  assert('only beginner → false', isStandardMastered(p, code) === false)

  p = masterDifficulty(p, code, 'advanced')
  assert('beginner + advanced → true', isStandardMastered(p, code) === true)
}

// ── 5. isTopicMastered + advanceActiveStandardIfNeeded ───────────────────
console.log('\n5. Topic mastery & advance')
{
  const topicId = 'number-operations-base-ten'
  let p = emptyProgress({
    [topicId]: {
      topicId,
      contentLevel: 3,
      standardOrder: ['NY-3.NBT.2', 'NY-4.NBT.4'],
      activeStandardIndex: 0,
      status: 'unlocked',
    },
  })

  assert('no standards mastered → topic false', isTopicMastered(p, topicId) === false)

  p = masterStandard(p, 'NY-3.NBT.2')
  assert('first standard done → still topic false', isTopicMastered(p, topicId) === false)

  p = advanceActiveStandardIfNeeded(p, topicId)
  assert('advance moves index to 1', p.topics[topicId].activeStandardIndex === 1)

  p = masterStandard(p, 'NY-4.NBT.4')
  assert('all standards done → topic true', isTopicMastered(p, topicId) === true)

  const before = p.topics[topicId].activeStandardIndex
  p = advanceActiveStandardIfNeeded(p, topicId)
  assert('at last standard, index does not move past end', p.topics[topicId].activeStandardIndex === before)
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('Phase 1 progress tests OK')
