const { useState, useRef, useEffect, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "graphite",
  "showBorder": true,
  "showCanada": true,
  "showUSA": true,
  "showLabels": true
}/*EDITMODE-END*/;

const PALETTES = {
  graphite: {
    bg: "#f4f3ef",
    landCA: "#e7e3da",
    landUS: "#d8d4cb",
    stroke: "#ffffff",
    hover: "#c9b18a",
    selected: "#3a3733",
    selectedText: "#f4f3ef",
    accent: "#3a3733",
    text: "#1a1a1a",
    muted: "#8a8680"
  },
  ocean: {
    bg: "#0d1b2a",
    landCA: "#1b3a5b",
    landUS: "#234974",
    stroke: "#0d1b2a",
    hover: "#7fb8e2",
    selected: "#ffd166",
    selectedText: "#0d1b2a",
    accent: "#7fb8e2",
    text: "#e9eef5",
    muted: "#7a8b9c"
  },
  paper: {
    bg: "#fbf7ee",
    landCA: "#efe2c4",
    landUS: "#f5e8c8",
    stroke: "#fbf7ee",
    hover: "#d4a574",
    selected: "#8b3a3a",
    selectedText: "#fbf7ee",
    accent: "#8b3a3a",
    text: "#2a1f17",
    muted: "#9a8b78"
  },
  duo: {
    bg: "#ffffff",
    landCA: "#ff5b5b",
    landUS: "#1a1a1a",
    stroke: "#ffffff",
    hover: "#fff685",
    selected: "#fff685",
    selectedText: "#1a1a1a",
    accent: "#1a1a1a",
    text: "#1a1a1a",
    muted: "#8a8a8a"
  }
};

