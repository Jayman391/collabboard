import { useCallback } from 'react';
import { Circle } from 'react-konva';
import type Konva from 'konva';
import type { BoardObject } from '../../types/board';

interface ConnectionHandlesProps {
  obj: BoardObject;
  onConnectStart: (sourceId: string, startX: number, startY: number) => void;
}

const HANDLE_RADIUS = 6;
const HANDLE_COLOR = '#6c63ff';

/** 4 edge midpoints: top, right, bottom, left */
function getEdgePoints(obj: BoardObject) {
  return [
    { x: obj.x + obj.width / 2, y: obj.y, side: 'top' as const },
    { x: obj.x + obj.width, y: obj.y + obj.height / 2, side: 'right' as const },
    { x: obj.x + obj.width / 2, y: obj.y + obj.height, side: 'bottom' as const },
    { x: obj.x, y: obj.y + obj.height / 2, side: 'left' as const },
  ];
}

export function ConnectionHandles({ obj, onConnectStart }: ConnectionHandlesProps) {
  const points = getEdgePoints(obj);

  // Use onMouseDown instead of onDragStart — the component will unmount
  // as soon as connectingFrom is set (because showHandles becomes false),
  // so drag-based approaches break. mouseDown fires synchronously before re-render.
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, px: number, py: number) => {
      e.cancelBubble = true;
      e.evt.stopPropagation();
      e.evt.preventDefault();
      onConnectStart(obj.id, px, py);
    },
    [obj.id, onConnectStart],
  );

  return (
    <>
      {points.map((pt) => (
        <Circle
          key={pt.side}
          x={pt.x}
          y={pt.y}
          radius={HANDLE_RADIUS}
          fill="#fff"
          stroke={HANDLE_COLOR}
          strokeWidth={2}
          onMouseDown={(e) => handleMouseDown(e, pt.x, pt.y)}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'crosshair';
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'default';
          }}
          perfectDrawEnabled={false}
        />
      ))}
    </>
  );
}
