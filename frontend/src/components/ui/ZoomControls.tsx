import { useViewportStore } from '../../stores/viewportStore';

export function ZoomControls() {
  const scale = useViewportStore((s) => s.scale);
  const setViewport = useViewportStore((s) => s.setViewport);

  const zoomTo = (newScale: number) => {
    const { x, y, scale: oldScale } = useViewportStore.getState();
    // Zoom relative to center of screen
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const newX = cx - (cx - x) * (newScale / oldScale);
    const newY = cy - (cy - y) * (newScale / oldScale);
    setViewport(newX, newY, newScale);
  };

  const zoomIn = () => zoomTo(Math.min(scale * 1.25, 5));
  const zoomOut = () => zoomTo(Math.max(scale / 1.25, 0.1));
  const zoomReset = () => {
    setViewport(0, 0, 1);
  };

  const pct = Math.round(scale * 100);

  const btnStyle: React.CSSProperties = {
    background: 'rgba(108, 99, 255, 0.2)',
    color: '#e0e0e0',
    border: '1px solid rgba(108,99,255,0.3)',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: 28,
    textAlign: 'center',
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        gap: 4,
        background: 'rgba(26, 26, 46, 0.9)',
        borderRadius: 10,
        padding: '6px 8px',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        alignItems: 'center',
      }}
    >
      <button onClick={zoomOut} style={btnStyle} title="Zoom out">-</button>
      <button onClick={zoomReset} style={{ ...btnStyle, fontSize: 11, padding: '4px 6px' }} title="Reset zoom">
        {pct}%
      </button>
      <button onClick={zoomIn} style={btnStyle} title="Zoom in">+</button>
    </div>
  );
}
