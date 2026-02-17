import type { BoardObject } from '../../types/board';

export type ToolType = BoardObject['type'] | null;

interface ToolbarProps {
  boardId: string;
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  hasSelection: boolean;
}

const TOOLS: { type: BoardObject['type']; label: string; icon: string }[] = [
  { type: 'sticky_note', label: 'Sticky Note', icon: 'S' },
  { type: 'rectangle', label: 'Rectangle', icon: 'R' },
  { type: 'circle', label: 'Circle', icon: 'O' },
  { type: 'line', label: 'Line', icon: '/' },
  { type: 'text', label: 'Text', icon: 'T' },
  { type: 'frame', label: 'Frame', icon: 'F' },
];

export function Toolbar({ activeTool, onToolSelect, onDelete, onDuplicate, hasSelection }: ToolbarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        background: 'rgba(26, 26, 46, 0.9)',
        borderRadius: 12,
        padding: '8px 12px',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.type}
          onClick={() => onToolSelect(activeTool === tool.type ? null : tool.type)}
          label={tool.label}
          icon={tool.icon}
          active={activeTool === tool.type}
        />
      ))}
      <Divider />
      {hasSelection && (
        <>
          <ToolButton onClick={onDuplicate} label="Duplicate" icon="D" />
          <ToolButton onClick={onDelete} label="Delete" icon="X" danger />
        </>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', margin: '2px 4px' }} />
  );
}

function ToolButton({
  onClick,
  label,
  icon,
  danger,
  active,
}: {
  onClick: () => void;
  label: string;
  icon: string;
  danger?: boolean;
  active?: boolean;
}) {
  const bg = danger
    ? 'rgba(231, 76, 60, 0.3)'
    : active
      ? 'rgba(108, 99, 255, 0.6)'
      : 'rgba(108, 99, 255, 0.2)';
  const border = danger
    ? 'rgba(231,76,60,0.3)'
    : active
      ? '#6c63ff'
      : 'rgba(108,99,255,0.3)';

  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: bg,
        color: danger ? '#e74c3c' : '#e0e0e0',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 13,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${border}`,
        cursor: 'pointer',
        minWidth: 0,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
