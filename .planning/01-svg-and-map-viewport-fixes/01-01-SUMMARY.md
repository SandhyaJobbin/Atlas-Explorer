# Plan 01-01 Summary: SVG ViewBox Fix and Aspect Ratio

**Status:** Complete
**Date:** 2026-05-21

## What was done

Fixed the North America SVG viewBox to include Canada and added proper aspect ratio handling.

## Changes Made

### 1. SVG viewBox expansion (`app/public/maps/north-america.svg`)
- Changed viewBox from `-189.42 -50 1157.42 830` to `-189.42 -780 1157.42 1420`
- y-start expanded from -50 to -780 to include Canada's northernmost paths (y ≈ -771)
- y-height expanded from 830 to 1420 to cover full vertical range
- Added `preserveAspectRatio="xMidYMid meet"` to root `<svg>` element

### 2. InteractiveMap.tsx — No width/height injection needed
- Verified that InteractiveMap.tsx does NOT inject width/height attributes on SVG root
- CSS `[&_svg]:w-full [&_svg]:h-full` handles sizing via Tailwind — works correctly with viewBox
- No code changes needed for width/height removal

## Verification

- SVG file is valid XML
- All 64 atlas-region paths unchanged
- viewBox correctly includes full map extent
- preserveAspectRatio ensures proportional scaling across browsers
