import { memo, useRef, useCallback, useMemo } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { BoardObject } from '../../types/board';
import { throttle } from '../../utils/throttle';

interface TextShapeProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export const TextShape = memo(function TextShape({ obj, onSelect, onDragMove, onDragEnd, onDoubleClick, onHover }: TextShapeProps) {
  const textRef = useRef<Konva.Text>(null);

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

  const handleDblClick = useCallback(() => {
    onDoubleClick(obj.id);
  }, [obj.id, onDoubleClick]);

  return (
    <Text
      ref={textRef}
      id={obj.id}
      x={obj.x}
      y={obj.y}
      width={obj.width || undefined}
      text={obj.text || 'Text'}
      fontSize={18}
      fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fill={obj.color || '#e0e0e0'}
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
      perfectDrawEnabled={false}
    />
  );
});
