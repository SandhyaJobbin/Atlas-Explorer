# Graph Report - C:\Users\anoop\OneDrive\Desktop\AMZ  (2026-05-21)

## Corpus Check
- 86 files · ~1,747,159 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 367 nodes · 434 edges · 62 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 47 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]

## God Nodes (most connected - your core abstractions)
1. `CanvaGameSprite` - 14 edges
2. `filter()` - 13 edges
3. `main()` - 9 edges
4. `spawnParticles()` - 7 edges
5. `main()` - 7 edges
6. `createSession()` - 6 edges
7. `trainingCompleteSession()` - 5 edges
8. `screenshot()` - 5 edges
9. `commitCorrect()` - 5 edges
10. `handleRegionClick()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `filter()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\scripts\screenshots.ts → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\features\games\ReviewRound.tsx
- `spawnParticles()` --calls--> `triggerConfetti()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\components\ui\ParticleSystem.tsx → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\celebrations.ts
- `spawnParticles()` --calls--> `triggerStarCollection()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\components\ui\ParticleSystem.tsx → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\celebrations.ts
- `spawnParticles()` --calls--> `triggerRankUp()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\components\ui\ParticleSystem.tsx → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\celebrations.ts
- `spawnParticles()` --calls--> `triggerStreakFire()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\components\ui\ParticleSystem.tsx → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\celebrations.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (19): makeSession(), downloadCertificate(), handleDownload(), loadLeaderboard(), applyFinalAttempt(), createDemoSession(), createSession(), emptyTraining() (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (21): buildRounds(), groupByState(), shuffle(), advanceQuestion(), commitCorrect(), handleCodeSubmit(), handler(), handleTimezoneChoice() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (7): getCanvaGameAsset(), CanvaGameSprite, coerceNumber(), createCanvaGameSprite(), defineCanvaGameSprite(), escapeHtmlAttribute(), normalizeBooleanAttribute()

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (11): triggerClusterComplete(), triggerConfetti(), triggerMilestoneCeremony(), triggerRankUp(), triggerStarCollection(), triggerStreakFire(), buildRegionFlight(), handleRegionClick() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (14): buildSession(), captureGame(), captureIntro(), captureLanding(), clearBootData(), setSession(), completedSession(), failedGameSession() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (7): getPinchMetrics(), getPointerPoint(), getRegionFlightSource(), handleKeyDown(), handlePointerDown(), handlePointerEnd(), handlePointerMove()

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (2): MapViewer(), useTweaks()

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (7): App(), SessionProvider(), OfflineIndicator(), useOnlineStatus(), useSession(), useSessionState(), useSessionTimer()

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (11): awardBadge(), fetchBadges(), fetchLeaderboard(), getLocalScores(), isConfigured(), readLocalScores(), saveLocalScore(), submitAttemptScore() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.31
Nodes (13): analyzeSvg(), browserPath(), escapeAttribute(), getAttr(), getFirstSvgTag(), getViewBoxParts(), main(), parseArgs() (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (4): pickPinQuestions(), shuffle(), buildTzRounds(), shuffle()

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (2): finishRound(), triggerScore()

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (4): RetryButton(), Typewriter(), useAudio(), VolumeControl()

### Community 13 - "Community 13"
Cohesion: 0.36
Nodes (8): albers(), main(), parse_gpkg_geom(), _parse_wkb(), Project rings → SVG path d string., Return list of rings [(lon,lat), ...] from a GeoPackage blob., Recursively parse WKB; returns (rings, new_offset)., rings_to_svg_path()

### Community 14 - "Community 14"
Cohesion: 0.48
Nodes (4): buildQuestion(), hashString(), rotatePick(), seededShuffle()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (5): drainQueue(), enqueueScore(), getQueueLength(), readQueue(), writeQueue()

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (2): CheatSheet(), groupByRegion()

### Community 19 - "Community 19"
Cohesion: 0.4
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (2): getRegionOfDay(), hashDateLabel()

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (2): publicAsset(), resolveAssetSrc()

### Community 24 - "Community 24"
Cohesion: 0.83
Nodes (3): generateTrailPath(), getRegionCentroids(), updateExplorationTrail()

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 0.67
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): clampGameIndex(), resolveGameParam()

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **3 isolated node(s):** `Return list of rings [(lon,lat), ...] from a GeoPackage blob.`, `Recursively parse WKB; returns (rings, new_offset).`, `Project rings → SVG path d string.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 34`** (2 nodes): `StateTile.tsx`, `StateTile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `AnimatedCard()`, `AnimatedCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `InfoCard.tsx`, `hashString()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `RollingNumber.tsx`, `RollingNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `StreakMeter.tsx`, `getStreakTier()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `ExpeditionReport.tsx`, `handleCopyShare()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `evaluateBadges()`, `badges.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `city-sorter.test.ts`, `makeCities()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `crack-the-code.test.ts`, `makeFakeStates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `flow-ui.test.ts`, `fakeAttempt()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `pin-it.test.ts`, `makeFakeStates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `test-setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `AppLayout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `TrainingTopBar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `StampBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `GameIntro.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `PassInterstitial.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `useGameEvents.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `timezones.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `game-route.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `leaderboard.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `offline-indicator.test.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `scoring.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `sync-queue.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `map-data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `filter()` connect `Community 1` to `Community 4`, `Community 6`, `Community 8`, `Community 9`, `Community 10`, `Community 14`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `normalizeAttempt()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `recordGameAttempt()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `filter()` (e.g. with `main()` and `advanceQuestion()`) actually correct?**
  _`filter()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `spawnParticles()` (e.g. with `triggerConfetti()` and `triggerStarCollection()`) actually correct?**
  _`spawnParticles()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Return list of rings [(lon,lat), ...] from a GeoPackage blob.`, `Recursively parse WKB; returns (rings, new_offset).`, `Project rings → SVG path d string.` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._