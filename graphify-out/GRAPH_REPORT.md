# Graph Report - C:\Users\anoop\OneDrive\Desktop\AMZ  (2026-05-11)

## Corpus Check
- 63 files · ~1,698,079 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 265 nodes · 310 edges · 48 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `CanvaGameSprite` - 14 edges
2. `main()` - 8 edges
3. `main()` - 7 edges
4. `createSession()` - 6 edges
5. `trainingCompleteSession()` - 5 edges
6. `screenshot()` - 5 edges
7. `commitCorrect()` - 5 edges
8. `isConfigured()` - 5 edges
9. `getSubmissionPayload()` - 5 edges
10. `captureIntro()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `commitCorrect()` --calls--> `triggerScore()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\features\games\CodeDrop.tsx → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\components\ui\ScorePopup.tsx
- `commitCorrect()` --calls--> `calculatePoints()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\features\games\CodeDrop.tsx → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\scoring.ts
- `recordGameAttempt()` --calls--> `normalizeAttempt()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\session.ts → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\scoring.ts
- `makeSession()` --calls--> `createSession()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\__tests__\badges.test.ts → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\session.ts
- `makeSession()` --calls--> `createSession()`  [INFERRED]
  C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\__tests__\session.test.ts → C:\Users\anoop\OneDrive\Desktop\AMZ\app\src\lib\session.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (19): makeSession(), handleDemo(), downloadCertificate(), handleDownload(), applyFinalAttempt(), createDemoSession(), createSession(), emptyTraining() (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (7): getCanvaGameAsset(), CanvaGameSprite, coerceNumber(), createCanvaGameSprite(), defineCanvaGameSprite(), escapeHtmlAttribute(), normalizeBooleanAttribute()

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (16): advanceQuestion(), commitCorrect(), handleCodeSubmit(), handler(), handleTimezoneChoice(), buildTimezoneChoices(), checkCodeAnswer(), checkTimezoneAnswer() (+8 more)

### Community 3 - "Community 3"
Cohesion: 0.29
Nodes (14): buildSession(), captureGame(), captureIntro(), captureLanding(), clearBootData(), setSession(), completedSession(), failedGameSession() (+6 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (2): MapViewer(), useTweaks()

### Community 5 - "Community 5"
Cohesion: 0.31
Nodes (13): analyzeSvg(), browserPath(), escapeAttribute(), getAttr(), getFirstSvgTag(), getViewBoxParts(), main(), parseArgs() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (4): getPinchMetrics(), getPointerPoint(), handlePointerDown(), handlePointerMove()

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (2): finishRound(), triggerScore()

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (2): SessionProvider(), useSessionState()

### Community 9 - "Community 9"
Cohesion: 0.44
Nodes (8): awardBadge(), fetchBadges(), fetchLeaderboard(), getLocalScores(), isConfigured(), readLocalScores(), saveLocalScore(), submitAttemptScore()

### Community 10 - "Community 10"
Cohesion: 0.36
Nodes (8): albers(), main(), parse_gpkg_geom(), _parse_wkb(), Project rings → SVG path d string., Return list of rings [(lon,lat), ...] from a GeoPackage blob., Recursively parse WKB; returns (rings, new_offset)., rings_to_svg_path()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (3): RetryButton(), Typewriter(), useAudio()

### Community 12 - "Community 12"
Cohesion: 0.47
Nodes (3): buildRounds(), groupByState(), shuffle()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (2): pickPinQuestions(), shuffle()

### Community 14 - "Community 14"
Cohesion: 0.4
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.4
Nodes (2): handleRegionClick(), updateTraining()

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (2): publicAsset(), resolveAssetSrc()

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (2): buildTzRounds(), shuffle()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.67
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

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

## Knowledge Gaps
- **3 isolated node(s):** `Return list of rings [(lon,lat), ...] from a GeoPackage blob.`, `Recursively parse WKB; returns (rings, new_offset).`, `Project rings → SVG path d string.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 22`** (2 nodes): `StateTile.tsx`, `StateTile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `AnimatedCard()`, `AnimatedCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `RollingNumber.tsx`, `RollingNumber()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `StampBadge.tsx`, `StampBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `TrainingCompletePage.tsx`, `generateConfetti()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `evaluateBadges()`, `badges.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `city-sorter.test.ts`, `makeCities()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `crack-the-code.test.ts`, `makeFakeStates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `flow-ui.test.ts`, `fakeAttempt()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `pin-it.test.ts`, `makeFakeStates()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `test-setup.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `AppLayout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `GameTopBar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `IntelVault.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `TrainingTopBar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `StateInfoPanel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `InfoCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `GameIntro.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `PassInterstitial.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `timezones.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `leaderboard.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `scoring.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `map-data.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `recordGameAttempt()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `commitCorrect()` connect `Community 2` to `Community 7`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `normalizeAttempt()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `createSession()` (e.g. with `makeSession()` and `makeSession()`) actually correct?**
  _`createSession()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Return list of rings [(lon,lat), ...] from a GeoPackage blob.`, `Recursively parse WKB; returns (rings, new_offset).`, `Project rings → SVG path d string.` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._