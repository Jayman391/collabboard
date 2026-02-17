import { useRef, useCallback, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Rect, Arrow } from 'react-konva';
import type Konva from 'konva';
import { useViewportStore } from '../../stores/viewportStore';
import { BackgroundGrid } from './BackgroundGrid';
import { RemoteCursors } from './RemoteCursors';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_FACTOR = 1.1;

interface TempConnectorLine {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface CanvasStageProps {
  onMouseMove?: (stageX: number, stageY: number) => void;
  onClick?: () => void;
  onPlacementClick?: (worldX: number, worldY: number) => void;
  onSelectionRect?: (rect: { x: number; y: number; width: number; height: number }) => void;
  onConnectEnd?: (worldX: number, worldY: number) => void;
  isConnecting?: boolean;
  isPlacing?: boolean;
  tempConnectorLine?: TempConnectorLine | null;
  children?: React.ReactNode;
  selectionLayer?: React.ReactNode;
}

export interface CanvasStageHandle {
  getStage: () => Konva.Stage | null;
}

export const CanvasStage = forwardRef<CanvasStageHandle, CanvasStageProps>(
  ({ onMouseMove, onClick, onPlacementClick, onSelectionRect, onConnectEnd, isConnecting, isPlacing, tempConnectorLine, children, selectionLayer }, ref) => {
    const stageRef = useRef<Konva.Stage>(null);
    const { x, y, scale, setViewport } = useViewportStore();
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Drag-to-select state
    const [selRect, setSelRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const selStartRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingStageRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    useEffect(() => {
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Pointer-relative zoom
    const handleWheel = useCallback(
      (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const oldScale = scale;
        const direction = e.evt.deltaY < 0 ? 1 : -1;
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, direction > 0 ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR),
        );

        const newX = pointer.x - ((pointer.x - x) / oldScale) * newScale;
        const newY = pointer.y - ((pointer.y - y) / oldScale) * newScale;

        setViewport(newX, newY, newScale);
      },
      [x, y, scale, setViewport],
    );

    const handleDragEnd = useCallback(
      (e: Konva.KonvaEventObject<DragEvent>) => {
        if (e.target === stageRef.current) {
          setViewport(e.target.x(), e.target.y(), scale);
        }
      },
      [scale, setViewport],
    );

    const handleMouseMove = useCallback(
      (_e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current;
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        if (onMouseMove) {
          onMouseMove(pointer.x, pointer.y);
        }

        // Rubber band selection while dragging on empty space
        if (selStartRef.current && !isDraggingStageRef.current && !isConnecting && !isPlacing) {
          const { x: vx, y: vy, scale: sc } = useViewportStore.getState();
          const worldX = (pointer.x - vx) / sc;
          const worldY = (pointer.y - vy) / sc;
          const sx = selStartRef.current.x;
          const sy = selStartRef.current.y;
          setSelRect({
            x: Math.min(sx, worldX),
            y: Math.min(sy, worldY),
            width: Math.abs(worldX - sx),
            height: Math.abs(worldY - sy),
          });
        }
      },
      [onMouseMove, isConnecting, isPlacing],
    );

    const handleMouseDown = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target !== stageRef.current) return;
        if (e.evt.button !== 0) return;
        if (isConnecting || isPlacing) return;

        const stage = stageRef.current;
        if (!stage) return;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const { x: vx, y: vy, scale: sc } = useViewportStore.getState();
        const worldX = (pointer.x - vx) / sc;
        const worldY = (pointer.y - vy) / sc;

        selStartRef.current = { x: worldX, y: worldY };
        isDraggingStageRef.current = false;
      },
      [isConnecting, isPlacing],
    );

    const handleStageDragStart = useCallback(() => {
      isDraggingStageRef.current = true;
      selStartRef.current = null;
      setSelRect(null);
    }, []);

    const handleMouseUp = useCallback(
      (_e: Konva.KonvaEventObject<MouseEvent>) => {
        // Handle connector drop
        if (isConnecting && onConnectEnd) {
          const stage = stageRef.current;
          if (stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              const { x: vx, y: vy, scale: sc } = useViewportStore.getState();
              const worldX = (pointer.x - vx) / sc;
              const worldY = (pointer.y - vy) / sc;
              onConnectEnd(worldX, worldY);
            }
          }
        }

        // Handle selection rect
        if (selRect && onSelectionRect && selRect.width > 5 && selRect.height > 5) {
          onSelectionRect(selRect);
        }
        selStartRef.current = null;
        setSelRect(null);
      },
      [selRect, onSelectionRect, isConnecting, onConnectEnd],
    );

    const handleClick = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target !== stageRef.current) return;

        // Placement mode: create object at click position
        if (isPlacing && onPlacementClick) {
          const stage = stageRef.current;
          if (stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              const { x: vx, y: vy, scale: sc } = useViewportStore.getState();
              const worldX = (pointer.x - vx) / sc;
              const worldY = (pointer.y - vy) / sc;
              onPlacementClick(worldX, worldY);
              return;
            }
          }
        }

        if (onClick) {
          onClick();
        }
      },
      [onClick, isPlacing, onPlacementClick],
    );

    const cursor = isConnecting ? 'crosshair' : isPlacing ? 'crosshair' : 'default';

    return (
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        x={x}
        y={y}
        scaleX={scale}
        scaleY={scale}
        draggable={!isConnecting && !isPlacing}
        onWheel={handleWheel}
        onDragStart={handleStageDragStart}
        onDragEnd={handleDragEnd}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        style={{ background: '#f5f5f0', cursor }}
      >
        <BackgroundGrid width={dimensions.width} height={dimensions.height} />
        <Layer>
          {children}
          {selectionLayer}
          {/* Rubber band selection rectangle */}
          {selRect && (
            <Rect
              x={selRect.x}
              y={selRect.y}
              width={selRect.width}
              height={selRect.height}
              fill="rgba(108, 99, 255, 0.1)"
              stroke="#6c63ff"
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
              listening={false}
              perfectDrawEnabled={false}
            />
          )}
          {/* Temporary connector line while drawing */}
          {tempConnectorLine && (
            <Arrow
              points={[
                tempConnectorLine.fromX,
                tempConnectorLine.fromY,
                tempConnectorLine.toX,
                tempConnectorLine.toY,
              ]}
              stroke="#6c63ff"
              strokeWidth={2 / scale}
              fill="#6c63ff"
              pointerLength={10 / scale}
              pointerWidth={8 / scale}
              dash={[6 / scale, 4 / scale]}
              listening={false}
              perfectDrawEnabled={false}
            />
          )}
        </Layer>
        <RemoteCursors />
      </Stage>
    );
  },
);
