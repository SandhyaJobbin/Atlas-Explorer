export interface Point {
  x: number;
  y: number;
}

export function getRegionCentroids(
  container: HTMLElement,
  orderedCodes: string[]
): Point[] {
  const points: Point[] = [];
  for (const code of orderedCodes) {
    const el = container.querySelector(`[data-code="${code}"]`);
    if (el instanceof SVGGraphicsElement && typeof el.getBBox === 'function') {
      try {
        const bbox = el.getBBox();
        if (bbox && (bbox.width > 0 || bbox.height > 0 || bbox.x > 0 || bbox.y > 0)) {
          points.push({
            x: bbox.x + bbox.width / 2,
            y: bbox.y + bbox.height / 2,
          });
        }
      } catch {
        // getBBox might fail in jsdom or detached elements
      }
    }
  }
  return points;
}

export function generateTrailPath(points: Point[]): string {
  if (points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function updateExplorationTrail(
  container: HTMLElement,
  orderedCodes: string[]
): void {
  const svg = container.querySelector('svg');
  if (!svg) return;

  let group = svg.querySelector('#atlas-exploration-trail');
  if (!group) {
    group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.id = 'atlas-exploration-trail';
    group.setAttribute('style', 'pointer-events: none;');
    svg.appendChild(group);
  }

  let pathEl = group.querySelector('#atlas-trail-path') as SVGPathElement | null;
  if (!pathEl) {
    pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.id = 'atlas-trail-path';
    pathEl.setAttribute(
      'style',
      'stroke: var(--atlas-accent); stroke-width: 2.5px; stroke-linecap: round; stroke-linejoin: round; fill: none; opacity: 0.6; pointer-events: none; transition: stroke-dashoffset 1s ease-in-out;'
    );
    group.appendChild(pathEl);
  }

  let pinEl = group.querySelector('#atlas-trail-pin') as SVGTextElement | null;
  if (!pinEl) {
    pinEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    pinEl.id = 'atlas-trail-pin';
    pinEl.setAttribute(
      'style',
      'font-size: 18px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); pointer-events: none; transition: transform 1s ease-in-out, opacity 0.5s ease-in-out; text-anchor: middle; dominant-baseline: central;'
    );
    pinEl.textContent = '🧭';
    group.appendChild(pinEl);
  }

  const points = getRegionCentroids(container, orderedCodes);

  if (points.length === 0) {
    pathEl.setAttribute('d', '');
    pinEl.style.opacity = '0';
    return;
  }

  const lastPoint = points[points.length - 1];
  pinEl.style.opacity = '1';
  pinEl.style.transform = `translate(${lastPoint.x}px, ${lastPoint.y}px)`;

  if (points.length < 2) {
    pathEl.setAttribute('d', '');
    return;
  }

  const newD = generateTrailPath(points);
  const prevD = pathEl.getAttribute('d');
  const prevLength = prevD ? pathEl.getTotalLength() : 0;

  pathEl.setAttribute('d', newD);
  const newLength = pathEl.getTotalLength();

  if (newLength > 0 && prevD !== newD) {
    pathEl.style.transition = 'none';
    pathEl.style.strokeDasharray = `${newLength} ${newLength}`;
    pathEl.style.strokeDashoffset = `${newLength - prevLength}`;

    // Force reflow
    pathEl.getBoundingClientRect();

    pathEl.style.transition = 'stroke-dashoffset 1s ease-in-out';
    pathEl.style.strokeDashoffset = '0';
  }
}
