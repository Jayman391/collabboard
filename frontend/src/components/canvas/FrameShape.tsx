import { memo, useRef, useCallback, useMemo } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { BoardObject } from '../../types/board';
import { throttle } from '../../utils/throttle';

interface FrameShapeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onHover?: (id: string | null) => void;
}

const LABEL_HEIGHT = 28;

export const FrameShape = memo(function FrameShape({ obj, isSelected, onSelect, onDragMove, onDragEnd, onDoubleClick, onHover }: FrameShapeProps) {
  const groupRef = useRef<Konva.Group>(null);

  const throttledDragMove = useMemo(
    () =>
      throttle((x: number, y: number) => {
        onDragMove(obj.id, x, y);
      }, 50),
    [obj.id, onDragMove],
  );

  const handleDragMove = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      throttledDragMove(e.target.x(), e.target.y());
    },
    [throttledDragMove],
  );

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      onDragEnd(obj.id, e.target.x(), e.target.y());
    },
    [obj.id, onDragEnd],
  );

  const handleClick = useCallback(
    (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      const shiftKey = 'shiftKey' in e.evt ? e.evt.shiftKey : false;
      onSelect(obj.id, shiftKey);
    },
    [obj.id, onSelect],
  );

  const handleDblClick = useCallback(() => {
    onDoubleClick(obj.id);
  }, [obj.id, onDoubleClick]);

  return (
    <Group
      ref={groupRef}
      id={obj.id}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation}
      draggable
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      onMouseEnter={() => onHover?.(obj.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Label background */}
      <Rect
        width={obj.width}
        height={LABEL_HEIGHT}
        fill={obj.color}
        cornerRadius={[6, 6, 0, 0]}
        perfectDrawEnabled={false}
      />
      {/* Label text */}
      <Text
        text={obj.text || 'Frame'}
        x={8}
        y={6}
        width={obj.width - 16}
        height={LABEL_HEIGHT - 6}
        fontSize={13}
        fontStyle="bold"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fill="#fff"
        perfectDrawEnabled={false}
      />
      {/* Frame body */}
      <Rect
        y={LABEL_HEIGHT}
        width={obj.width}
        height={obj.height - LABEL_HEIGHT}
        fill={obj.color + '18'}
        stroke={obj.color}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={[0, 0, 6, 6]}
        dash={isSelected ? undefined : [6, 3]}
        perfectDrawEnabled={false}
      />
      {/* Selection indicator */}
      {isSelected && (
        <Rect
          width={obj.width}
          height={obj.height}
          stroke="#6c63ff"
          strokeWidth={2}
          cornerRadius={6}
          perfectDrawEnabled={false}
        />
      )}
    </Group>
  );
});
