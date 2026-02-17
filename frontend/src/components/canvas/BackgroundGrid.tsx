import { Circle, Group, Layer } from 'react-konva';
import { useViewportStore } from '../../stores/viewportStore';

const DOT_SPACING = 30;
const DOT_RADIUS = 1.5;
const DOT_COLOR = '#d0d0d0';

export function BackgroundGrid({ width, height }: { width: number; height: number }) {
  const { x, y, scale } = useViewportStore();

  // Calculate visible area in world coordinates
  const startX = Math.floor(-x / scale / DOT_SPACING) * DOT_SPACING;
  const startY = Math.floor(-y / scale / DOT_SPACING) * DOT_SPACING;
  const endX = startX + Math.ceil(width / scale / DOT_SPACING + 2) * DOT_SPACING;
  const endY = startY + Math.ceil(height / scale / DOT_SPACING + 2) * DOT_SPACING;

  const dots: { x: number; y: number }[] = [];
  for (let gx = startX; gx <= endX; gx += DOT_SPACING) {
    for (let gy = startY; gy <= endY; gy += DOT_SPACING) {
      dots.push({ x: gx, y: gy });
    }
  }

  return (
    <Layer listening={false}>
      <Group>
        {dots.map((dot, i) => (
          <Circle
            key={i}
            x={dot.x}
            y={dot.y}
            radius={DOT_RADIUS / scale}
            fill={DOT_COLOR}
            perfectDrawEnabled={false}
          />
        ))}
      </Group>
    </Layer>
  );
}
