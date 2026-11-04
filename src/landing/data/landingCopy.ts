/**
 * All landing page copy from docs/LANDING_PAGE_PLAN.md Section 4.
 * Layout components import from here so wording can change without touching structure.
 */

export const landingCopy = {
  meta: {
    title: 'Math Valley: Math Adventures for Grades 1–4',
    description:
      'A math-practice adventure for Grades 1–4. Explore islands, practice math, and unlock what\'s next with Lunara the dragon.',
  },

  nav: {
    skipToMain: 'Skip to main content',
    wordmark: 'Math Valley',
    explore: 'Explore the Valley',
    howItWorks: 'How It Works',
    explorers: 'For Explorers and Grown-Ups',
    logIn: 'Log In',
    menu: 'Menu',
  },

  hero: {
    id: 'top',
    headline: 'Welcome to Math Valley!',
    supporting:
      'Explore a world of math adventures, solve exciting challenges, and unlock new islands as you learn.',
    startLearning: 'Start Learning',
    exploreCta: 'Explore the Valley',
    gradesLine: 'For Grades 1–4',
  },

  explore: {
    id: 'explore',
    heading: 'Explore the Valley',
    intro:
      'Every island is a different kind of math. Finish one to open the path to the next.',
    gradeHint: 'Each grade has its own islands.',
    gradeLabel: (n: number) => `Grade ${n}`,
    openLabel: 'Open',
    lockedLabel: 'Locked',
    pathNote: 'Islands open in order as you master each one.',
  },

  howItWorks: {
    id: 'how-it-works',
    heading: 'How It Works',
    steps: [
      {
        title: 'Pick your explorer',
        sentence: 'Choose your grade and your avatar.',
      },
      {
        title: 'Visit an island',
        sentence: 'Start at the first island and try a math challenge.',
      },
      {
        title: 'Practice and learn',
        sentence:
          'Solve problems, starting with Beginner questions, at your own pace.',
      },
      {
        title: 'Unlock what\'s next',
        sentence:
          'Master Beginner and Advanced to open the next skill, then the next island.',
      },
    ],
  },

  explorers: {
    id: 'explorers',
    heading: 'Made for Young Math Explorers',
    intro:
      'Math Valley is a math-practice adventure for children in Grades 1–4. Each island focuses on one kind of math. Questions start at Beginner and move to Advanced, and children move forward by practicing until a skill feels solid.',
    standardsLine:
      'Practice based on New York State math standards for Grades 1–4.',
    forExplorersTitle: 'For explorers',
    forExplorersBody:
      'A dragon friend, islands to unlock, and math that you can practice at your own speed.',
    forGrownUpsTitle: 'For parents and teachers',
    forGrownUpsBody:
      'Practice stays focused on one skill at a time, moving from Beginner to Advanced before the next skill opens.',
  },

  finalCta: {
    id: 'start',
    heading: 'Your Math Adventure Starts Here!',
    startLearning: 'Start Learning',
  },

  footer: {
    wordmark: 'Math Valley',
    logIn: 'Log In',
    pauseAnimations: 'Pause animations',
    copyright: (year: number) => `© ${year} Math Valley`,
  },
} as const
