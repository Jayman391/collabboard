interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'Delete / Backspace', action: 'Delete selected objects' },
  { keys: '\u2318 + D', action: 'Duplicate selected' },
  { keys: '\u2318 + C', action: 'Copy selected' },
  { keys: '\u2318 + V', action: 'Paste' },
  { keys: '\u2318 + A', action: 'Select all' },
  { keys: 'Escape', action: 'Cancel / Deselect' },
  { keys: 'Scroll wheel', action: 'Zoom in / out' },
  { keys: 'Click + Drag', action: 'Pan canvas' },
  { keys: 'Shift + Click', action: 'Multi-select' },
  { keys: 'Double-click', action: 'Edit text' },
  { keys: '?', action: 'Toggle this help' },
];

export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1a2e',
          borderRadius: 12,
          padding: '24px 32px',
          border: '1px solid rgba(108,99,255,0.3)',
          minWidth: 340,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ color: '#e0e0e0', margin: 0, fontSize: 16, fontWeight: 600 }}>Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#a0a0b0', fontSize: 18, cursor: 'pointer' }}
          >
            x
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {SHORTCUTS.map(({ keys, action }) => (
              <tr key={keys}>
                <td style={{ padding: '6px 16px 6px 0', color: '#a0a0b0', fontSize: 13, whiteSpace: 'nowrap' }}>
                  <kbd style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#e0e0e0',
                  }}>
                    {keys}
                  </kbd>
                </td>
                <td style={{ padding: '6px 0', color: '#c0c0d0', fontSize: 13 }}>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
