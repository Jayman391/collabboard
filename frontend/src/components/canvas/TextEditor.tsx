import { useRef, useEffect, useCallback } from 'react';
import type { BoardObject } from '../../types/board';
import { useViewportStore } from '../../stores/viewportStore';

interface TextEditorProps {
  obj: BoardObject;
  onSave: (id: string, text: string) => void;
  onClose: () => void;
}

export function TextEditor({ obj, onSave, onClose }: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { x, y, scale } = useViewportStore();

  // Calculate screen position from world coordinates
  const screenX = obj.x * scale + x;
  const screenY = obj.y * scale + y;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      textarea.value = obj.text || '';
      // Place cursor at end
      textarea.selectionStart = textarea.value.length;
    }
  }, [obj.text]);

  const handleBlur = useCallback(() => {
    const text = textareaRef.current?.value ?? '';
    onSave(obj.id, text);
    onClose();
  }, [obj.id, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // Stop propagation to prevent canvas keyboard shortcuts
      e.stopPropagation();
    },
    [onClose],
  );

  return (
    <textarea
      ref={textareaRef}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        position: 'absolute',
        left: screenX + 8 * scale,
        top: screenY + 8 * scale,
        width: (obj.width - 16) * scale,
        height: (obj.height - 16) * scale,
        fontSize: 14 * scale,
        fontFamily: 'sans-serif',
        color: '#333',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: '1.4',
        zIndex: 100,
      }}
    />
  );
}
