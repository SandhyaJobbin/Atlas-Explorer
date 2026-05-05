import { chromium, type Page } from 'playwright';
import path from 'path';

const BASE = 'http://localhost:5173/Atlas-Explorer/';
const OUT = path.resolve(import.meta.dirname, '..', 'screenshots');

// Helper: build a session object that the app expects in localStorage
function makeSession(overrides: Record<string, unknown> = {}) {
  const base = {
    id: 'atlas-screenshot-session',
    mode: 'demo',
    agent: 'Screenshot Bot',
    name: 'Screenshot Bot',
    waveCode: 'DEMO',
    trainerName: 'Demo Mode',
    currentGameIndex: 0,
    completed: false,
    createdAt: new Date().toISOString(),
    earnedBadges: [],
    lastKnownRank: null,
    demo: true,
    training: { mapExplorerClicked: [], completed: false },
    games: [
      { key: 'crack', label: 'Crack the Code', attempts: [], score: 0, correctCount: 0, totalCount: 0, stars: 0, passed: false, retryAvailable: false, completed: false, streakPeak: 0, attemptNumber: 0, earnedBadges: [] },
      { key: 'pin',   label: 'Pin It!',        attempts: [], score: 0, correctCount: 0, totalCount: 0, stars: 0, passed: false, retryAvailable: false, completed: false, streakPeak: 0, attemptNumber: 0, earnedBadges: [] },
      { key: 'sorter', label: 'City Sorter',   attempts: [], score: 0, correctCount: 0, totalCount: 0, stars: 0, passed: false, retryAvailable: false, completed: false, streakPeak: 0, attemptNumber: 0, earnedBadges: [] },
    ],
  };
  return { ...base, ...overrides };
}

function trainingCompleteSession() {
  // 63 state/province codes to mark training done
  const codes = Array.from({ length: 63 }, (_, i) => `R${i}`);
  return makeSession({
    training: { mapExplorerClicked: codes, completed: true },
  });
}

function passedGameSession(gameIndex: number) {
  const session = trainingCompleteSession();
  const attempt = {
    score: 200,
    correctCount: 12,
    totalCount: 13,
    ratio: 0.923,
    attemptNumber: 1,
    passed: true,
    stars: 2,
    recordedAt: new Date().toISOString(),
  };
  for (let i = 0; i <= gameIndex; i++) {
    (session.games as any[])[i] = {
      ...(session.games as any[])[i],
      attempts: [attempt],
      score: 200,
      correctCount: 12,
      totalCount: 13,
      stars: 2,
      passed: true,
      retryAvailable: false,
      completed: true,
      streakPeak: 5,
      attemptNumber: 1,
    };
  }
  session.currentGameIndex = gameIndex + 1;
  return session;
}

function failedGameSession(gameIndex: number) {
  const session = trainingCompleteSession();
  const attempt = {
    score: 80,
    correctCount: 4,
    totalCount: 13,
    ratio: 0.308,
    attemptNumber: 1,
    passed: false,
    stars: 0,
    recordedAt: new Date().toISOString(),
  };
  (session.games as any[])[gameIndex] = {
    ...(session.games as any[])[gameIndex],
    attempts: [attempt],
    score: 80,
    correctCount: 4,
    totalCount: 13,
    stars: 0,
    passed: false,
    retryAvailable: true,
    completed: false,
    streakPeak: 2,
    attemptNumber: 1,
  };
  session.currentGameIndex = gameIndex;
  return session;
}

function completedSession() {
  const session = passedGameSession(2);
  session.completed = true;
  session.currentGameIndex = 3;
  session.earnedBadges = ['first-blood', 'hot-streak', 'globe-trotter'];
  return session;
}