function MapViewer() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const palette = PALETTES[tweaks.palette] || PALETTES.graphite;

  const [hoverId, setHoverId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef(null);

  const data = window.MAP_DATA;

  const visiblePaths = useMemo(() => {
    return data.paths.filter(p => {
      if (p.country === 'CA') return tweaks.showCanada;
      if (p.country === 'US') return tweaks.showUSA;
      return false;
    });
  }, [data.paths, tweaks.showCanada, tweaks.showUSA]);

  const fitView = useCallback(() => setView({ x: 0, y: 0, scale: 1 }), []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setView(v => {
      const newScale = Math.max(0.5, Math.min(20, v.scale * factor));
      const ratio = newScale / v.scale;
      return {
        scale: newScale,
        x: cx - (cx - v.x) * ratio,
        y: cy - (cy - v.y) * ratio
      };
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y, moved: false };
    setIsDragging(true);
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
    setView(v => ({ ...v, x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  };
  const onMouseUp = () => { dragRef.current = null; setIsDragging(false); };

  const onPathClick = (e, p) => {
    if (dragRef.current && dragRef.current.moved) return;
    setSelectedId(prev => prev === p.id ? null : p.id);
  };

  const selected = selectedId ? data.paths.find(p => p.id === selectedId) : null;
  const hovered = hoverId ? data.paths.find(p => p.id === hoverId) : null;

  const strokeColor = tweaks.showBorder ? palette.stroke : 'transparent';

  const zoomBy = (factor) => {
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const cx = w / 2, cy = h / 2;
    setView(v => {
      const newScale = Math.max(0.5, Math.min(20, v.scale * factor));
      const ratio = newScale / v.scale;
      return { scale: newScale, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio };
    });
  };

  return (
    <div className="map-root" style={{ background: palette.bg, color: palette.text }}>
      <div className="map-header">
        <div className="map-title-block">
          <div className="map-title">North America</div>
          <div className="map-sub" style={{ color: palette.muted }}>Canada · United States — merged & georeferenced on the 49th parallel and Lake Erie</div>
        </div>
        <div className="map-meta" style={{ color: palette.muted }}>
          <span><b style={{ color: palette.text }}>{data.paths.filter(p => p.country === 'CA').length}</b> provinces & territories</span>
          <span className="map-meta-sep">·</span>
          <span><b style={{ color: palette.text }}>{data.paths.filter(p => p.country === 'US').length}</b> states</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="map-stage"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="map-transform"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: '0 0'
          }}
        >
          <svg
            viewBox={data.viewBox}
            preserveAspectRatio="xMidYMid meet"
            className="map-svg"
          >
            {visiblePaths.map(p => {
              const isHover = hoverId === p.id;
              const isSel = selectedId === p.id;
              let fill;
              if (isSel) fill = palette.selected;
              else if (isHover) fill = palette.hover;
              else fill = p.country === 'CA' ? palette.landCA : palette.landUS;
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill={fill}
                  stroke={strokeColor}
                  strokeWidth={p.country === 'div' ? 0.5 : 0.6}
                  vectorEffect="non-scaling-stroke"
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(prev => prev === p.id ? null : prev)}
                  onClick={(e) => onPathClick(e, p)}
                  style={{ cursor: 'pointer', transition: 'fill 120ms ease' }}
                />
              );
            })}
            {tweaks.showLabels && visiblePaths.map(p => {
              if (p.country === 'div') return null;
              if (p.lx == null) return null;
              // Hide labels for tiny regions unless zoomed in enough
              const minArea = 600 / (view.scale * view.scale);
              if (p.larea < minArea) return null;
              const isSel = selectedId === p.id;
              // Font size shrinks with zoom but only partially (so labels stay legible)
              const fs = Math.max(4, Math.min(14, Math.sqrt(p.larea) / 6)) / Math.sqrt(view.scale);
              return (
                <text
                  key={p.id + '-l'}
                  x={p.lx}
                  y={p.ly}
                  fontSize={fs}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSel ? palette.selectedText : palette.text}
                  opacity={isSel ? 1 : 0.78}
                  style={{
                    fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    paintOrder: 'stroke',
                    stroke: isSel ? palette.selected : (p.country === 'CA' ? palette.landCA : palette.landUS),
                    strokeWidth: fs * 0.25,
                    strokeLinejoin: 'round'
                  }}
                >
                  {p.code}
                </text>
              );
            })}
          </svg>
        </div>

        {(hovered || selected) && (
          <div className="info-card" style={{ background: palette.bg, color: palette.text, borderColor: palette.muted + '55' }}>
            {selected && (
              <div className="info-row">
                <div className="info-pill" style={{ background: palette.selected, color: palette.selectedText }}>
                  {selected.country === 'CA' ? 'CA' : selected.country === 'US' ? 'US' : '·'}
                </div>
                <div className="info-name">{selected.name}</div>
                <div className="info-id" style={{ color: palette.muted }}>{selected.id}</div>
              </div>
            )}
            {hovered && hovered.id !== selectedId && (
              <div className="info-row info-hover" style={{ color: palette.muted }}>
                <span className="info-hover-lbl">{selected ? 'Hover' : 'Pointing at'}</span>
                <span className="info-name-sm">{hovered.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="zoom-controls" style={{ background: palette.bg, borderColor: palette.muted + '55', color: palette.text }}>
          <button onClick={() => zoomBy(1.3)} aria-label="Zoom in">+</button>
          <button onClick={() => zoomBy(1/1.3)} aria-label="Zoom out">−</button>
          <button onClick={fitView} aria-label="Reset view" title="Reset">⤢</button>
        </div>

        <div className="legend" style={{ background: palette.bg, color: palette.text, borderColor: palette.muted + '55' }}>
          <div className="legend-row">
            <span className="legend-sw" style={{ background: palette.landCA, borderColor: palette.muted + '55' }}></span>
            <span>Canada</span>
          </div>
          <div className="legend-row">
            <span className="legend-sw" style={{ background: palette.landUS, borderColor: palette.muted + '55' }}></span>
            <span>United States</span>
          </div>
          <div className="legend-row">
            <span className="legend-sw" style={{ background: palette.selected, borderColor: palette.muted + '55' }}></span>
            <span>Selected</span>
          </div>
          <div className="legend-tip" style={{ color: palette.muted }}>scroll to zoom · drag to pan · click to select</div>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Palette" />
        <TweakRadio
          label="Theme"
          value={tweaks.palette}
          onChange={v => setTweak('palette', v)}
          options={[
            { value: 'graphite', label: 'Graphite' },
            { value: 'paper', label: 'Paper' },
            { value: 'ocean', label: 'Ocean' },
            { value: 'duo', label: 'Duo' }
          ]}
        />
        <TweakSection label="Layers" />
        <TweakToggle label="Canada" value={tweaks.showCanada} onChange={v => setTweak('showCanada', v)} />
        <TweakToggle label="United States" value={tweaks.showUSA} onChange={v => setTweak('showUSA', v)} />
        <TweakSection label="Style" />
        <TweakToggle label="Show labels" value={tweaks.showLabels} onChange={v => setTweak('showLabels', v)} />
        <TweakToggle label="Show borders" value={tweaks.showBorder} onChange={v => setTweak('showBorder', v)} />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MapViewer />);
