import { useEffect, useRef, useState } from 'react';

// ─── Module-level SVG cache (never re-fetch) ──────────────────────────────────
let svgCache: string | null = null;

// ─── Color tokens ─────────────────────────────────────────────────────────────
const COLOR_DEFAULT  = '';          // let SVG fill stand
const COLOR_EXPLORED = '#00A8A2'; // teal
const COLOR_ACTIVE   = '#FF9900'; // orange
const COLOR_CORRECT  = '#35D07F'; // green
const COLOR_WRONG    = '#FF6577'; // red

interface InteractiveMapProps {
  onRegionClick: (code: string) => void;
  highlightedCodes?: string[];
  activeCode?: string | null;
  correctCode?: string | null;
  wrongCode?: string | null;
  mode?: 'explore' | 'gameplay';
}

export default function InteractiveMap({
  onRegionClick,
  highlightedCodes = [],
  activeCode = null,
  correctCode = null,
  wrongCode = null,
  mode = 'explore',
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(svgCache);
  const [loading, setLoading] = useState(!svgCache);
  const [zoom, setZoom] = useState(1);

  // ── Fetch SVG once ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (svgCache) return;
    fetch('/maps/north-america.svg')
      .then((r) => r.text())
      .then((text) => {
        svgCache = text;
        setSvgContent(text);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // ── Apply colors whenever highlights/active/svg changes ───────────────────────
  useEffect(() => {
    if (!svgContent || !containerRef.current) return;
    containerRef.current
      .querySelectorAll<SVGPathElement>('.atlas-region')
      .forEach((el) => {
        const code = el.dataset.code ?? '';
        if (code === correctCode) {
          el.style.fill = COLOR_CORRECT;
          el.style.cursor = 'pointer';
        } else if (code === wrongCode) {
          el.style.fill = COLOR_WRONG;
          el.style.cursor = 'pointer';
        } else if (code === activeCode) {
          el.style.fill = COLOR_ACTIVE;
          el.style.cursor = 'pointer';
        } else if (highlightedCodes.includes(code)) {
          el.style.fill = COLOR_EXPLORED;
          el.style.cursor = 'pointer';
        } else {
          el.style.fill = COLOR_DEFAULT;
          el.style.cursor = mode === 'gameplay' ? 'crosshair' : 'pointer';
        }
      });
  }, [svgContent, highlightedCodes, activeCode, correctCode, wrongCode, mode]);

  // ── Mouse wheel zoom ───────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomSensitivity = 0.002;
      setZoom((prevZoom) => {
        let newZoom = prevZoom - e.deltaY * zoomSensitivity;
        newZoom = Math.max(0.5, Math.min(newZoom, 5)); // clamp zoom

        const zoomRatio = newZoom / prevZoom;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const contentX = container.scrollLeft + mouseX;
        const contentY = container.scrollTop + mouseY;

        const newContentX = contentX * zoomRatio;
        const newContentY = contentY * zoomRatio;

        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollLeft = newContentX - mouseX;
            containerRef.current.scrollTop = newContentY - mouseY;
          }
        });

        return newZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [svgContent]);

  // ── Click via event delegation ─────────────────────────────────────────────
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = (e.target as Element).closest('.atlas-region');
    if (!target) return;
    const code = (target as HTMLElement).dataset.code;
    if (code) onRegionClick(code);
  }

  if (loading) {
    return (
      <div className="w-full aspect-[1000/660] bg-[#1a2a1a] rounded-xl flex items-center justify-center text-[#00A8A2]">
        Loading map…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-auto select-none"
    >
      <div
        onClick={handleClick}
        style={{ width: `${zoom * 100}%`, minWidth: `${zoom * 1000}px` }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svgContent ?? '' }}
        className="[&_svg]:w-full [&_svg]:h-auto [&_.atlas-region]:transition-[fill] [&_.atlas-region]:duration-150 [&_.atlas-region:hover]:brightness-125 origin-top-left"
      />
    </div>
  );
}
