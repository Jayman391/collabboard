import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

interface BoardHeaderProps {
  boardId: string;
  initialTitle: string;
}

export function BoardHeader({ boardId, initialTitle }: BoardHeaderProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveTitle = useCallback(async () => {
    setIsEditing(false);
    const trimmed = title.trim() || 'Untitled Board';
    setTitle(trimmed);
    await supabase.from('boards').update({ title: trimmed }).eq('id', boardId);
  }, [boardId, title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveTitle();
      if (e.key === 'Escape') {
        setTitle(initialTitle);
        setIsEditing(false);
      }
    },
    [saveTitle, initialTitle],
  );

  const shareUrl = window.location.href;

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 10,
      }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/boards')}
        title="Back to boards"
        style={{
          background: 'rgba(26, 26, 46, 0.9)',
          color: '#e0e0e0',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        &#8592;
      </button>

      {/* Board title */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={handleKeyDown}
          style={{
            background: 'rgba(26, 26, 46, 0.9)',
            color: '#e0e0e0',
            border: '1px solid #6c63ff',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 14,
            fontWeight: 600,
            outline: 'none',
            minWidth: 150,
            backdropFilter: 'blur(8px)',
          }}
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          title="Click to rename"
          style={{
            background: 'rgba(26, 26, 46, 0.9)',
            color: '#e0e0e0',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          {title}
        </button>
      )}

      {/* Share button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowShare(!showShare)}
          title="Share board"
          style={{
            background: showShare ? '#6c63ff' : 'rgba(26, 26, 46, 0.9)',
            color: '#e0e0e0',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          Share
        </button>

        {showShare && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 8,
              background: 'rgba(26, 26, 46, 0.95)',
              border: '1px solid rgba(108,99,255,0.3)',
              borderRadius: 12,
              padding: 16,
              minWidth: 300,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ color: '#a0a0b0', fontSize: 12, marginBottom: 8 }}>
              Anyone with this link can join and edit the board:
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                readOnly
                value={shareUrl}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e0e0e0',
                  border: '1px solid rgba(108,99,255,0.2)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 12,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={copyLink}
                style={{
                  background: '#6c63ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
