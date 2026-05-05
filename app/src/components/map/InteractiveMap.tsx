import { useCallback, useEffect, useRef, useState } from 'react';

let svgCache: string | null = null;

const COLOR_DEFAULT = '#37475A';
const COLOR_EXPLORED = '#00A8A2';
const COLOR_ACTIVE = '#FF9900';
const COLOR_CORRECT = '#35D07F';
const COLOR_WRONG = '#FF6577';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const DRAG_THRESHOLD = 5;

function publicAsset(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

import { TZ_FILLS } from '@/lib/timezones';

interface InteractiveMapProps {
  onRegionClick: (code: string) => void;
  highlightedCodes?: string[];
  activeCode?: string | null;
  correctCode?: string | null;
  wrongCode?: string | null;
  mode?: 'explore' | 'gameplay';
  timezoneMap?: Record<string, string>;
  hoveredTimezone?: string | null;
}

type Transform = {
  zoom: number;
  panX: number;
  panY: number;
};

type PointerPoint = {
  x: number;
  y: number;
};

type DragState = {
  active: boolean;
  startX: number;
  startY: number;
  startPanX: number;
  startPanY: number;
  moved: boolean;
  regionCode?: string;
};

export default function InteractiveMap({
  onRegionClick,
  highlightedCodes = [],
  activeCode = null,
  correctCode = null,
  wrongCode = null,
  mode = 'explore',
  timezoneMap = {},
  hoveredTimezone = null,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ zoom: 1, panX: 0, panY: 0 });
  const dragStateRef = useRef<DragState | null>(null);
  const pointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const pinchRef = useRef<{
    distance: number;
    midpoint: PointerPoint;
    transform: Transform;
  } | null>(null);

  const onRegionClickRef = useRef(onRegionClick);
  onRegionClickRef.current = onRegionClick;

  const [svgContent, setSvgContent] = useState<string | null>(svgCache);
  const [loading, setLoading] = useState(!svgCache);

  const clampTransform = useCallback((next: Transform): Transform => {
    const container = containerRef.current;
    if (!container) return next;

    const rect = container.getBoundingClientRect();
    const zoom = Math.max(MIN_ZOOM, Math.min(next.zoom, MAX_ZOOM));
    const scaledWidth = rect.width * zoom;
    const scaledHeight = rect.height * zoom;

    const maxPanX = zoom <= 1 ? 0 : Math.max(0, (scaledWidth + rect.width * 0.4) / 2);
    const maxPanY = zoom <= 1 ? 0 : Math.max(0, (scaledHeight + rect.height * 0.4) / 2);

    return {
      zoom,
      panX: Math.max(-maxPanX, Math.min(next.panX, maxPanX)),
      panY: Math.max(-maxPanY, Math.min(next.panY, maxPanY)),
    };
  }, []);

  const setTransform = useCallback((next: Transform | ((current: Transform) => Transform)) => {
    const raw = typeof next === 'function' ? next(transformRef.current) : next;
    const clamped = clampTransform(raw);
    transformRef.current = clamped;
    
    if (contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.transform = `translate(${clamped.panX}px, ${clamped.panY}px) scale(${clamped.zoom})`;
        }
      });
    }
  }, [clampTransform]);

  useEffect(() => {
    if (svgCache) return;
    fetch(publicAsset('/maps/north-america.svg'))
      .then((r) => r.text())
      .then((text) => {
        svgCache = text;
        setSvgContent(text);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!svgContent || !contentRef.current) return;
    const cleanups: (() => void)[] = [];
    contentRef.current.querySelectorAll('.atlas-region').forEach((el) => {
      if (!(el instanceof SVGPathElement)) return;
      const code = el.getAttribute('data-code') || '';
      const tz = timezoneMap[code];
      
      el.classList.remove('is-active', 'is-highlighted', 'is-correct', 'is-wrong', 'is-unvisited', 'is-tz-hover', 'is-dimmed');

      if (code === correctCode) {
        el.style.fill = COLOR_CORRECT;
        el.classList.add('is-correct');
      } else if (code === wrongCode) {
        el.style.fill = COLOR_WRONG;
        el.classList.add('is-wrong');
      } else if (code === activeCode) {
        el.style.fill = COLOR_ACTIVE;
        el.classList.add('is-active');
      } else if (highlightedCodes.includes(code)) {
        el.style.fill = tz ? (TZ_FILLS[tz] ?? COLOR_EXPLORED) : COLOR_EXPLORED;
        el.classList.add('is-highlighted');
      } else {
        el.style.fill = COLOR_DEFAULT;
        if (mode === 'explore') el.classList.add('is-unvisited');
      }

      if (hoveredTimezone) {
        if (tz === hoveredTimezone) {
          el.classList.add('is-tz-hover');
        } else {
          el.classList.add('is-dimmed');
        }
      }

      el.style.cursor = mode === 'gameplay' && !correctCode && !wrongCode ? 'crosshair' : 'pointer';
      
      // Accessibility: Keyboard navigation
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Region ${code}`);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRegionClickRef.current(code);
        }
      };

      el.addEventListener('keydown', handleKeyDown as any);
      cleanups.push(() => el.removeEventListener('keydown', handleKeyDown as any));
    });

    return () => cleanups.forEach(fn => fn());
  }, [svgContent, highlightedCodes, activeCode, correctCode, wrongCode, mode, timezoneMap, hoveredTimezone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loading) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const point = {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      };

      setTransform((current) => {
        const nextZoom = Math.max(MIN_ZOOM, Math.min(current.zoom - e.deltaY * 0.002, MAX_ZOOM));
        const zoomRatio = nextZoom / current.zoom;
        return {
          zoom: nextZoom,
          panX: point.x - (point.x - current.panX) * zoomRatio,
          panY: point.y - (point.y - current.panY) * zoomRatio,
        };
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [loading, setTransform]);

  useEffect(() => {
    const handleResize = () => setTransform((current) => current);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setTransform]);

  function getPointerPoint(e: React.PointerEvent<HTMLDivElement>): PointerPoint {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function getPinchMetrics(points: PointerPoint[]) {
    const [a, b] = points;
    return {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      midpoint: {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      },
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const point = getPointerPoint(e);
    pointersRef.current.set(e.pointerId, point);
    e.currentTarget.setPointerCapture(e.pointerId);

    if (pointersRef.current.size === 2) {
      const metrics = getPinchMetrics([...pointersRef.current.values()]);
      pinchRef.current = {
        ...metrics,
        transform: transformRef.current,
      };
      dragStateRef.current = null;
      return;
    }

    const region = (e.target as Element).closest('.atlas-region') as HTMLElement | null;
    dragStateRef.current = {
      active: true,
      startX: point.x,
      startY: point.y,
      startPanX: transformRef.current.panX,
      startPanY: transformRef.current.panY,
      moved: false,
      regionCode: region?.dataset.code,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    const point = getPointerPoint(e);
    pointersRef.current.set(e.pointerId, point);

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const metrics = getPinchMetrics([...pointersRef.current.values()].slice(0, 2));
      const rect = e.currentTarget.getBoundingClientRect();
      const nextZoom = pinchRef.current.transform.zoom * (metrics.distance / pinchRef.current.distance);
      const zoomRatio = nextZoom / pinchRef.current.transform.zoom;
      const anchor = {
        x: pinchRef.current.midpoint.x - rect.width / 2,
        y: pinchRef.current.midpoint.y - rect.height / 2,
      };
      const shift = {
        x: metrics.midpoint.x - pinchRef.current.midpoint.x,
        y: metrics.midpoint.y - pinchRef.current.midpoint.y,
      };

      setTransform({
        zoom: nextZoom,
        panX: anchor.x - (anchor.x - pinchRef.current.transform.panX) * zoomRatio + shift.x,
        panY: anchor.y - (anchor.y - pinchRef.current.transform.panY) * zoomRatio + shift.y,
      });
      return;
    }

    const drag = dragStateRef.current;
    if (!drag?.active) return;

    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      drag.moved = true;
    }

    if (drag.moved) {
      setTransform({
        zoom: transformRef.current.zoom,
        panX: drag.startPanX + dx,
        panY: drag.startPanY + dy,
      });
    }
  }

  function handlePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const drag = dragStateRef.current;
    pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      const [remaining] = pointersRef.current.values();
      dragStateRef.current = {
        active: true,
        startX: remaining.x,
        startY: remaining.y,
        startPanX: transformRef.current.panX,
        startPanY: transformRef.current.panY,
        moved: true,
      };
      return;
    }

    if (drag?.active && !drag.moved && drag.regionCode) {
      onRegionClick(drag.regionCode);
    }

    dragStateRef.current = null;
  }

  function zoomBy(delta: number) {
    setTransform((current) => ({
      ...current,
      zoom: current.zoom + delta,
    }));
  }

  function resetView() {
    setTransform({ zoom: 1, panX: 0, panY: 0 });
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-[#1a2a1a] rounded-xl flex items-center justify-center text-[#00A8A2]">
        Loading map...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className="relative w-full h-full rounded-xl overflow-hidden select-none touch-none bg-[#1F2937]"
    >
      <div
        ref={contentRef}
        style={{
          transform: `translate(${transformRef.current.panX}px, ${transformRef.current.panY}px) scale(${transformRef.current.zoom})`,
        }}
        className={[
          'absolute inset-0 origin-center [&_svg]:w-full [&_svg]:h-full [&_svg]:block',
          '[&_.atlas-region]:transition-all [&_.atlas-region]:duration-300',
          '[&_.is-unvisited]:animate-map-pulse [&_.is-highlighted]:scale-[1.01]',
        ].join(' ')}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgContent ?? '' }}
      />

      <style>{`
        @keyframes map-pulse {
          0%, 100% { opacity: 0.85; filter: saturate(1.2); }
          50% { opacity: 0.55; filter: saturate(0.8); }
        }
        .atlas-region {
          cursor: pointer !important;
          paint-order: stroke fill markers;
          outline: none;
        }
        .atlas-region:focus-visible {
          stroke: #FF9900 !important;
          stroke-width: 4px !important;
          filter: brightness(1.2);
          z-index: 50;
          position: relative;
        }
        .atlas-region:hover, .is-tz-hover {
          filter: brightness(1.5) saturate(1.3);
          stroke: #fff !important;
          stroke-width: 2px !important;
          transform: scale(1.02);
        }
        .is-tz-hover {
          filter: brightness(1.8) saturate(1.5);
          stroke-width: 3px !important;
          transform: scale(1.04);
        }
        .is-dimmed {
          opacity: 0.25;
          filter: grayscale(0.8) contrast(0.8);
        }
        .is-unvisited {
          animation: map-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .atlas-region:active {
          transform: scale(0.98);
          filter: brightness(0.8);
        }
        .is-highlighted {
          animation: region-stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes region-stamp {
          0% { transform: scale(1.1); filter: brightness(1.5); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .is-unvisited, .is-highlighted {
            animation: none !important;
          }
        }
      `}</style>

      <div className="absolute bottom-3 right-3 z-20 flex overflow-hidden rounded-xl border border-white/10 bg-[#0d1a0d]/80 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => zoomBy(0.25)}
          className="flex h-10 w-10 items-center justify-center border-r border-white/10 text-lg font-black text-white transition-colors hover:bg-white/10"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => zoomBy(-0.25)}
          className="flex h-10 w-10 items-center justify-center border-r border-white/10 text-lg font-black text-white transition-colors hover:bg-white/10"
          aria-label="Zoom out"
        >
          -
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={resetView}
          className="flex h-10 w-14 items-center justify-center text-[10px] font-black uppercase tracking-widest text-[#00A8A2] transition-colors hover:bg-white/10"
          aria-label="Reset map view"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