async function seedAndGo(page: Page, session: Record<string, unknown> | null, hash: string) {
  // Navigate first to establish origin, seed localStorage, then reload so React picks it up
  await page.goto(BASE + hash, { waitUntil: 'domcontentloaded' });
  if (session === null) {
    await page.evaluate(() => localStorage.removeItem('atlas-explorer-session'));
  } else {
    await page.evaluate((s) => {
      localStorage.setItem('atlas-explorer-session', JSON.stringify(s));
    }, session);
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log(`  captured: ${name}.png`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // ── 1. Landing Page ───────────────────────────────────────────────────────
  console.log('1. Landing Page');
  await seedAndGo(page, null, '#/');
  await page.waitForTimeout(1500);
  await screenshot(page, '01-landing');

  // ── 2. Map Explorer ───────────────────────────────────────────────────────
  console.log('2. Map Explorer');
  await seedAndGo(page, makeSession(), '#/train/map?debug=1');
  await page.waitForTimeout(2000);
  await screenshot(page, '02-map-explorer');

  // ── 2b. Map Explorer with some progress + state selected ──────────────────
  console.log('2b. Map Explorer (with state selected)');
  const partialTraining = makeSession({
    training: {
      mapExplorerClicked: ['CA', 'NY', 'TX', 'FL', 'WA', 'ON', 'BC', 'QC', 'AB', 'IL', 'OH', 'PA', 'MI', 'GA', 'NC'],
      completed: false,
    },
  });
  await seedAndGo(page, partialTraining, '#/train/map?debug=1');
  await page.waitForTimeout(2000);
  try {
    const svgPath = page.locator('svg path[data-code]').first();
    if (await svgPath.isVisible({ timeout: 2000 })) {
      await svgPath.click();
      await page.waitForTimeout(800);
    }
  } catch { /* ok if selector not found */ }
  await screenshot(page, '02b-map-explorer-selected');

  // ── 3. Training Complete ──────────────────────────────────────────────────
  console.log('3. Training Complete');
  await seedAndGo(page, trainingCompleteSession(), '#/train/complete?debug=1');
  await page.waitForTimeout(2000);
  await screenshot(page, '03-training-complete');

  // ── 4. Game Intro — CodeDrop (game 0) ─────────────────────────────────────
  console.log('4. Game Intro (CodeDrop)');
  await seedAndGo(page, trainingCompleteSession(), '#/play?debug=1');
  await page.waitForTimeout(1500);
  await screenshot(page, '04-game-intro-codedrop');

  // ── 5. CodeDrop Mid-game ──────────────────────────────────────────────────
  console.log('5. CodeDrop Mid-game');
  try {
    const startBtn = page.locator('button').filter({ hasText: /begin|start|descent/i }).first();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
    await screenshot(page, '05-codedrop-midgame');
  } catch (e) {
    console.log('  (could not capture mid-game, capturing current state)');
    await screenshot(page, '05-codedrop-midgame');
  }

  // ── 6. Pass Interstitial ──────────────────────────────────────────────────
  console.log('6. Pass Interstitial');
  // Start game fresh, play it, capture the pass screen
  // Since we can't actually play the game, we'll capture the game intro for a passed-game session
  await seedAndGo(page, passedGameSession(0), '#/play?game=0&debug=1');
  await page.waitForTimeout(1500);
  try {
    const startBtn = page.locator('button').filter({ hasText: /begin|start|descent|run/i }).first();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch { /* proceed */ }
  await screenshot(page, '06-pass-interstitial-attempt');

  // ── 7. Fail Interstitial — retry intro ────────────────────────────────────
  console.log('7. Fail — retry intro');
  await seedAndGo(page, failedGameSession(0), '#/play?game=0&debug=1');
  await page.waitForTimeout(1500);
  await screenshot(page, '07-fail-game-intro-retry');

  // ── 8. Game Intro — PinRush (game 1) ──────────────────────────────────────
  console.log('8. Game Intro (PinRush)');
  const pinSession = passedGameSession(0);
  pinSession.currentGameIndex = 1;
  await seedAndGo(page, pinSession, '#/play?game=1&debug=1');
  await page.waitForTimeout(1500);
  await screenshot(page, '08-game-intro-pinrush');

  // ── 9. PinRush Mid-game ───────────────────────────────────────────────────
  console.log('9. PinRush Mid-game');
  try {
    const startBtn = page.locator('button').filter({ hasText: /open|start|map/i }).first();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
    await screenshot(page, '09-pinrush-midgame');
  } catch {
    await screenshot(page, '09-pinrush-midgame');
  }

  // ── 10. Game Intro — CityStack (game 2) ───────────────────────────────────
  console.log('10. Game Intro (CityStack)');
  const citySession = passedGameSession(1);
  citySession.currentGameIndex = 2;
  await seedAndGo(page, citySession, '#/play?game=2&debug=1');
  await page.waitForTimeout(1500);
  await screenshot(page, '10-game-intro-citystack');

  // ── 11. CityStack Mid-game ────────────────────────────────────────────────
  console.log('11. CityStack Mid-game');
  try {
    const startBtn = page.locator('button').filter({ hasText: /start|stack/i }).first();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
    await screenshot(page, '11-citystack-midgame');
  } catch {
    await screenshot(page, '11-citystack-midgame');
  }

  // ── 12. Results Page ──────────────────────────────────────────────────────
  console.log('12. Results Page');
  await seedAndGo(page, completedSession(), '#/play/results?debug=1');
  await page.waitForTimeout(2500);
  await screenshot(page, '12-results');

  // ── 13. Landing Page (mobile viewport) ────────────────────────────────────
  console.log('13. Landing Page (mobile)');
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAndGo(page, null, '#/');
  await page.waitForTimeout(1500);
  await screenshot(page, '13-landing-mobile');

  // ── 14. Map Explorer (mobile) ─────────────────────────────────────────────
  console.log('14. Map Explorer (mobile)');
  await seedAndGo(page, makeSession(), '#/train/map?debug=1');
  await page.waitForTimeout(2000);
  await screenshot(page, '14-map-explorer-mobile');

  await browser.close();
  console.log('\nDone! Screenshots saved to app/screenshots/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
