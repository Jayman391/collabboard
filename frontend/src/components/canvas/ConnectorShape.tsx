import { memo, useCallback } from 'react';
import { Group, Arrow, Line as KonvaLine } from 'react-konva';
import type Konva from 'konva';
import type { BoardObject } from '../../types/board';
import { useBoardStore } from '../../stores/boardStore';

interface ConnectorShapeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onHover?: (id: string | null) => void;
}

/** Find the point where a line from inside a rect to an outside point exits the rect border. */
function rectEdgeIntersection(
  cx: number, cy: number, // rect center
  hw: number, hh: number, // half-width, half-height
  tx: number, ty: number, // target point
): [number, number] {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];

  // Scale factors to hit each edge
  const sx = hw / Math.abs(dx || 0.001);
  const sy = hh / Math.abs(dy || 0.001);
  const s = Math.min(sx, sy);

  return [cx + dx * s, cy + dy * s];
}

export const ConnectorShape = memo(function ConnectorShape({ obj, isSelected, onSelect }: ConnectorShapeProps) {
  const meta = obj.metadata as { fromId?: string; toId?: string; style?: string } | undefined;
  const fromObj = useBoardStore((s) => meta?.fromId ? s.objects.get(meta.fromId) : undefined);
  const toObj = useBoardStore((s) => meta?.toId ? s.objects.get(meta.toId) : undefined);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onSelect(obj.id, shiftKey);
    },
    [obj.id, onSelect],
  );

  if (!fromObj || !toObj) return null;

  const fromCX = fromObj.x + fromObj.width / 2;
  const fromCY = fromObj.y + fromObj.height / 2;
  const toCX = toObj.x + toObj.width / 2;
  const toCY = toObj.y + toObj.height / 2;

  // Calculate intersection with shape borders
  const [startX, startY] = rectEdgeIntersection(fromCX, fromCY, fromObj.width / 2, fromObj.height / 2, toCX, toCY);
  const [endX, endY] = rectEdgeIntersection(toCX, toCY, toObj.width / 2, toObj.height / 2, fromCX, fromCY);

  const points = [startX, startY, endX, endY];
  const isArrow = meta?.style !== 'line';

  return (
    <Group id={obj.id} onClick={handleClick} onTap={handleClick}>
      {isArrow ? (
        <Arrow
          points={points}
          stroke={isSelected ? '#6c63ff' : (obj.color || '#888')}
          strokeWidth={isSelected ? 3 : 2}
          fill={isSelected ? '#6c63ff' : (obj.color || '#888')}
          pointerLength={10}
          pointerWidth={8}
          hitStrokeWidth={12}
          perfectDrawEnabled={false}
        />
      ) : (
        <KonvaLine
          points={points}
          stroke={isSelected ? '#6c63ff' : (obj.color || '#888')}
          strokeWidth={isSelected ? 3 : 2}
          hitStrokeWidth={12}
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
});
