import type { BadgeDef, EarnedBadge, GameResult, Session } from '@/types';

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first-blood',    name: 'First Discovery' },
  { id: 'perfect-agent',  name: 'Perfect Explorer' },
  { id: 'hot-streak',     name: 'Hot Streak' },
  { id: 'globe-trotter',  name: 'Globe Trotter' },
  { id: 'diamond-agent',  name: 'Diamond Explorer' },
  { id: 'star-collector', name: 'Star Collector' },
  { id: 'never-quit',     name: 'Never Quit' },
  { id: 'speed-run',      name: 'Speed Run' },
];

/**
 * Evaluate which badges are newly earned after a passing attempt.
 * Called AFTER recordGameAttempt() has already appended the current attempt.
 *
 * @param gameIndex - index of the completed game in session.games
 * @param result    - raw onComplete payload
 * @param session   - full session object (session.earnedBadges mutated on award)
 * @param ratioOverride - optional override for ratio calculation
 */
export function evaluateBadges(
  gameIndex: number,
  result: GameResult & { timerRatio?: number },
  session: Session,
  ratioOverride?: number,
): EarnedBadge[] {
  const game = session.games[gameIndex];
  const allGames = session.games;
  const newBadges: EarnedBadge[] = [];

  function maybeAdd(id: string) {
    if (session.earnedBadges.includes(id)) return;
    const def = BADGE_DEFS.find((b) => b.id === id);
    if (!def) return;
    newBadges.push({ id: def.id, name: def.name });
    session.earnedBadges.push(id);
  }

  const ratio =
    typeof ratioOverride === 'number'
      ? ratioOverride
      : result.correctCount / result.totalCount;

  // first-blood: only one attempt recorded (this is it)
  if (game.attempts.length === 1) maybeAdd('first-blood');

  // perfect-agent: 100% correct
  if (ratio === 1) maybeAdd('perfect-agent');

  // hot-streak: peak consecutive-correct run >= 3 for this game
  if (game.streakPeak >= 3) maybeAdd('hot-streak');

  // globe-trotter: all active games passed
  if (allGames.length > 0 && allGames.every((g) => g.passed)) maybeAdd('globe-trotter');

  // diamond-agent: all active games passed on first attempt each
  if (allGames.length > 0 && allGames.every((g) => g.passed && g.attempts.length === 1))
    maybeAdd('diamond-agent');

  // star-collector: max possible stars in a session
  const totalStars = allGames.reduce((sum, g) => sum + (g.stars || 0), 0);
  if (allGames.length > 0 && totalStars >= allGames.length * 3) maybeAdd('star-collector');

  // never-quit: passed on 4th or later attempt (3+ prior fails)
  if (game.attempts.length >= 4) maybeAdd('never-quit');

  // speed-run: 100% score AND timerRatio > 0.5 AND game has a timer (timerRatio !== -1)
  if (ratio === 1 && result.timerRatio !== undefined && result.timerRatio > 0.5)
    maybeAdd('speed-run');

  return newBadges;
}
