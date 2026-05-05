import { useEffect, useState } from 'react';
import { publicAsset } from '@/lib/assets';

let svgCache: string | null = null;

interface StateOutlineProps {
  stateCode: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

interface PathInfo {
  d: string;
  viewBox: string;
}

/** Measure the true bounding box of an SVG path by inserting it into a hidden
 *  off-screen SVG and calling getBBox(). This handles all path commands and
 *  relative coordinates correctly, unlike manual coordinate parsing. */
function measurePathViewBox(d: string, padding = 10): string {
  try {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    svg.style.pointerEvents = 'none';

    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
    document.body.appendChild(svg);

    const { x, y, width, height } = path.getBBox();
    document.body.removeChild(svg);

    return `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`;
  } catch {
    return '0 0 800 600';
  }
}

export default function StateOutline({ 
  stateCode, 
  className = '', 
  fill = 'currentColor', 
  stroke = 'none',
  strokeWidth = 1
}: StateOutlineProps) {
  const [info, setInfo] = useState<PathInfo | null>(null);

  useEffect(() => {
    async function loadSvg() {
      if (!svgCache) {
        try {
          const response = await fetch(publicAsset('/maps/north-america.svg'));
          svgCache = await response.text();
        } catch (err) {
          console.error('Failed to load map SVG for outline:', err);
          return;
        }
      }

      if (svgCache) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCache, 'image/svg+xml');
        const path = doc.querySelector(`path[data-code="${stateCode}"]`);
        if (path) {
          const d = path.getAttribute('d') ?? '';
          const viewBox = measurePathViewBox(d);
          setInfo({ d, viewBox });
        }
      }
    }

    loadSvg();
  }, [stateCode]);

  if (!info) return null;

  return (
    <svg 
      viewBox={info.viewBox} 
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <path 
        d={info.d} 
        fill={fill} 
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}
