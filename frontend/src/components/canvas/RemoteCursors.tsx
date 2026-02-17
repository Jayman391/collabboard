import { Group, Line, Text, Rect } from 'react-konva';
import { Layer } from 'react-konva';
import { useCursorStore } from '../../stores/cursorStore';
import { useViewportStore } from '../../stores/viewportStore';

export function RemoteCursors() {
  const cursors = useCursorStore((s) => s.cursors);
  const scale = useViewportStore((s) => s.scale);

  // Label size stays constant regardless of zoom
  const labelScale = 1 / scale;

  return (
    <Layer listening={false}>
      {Array.from(cursors.values()).map((cursor) => (
        <Group key={cursor.userId} x={cursor.x} y={cursor.y}>
          {/* Cursor arrow */}
          <Line
            points={[0, 0, 4 * labelScale, 6 * labelScale, 0, 5 * labelScale]}
            fill={cursor.color}
            closed
            perfectDrawEnabled={false}
          />
          {/* Name label */}
          <Group x={8 * labelScale} y={8 * labelScale}>
            <Rect
              width={cursor.userName.length * 7 * labelScale + 8 * labelScale}
              height={18 * labelScale}
              fill={cursor.color}
              cornerRadius={3 * labelScale}
              perfectDrawEnabled={false}
            />
            <Text
              text={cursor.userName}
              fontSize={11 * labelScale}
              fill="white"
              x={4 * labelScale}
              y={3 * labelScale}
              perfectDrawEnabled={false}
            />
          </Group>
        </Group>
      ))}
    </Layer>
  );
}
