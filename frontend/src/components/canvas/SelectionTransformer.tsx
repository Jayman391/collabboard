import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { BoardObject } from '../../types/board';
import { useBoardStore } from '../../stores/boardStore';

interface SelectionTransformerProps {
  selectedIds: Set<string>;
  stageRef: React.RefObject<Konva.Stage | null>;
  onTransformEnd: (obj: BoardObject) => void;
}

export function SelectionTransformer({ selectedIds, stageRef, onTransformEnd }: SelectionTransformerProps) {
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    if (selectedIds.size === 0) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const nodes: Konva.Node[] = [];
    for (const id of selectedIds) {
      const node = stage.findOne(`#${id}`);
      if (node) nodes.push(node);
    }

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  const handleTransformEnd = (_e: KonvaEventObject<Event>) => {
    const tr = trRef.current;
    if (!tr) return;

    for (const node of tr.nodes()) {
      const id = node.id();
      const obj = useBoardStore.getState().getObject(id);
      if (!obj) continue;

      // Critical: normalize scale into width/height
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      const updated: BoardObject = {
        ...obj,
        x: node.x(),
        y: node.y(),
        width: Math.max(20, obj.width * scaleX),
        height: Math.max(20, obj.height * scaleY),
        rotation: node.rotation(),
        updated_at: new Date().toISOString(),
      };

      // Reset scale to 1 after baking into dimensions
      node.scaleX(1);
      node.scaleY(1);

      onTransformEnd(updated);
    }
  };

  if (selectedIds.size === 0) return null;

  return (
    <Transformer
      ref={trRef}
      onTransformEnd={handleTransformEnd}
      boundBoxFunc={(oldBox, newBox) => {
        // Minimum size constraint
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox;
        }
        return newBox;
      }}
      anchorSize={8}
      anchorCornerRadius={2}
      borderStroke="#6c63ff"
      anchorStroke="#6c63ff"
      anchorFill="#fff"
      keepRatio={false}
      enabledAnchors={[
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
        'middle-left', 'middle-right', 'top-center', 'bottom-center',
      ]}
    />
  );
}
