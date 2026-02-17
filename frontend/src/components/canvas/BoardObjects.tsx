import { useCallback, useState, useMemo } from 'react';
import { useBoardStore } from '../../stores/boardStore';
import { useViewportStore } from '../../stores/viewportStore';
import { StickyNote } from './StickyNote';
import { RectangleShape } from './RectangleShape';
import { FrameShape } from './FrameShape';
import { CircleShape } from './CircleShape';
import { TextShape } from './TextShape';
import { LineShape } from './LineShape';
import { ConnectorShape } from './ConnectorShape';
import { ConnectionHandles } from './ConnectionHandles';

interface BoardObjectsProps {
  selectedIds: Set<string>;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onConnectStart: (sourceId: string, startX: number, startY: number) => void;
  connectingFrom: string | null;
}

// Types that support connection handles
const CONNECTABLE_TYPES = new Set(['sticky_note', 'rectangle', 'circle', 'frame']);

// Padding around viewport bounds so objects at the edge don't pop in/out
const CULL_PADDING = 200;

export function BoardObjects({
  selectedIds,
  onSelect,
  onDragMove,
  onDragEnd,
  onDoubleClick,
  onConnectStart,
  connectingFrom,
}: BoardObjectsProps) {
  const objects = useBoardStore((s) => s.objects);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Viewport state for culling
  const vx = useViewportStore((s) => s.x);
  const vy = useViewportStore((s) => s.y);
  const scale = useViewportStore((s) => s.scale);

  const handleHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  // Calculate visible world-coordinate bounds
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const viewLeft = (-vx / scale) - CULL_PADDING;
  const viewTop = (-vy / scale) - CULL_PADDING;
  const viewRight = (-vx + screenW) / scale + CULL_PADDING;
  const viewBottom = (-vy + screenH) / scale + CULL_PADDING;

  // Sort by z_index for correct rendering order and cull off-screen objects
  const sorted = useMemo(() => {
    const all = Array.from(objects.values()).sort((a, b) => a.z_index - b.z_index);
    return all.filter((obj) => {
      // Connectors are checked separately (both endpoints may be off-screen but line crosses viewport)
      if (obj.type === 'connector') return true;
      // Selected objects always render (for transformer handles)
      if (selectedIds.has(obj.id)) return true;

      const objRight = obj.x + (obj.width || 200);
      const objBottom = obj.y + (obj.height || 200);

      return objRight >= viewLeft && obj.x <= viewRight &&
             objBottom >= viewTop && obj.y <= viewBottom;
    });
  }, [objects, viewLeft, viewTop, viewRight, viewBottom, selectedIds]);

  const hoveredObj = hoveredId ? objects.get(hoveredId) : undefined;
  // Show connection handles when hovering a connectable shape (not during active connecting)
  const showHandles = hoveredObj && CONNECTABLE_TYPES.has(hoveredObj.type) && !connectingFrom;

  return (
    <>
      {sorted.map((obj) => {
        const isSelected = selectedIds.has(obj.id);
        const commonProps = {
          obj,
          isSelected,
          onSelect,
          onDragMove,
          onDragEnd,
          onDoubleClick,
          onHover: handleHover,
        };

        switch (obj.type) {
          case 'sticky_note':
            return <StickyNote key={obj.id} {...commonProps} />;
          case 'rectangle':
            return <RectangleShape key={obj.id} {...commonProps} />;
          case 'frame':
            return <FrameShape key={obj.id} {...commonProps} />;
          case 'circle':
            return <CircleShape key={obj.id} {...commonProps} />;
          case 'text':
            return <TextShape key={obj.id} {...commonProps} />;
          case 'line':
            return <LineShape key={obj.id} {...commonProps} />;
          case 'connector':
            return <ConnectorShape key={obj.id} {...commonProps} />;
          default:
            return null;
        }
      })}
      {/* Connection handles overlay on hovered shape */}
      {showHandles && hoveredObj && (
        <ConnectionHandles
          obj={hoveredObj}
          onConnectStart={onConnectStart}
        />
      )}
    </>
  );
}
