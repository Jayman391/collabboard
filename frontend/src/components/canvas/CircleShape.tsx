import { memo, useRef, useCallback, useMemo } from 'react';
import { Circle } from 'react-konva';
import type Konva from 'konva';
import type { BoardObject } from '../../types/board';
import { throttle } from '../../utils/throttle';

interface CircleShapeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export const CircleShape = memo(function CircleShape({ obj, isSelected, onSelect, onDragMove, onDragEnd, onHover }: CircleShapeProps) {
  const circleRef = useRef<Konva.Circle>(null);
  const radius = Math.min(obj.width, obj.height) / 2;

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

  return (
    <Circle
      ref={circleRef}
      id={obj.id}
      x={obj.x + radius}
      y={obj.y + radius}
      radius={radius}
      rotation={obj.rotation}
      fill={obj.color}
      stroke={isSelected ? '#6c63ff' : '#888'}
      strokeWidth={isSelected ? 2 : 1}
      draggable
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={() => onHover?.(obj.id)}
      onMouseLeave={() => onHover?.(null)}
      perfectDrawEnabled={false}
    />
  );
});
