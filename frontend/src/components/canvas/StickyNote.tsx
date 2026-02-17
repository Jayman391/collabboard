import { memo, useRef, useCallback, useMemo } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { BoardObject } from '../../types/board';
import { throttle } from '../../utils/throttle';

interface StickyNoteProps {
  obj: BoardObject;
  isSelected: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDoubleClick: (id: string) => void;
  onHover?: (id: string | null) => void;
}

const PADDING = 10;
const FONT_SIZE = 14;

export const StickyNote = memo(function StickyNote({ obj, isSelected, onSelect, onDragMove, onDragEnd, onDoubleClick, onHover }: StickyNoteProps) {
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
      <Rect
        width={obj.width}
        height={obj.height}
        fill={obj.color}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.15)"
        shadowBlur={isSelected ? 12 : 6}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={isSelected ? 0.4 : 0.2}
        stroke={isSelected ? '#6c63ff' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        perfectDrawEnabled={false}
      />
      <Text
        text={obj.text || 'Double-click to edit'}
        x={PADDING}
        y={PADDING}
        width={obj.width - PADDING * 2}
        height={obj.height - PADDING * 2}
        fontSize={FONT_SIZE}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fill={obj.text ? '#333' : '#999'}
        wrap="word"
        ellipsis
        perfectDrawEnabled={false}
      />
    </Group>
  );
});
