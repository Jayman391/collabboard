import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Board } from '../types/board';

export function BoardsPage() {
  const { user, loading: authLoading, userName, signOut } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareId, setShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const loadBoards = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load boards:', error);
    }
    setBoards(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadBoards();
  }, [user, loadBoards]);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-board-menu]')) {
        setMenuOpenId(null);
      }
      if (!target.closest('[data-share-modal]')) {
        setShareId(null);
        setCopied(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const createBoard = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('boards')
      .insert({ title: 'Untitled Board', created_by: user.id })
      .select()
      .single();

    if (error) {
      console.error('Failed to create board:', error);
      return;
    }
    navigate(`/board/${data.id}`);
  };

  const deleteBoard = async (id: string) => {
    // Delete board objects first, then the board
    await supabase.from('board_objects').delete().eq('board_id', id);
    await supabase.from('board_members').delete().eq('board_id', id);
    const { error } = await supabase.from('boards').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete board:', error);
      return;
    }
    setBoards((prev) => prev.filter((b) => b.id !== id));
    setConfirmDeleteId(null);
    setMenuOpenId(null);
  };

  const startRename = (board: Board) => {
    setRenamingId(board.id);
    setRenameValue(board.title);
    setMenuOpenId(null);
  };

  const saveRename = async () => {
    if (!renamingId) return;
    const trimmed = renameValue.trim() || 'Untitled Board';
    const { error } = await supabase.from('boards').update({ title: trimmed }).eq('id', renamingId);
    if (error) {
      console.error('Failed to rename board:', error);
    } else {
      setBoards((prev) => prev.map((b) => (b.id === renamingId ? { ...b, title: trimmed } : b)));
    }
    setRenamingId(null);
  };

  const openShare = (id: string) => {
    setShareId(id);
    setCopied(false);
    setMenuOpenId(null);
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/board/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #1a1a2e)', padding: 40 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ color: '#e0e0e0', fontSize: 28, marginBottom: 4 }}>CollabBoard</h1>
            <p style={{ color: '#a0a0b0', fontSize: 14 }}>Welcome, {userName}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createBoard} style={btnPrimary}>+ New Board</button>
            <button onClick={signOut} style={btnSecondary}>Sign Out</button>
          </div>
        </div>

        {/* Board list */}
        {loading ? (
          <p style={{ color: '#a0a0b0' }}>Loading boards...</p>
        ) : boards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#a0a0b0' }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No boards yet</p>
            <p>Create your first collaborative whiteboard</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {boards.map((board) => (
              <div
                key={board.id}
                style={{
                  background: 'var(--bg-surface, #0f3460)',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid rgba(108,99,255,0.2)',
                  transition: 'border-color 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6c63ff')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(108,99,255,0.2)')}
              >
                {/* Title — editable or clickable */}
                {renamingId === board.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={saveRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: '#e0e0e0',
                      border: '1px solid #6c63ff',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 16,
                      fontWeight: 600,
                      width: '100%',
                      outline: 'none',
                      marginBottom: 8,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3
                    onClick={() => navigate(`/board/${board.id}`)}
                    style={{ color: '#e0e0e0', marginBottom: 8, fontSize: 16, cursor: 'pointer' }}
                  >
                    {board.title}
                  </h3>
                )}

                <p style={{ color: '#a0a0b0', fontSize: 12 }}>
                  {new Date(board.created_at).toLocaleDateString()}
                </p>

                {/* Action buttons row */}
                <div style={{ display: 'flex', gap: 6, marginTop: 12, width: '100%' }}>
                  <SmallButton
                    label="Open"
                    onClick={(e) => { e.stopPropagation(); navigate(`/board/${board.id}`); }}
                  />
                  <SmallButton
                    label="Rename"
                    onClick={(e) => { e.stopPropagation(); startRename(board); }}
                  />
                  <SmallButton
                    label="Share"
                    onClick={(e) => { e.stopPropagation(); openShare(board.id); }}
                  />
                  <SmallButton
                    label="Delete"
                    danger
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(board.id); }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share modal */}
      {shareId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => { setShareId(null); setCopied(false); }}
        >
          <div
            data-share-modal
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              border: '1px solid rgba(108,99,255,0.3)',
              borderRadius: 16,
              padding: 24,
              minWidth: 400,
              maxWidth: 500,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ color: '#e0e0e0', marginBottom: 8, fontSize: 18 }}>Share Board</h3>
            <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 16 }}>
              Anyone with this link can join and edit the board.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                readOnly
                value={`${window.location.origin}/board/${shareId}`}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e0e0e0',
                  border: '1px solid rgba(108,99,255,0.2)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 13,
                  outline: 'none',
                }}
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={() => copyLink(shareId)}
                style={{
                  ...btnPrimary,
                  padding: '10px 18px',
                  minWidth: 80,
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => { setShareId(null); setCopied(false); }}
              style={{ ...btnSecondary, marginTop: 16, width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              border: '1px solid rgba(231,76,60,0.3)',
              borderRadius: 16,
              padding: 24,
              minWidth: 360,
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
          >
            <h3 style={{ color: '#e0e0e0', marginBottom: 8, fontSize: 18 }}>Delete Board?</h3>
            <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 20 }}>
              This will permanently delete the board and all its objects. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ ...btnSecondary, padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteBoard(confirmDeleteId)}
                style={{
                  background: 'rgba(231, 76, 60, 0.8)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  border: '1px solid rgba(231,76,60,0.5)',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---
const btnPrimary: React.CSSProperties = {
  background: '#6c63ff',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  background: 'rgba(255,255,255,0.1)',
  color: '#a0a0b0',
  padding: '10px 16px',
  borderRadius: 8,
  fontSize: 14,
  border: 'none',
  cursor: 'pointer',
};

function SmallButton({ label, onClick, danger }: { label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: danger ? 'rgba(231,76,60,0.15)' : 'rgba(108,99,255,0.15)',
        color: danger ? '#e74c3c' : '#a0a0b0',
        border: `1px solid ${danger ? 'rgba(231,76,60,0.2)' : 'rgba(108,99,255,0.2)'}`,
        borderRadius: 6,
        padding: '5px 0',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        textAlign: 'center' as const,
      }}
    >
      {label}
    </button>
  );
}

function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary, #1a1a2e)',
      color: '#a0a0b0',
    }}>
      Loading...
    </div>
  );
}
