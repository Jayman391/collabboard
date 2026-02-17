import { memo, useCallback, useMemo } from 'react';
import { Line as KonvaLine } from 'react-konva';
import type Konva from 'konva';
import type { BoardObject } from '../../types/board';
import { throttle } from '../../utils/throttle';

interface LineShapeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export const LineShape = memo(function LineShape({ obj, isSelected, onSelect, onDragMove, onDragEnd }: LineShapeProps) {
  const throttledDragMove = useMemo(
    () =>
      throttle((x: number, y: number) => {
        onDragMove(obj.id, x, y);
      }, 50),
    [obj.id, onDragMove],
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      throttledDragMove(e.target.x(), e.target.y());
    },
    [throttledDragMove],
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      onDragEnd(obj.id, e.target.x(), e.target.y());
    },
    [obj.id, onDragEnd],
  );

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onSelect(obj.id, shiftKey);
    },
    [obj.id, onSelect],
  );

  // Line renders from (0,0) to (width, height) relative to its position
  return (
    <KonvaLine
      id={obj.id}
      x={obj.x}
      y={obj.y}
      points={[0, 0, obj.width, obj.height]}
      stroke={isSelected ? '#6c63ff' : (obj.color || '#888')}
      strokeWidth={isSelected ? 3 : 2}
      hitStrokeWidth={12}
      rotation={obj.rotation}
      draggable
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      perfectDrawEnabled={false}
    />
  );
});
