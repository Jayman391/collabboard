import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../hooks/useAuth';
import { useBoardSync } from '../hooks/useBoardSync';
import { useCursorBroadcast } from '../hooks/useCursorBroadcast';
import { useBoardStore } from '../stores/boardStore';
import { useViewportStore } from '../stores/viewportStore';
import { CanvasStage } from '../components/canvas/CanvasStage';
import type { CanvasStageHandle } from '../components/canvas/CanvasStage';
import { BoardObjects } from '../components/canvas/BoardObjects';
import { SelectionTransformer } from '../components/canvas/SelectionTransformer';
import { TextEditor } from '../components/canvas/TextEditor';
import { Toolbar } from '../components/ui/Toolbar';
import type { ToolType } from '../components/ui/Toolbar';
import { ColorPicker } from '../components/ui/ColorPicker';
import { OnlineUsers } from '../components/ui/OnlineUsers';
import { AIPanel } from '../components/ui/AIPanel';
import { ConnectionStatus } from '../components/ui/ConnectionStatus';
import { BoardHeader } from '../components/ui/BoardHeader';
import { ZoomControls } from '../components/ui/ZoomControls';
import { KeyboardShortcutsHelp } from '../components/ui/KeyboardShortcutsHelp';
import { useRealtimeChannel } from '../hooks/useRealtimeChannel';
import { supabase } from '../services/supabase';
import type { BoardObject } from '../types/board';
import type Konva from 'konva';

const STICKY_COLORS = ['#FDFD96', '#FFB7B2', '#B5EAD7', '#C7CEEA', '#FFD8B1'];

function createObjectAtPosition(boardId: string, type: BoardObject['type'], worldX: number, worldY: number): BoardObject {
  const now = new Date().toISOString();
  const base: BoardObject = {
    id: uuidv4(),
    board_id: boardId,
    type,
    x: worldX,
    y: worldY,
    width: 200,
    height: 200,
    rotation: 0,
    color: '#FDFD96',
    text: '',
    z_index: Date.now(),
    metadata: {},
    created_at: now,
    updated_at: now,
  };

  switch (type) {
    case 'sticky_note':
      base.color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
      base.width = 200;
      base.height = 200;
      // Center on click position
      base.x = worldX - 100;
      base.y = worldY - 100;
      break;
    case 'rectangle':
      base.color = '#4ECDC4';
      base.width = 250;
      base.height = 150;
      base.x = worldX - 125;
      base.y = worldY - 75;
      break;
    case 'circle':
      base.color = '#FF6B6B';
      base.width = 150;
      base.height = 150;
      base.x = worldX - 75;
      base.y = worldY - 75;
      break;
    case 'line':
      base.color = '#888888';
      base.width = 200;
      base.height = 0;
      base.x = worldX - 100;
      base.y = worldY;
      break;
    case 'text':
      base.color = '#e0e0e0';
      base.text = 'Double-click to edit';
      base.width = 200;
      base.height = 30;
      base.x = worldX - 100;
      base.y = worldY - 15;
      break;
    case 'frame':
      base.color = '#6c63ff';
      base.text = 'Frame';
      base.width = 400;
      base.height = 300;
      base.x = worldX - 200;
      base.y = worldY - 150;
      break;
  }

  return base;
}

export function BoardPage() {
  const { id: boardId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const canvasRef = useRef<CanvasStageHandle>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<BoardObject[]>([]);
  const [boardTitle, setBoardTitle] = useState('Untitled Board');

  // Tool placement state
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Connector drawing state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [connectingMouse, setConnectingMouse] = useState<{ x: number; y: number } | null>(null);

  const objects = useBoardStore((s) => s.objects);
  const isLoading = useBoardStore((s) => s.isLoading);

  // Resilient channel with auto-reconnection
  const { channel, onReconnect } = useRealtimeChannel(
    boardId && user ? `board:${boardId}` : '',
  );

  // Keep stageRef in sync with canvas ref
  useEffect(() => {
    stageRef.current = canvasRef.current?.getStage() ?? null;
  });

  // Load board title
  useEffect(() => {
    if (!boardId) return;
    supabase
      .from('boards')
      .select('title')
      .eq('id', boardId)
      .single()
      .then(({ data }) => {
        if (data?.title) setBoardTitle(data.title);
      });
  }, [boardId]);

  // Auto-join board as member (check first to avoid 409 spam)
  useEffect(() => {
    if (!boardId || !user) return;
    supabase
      .from('board_members')
      .select('board_id')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) return;
        supabase
          .from('board_members')
          .insert({ board_id: boardId, user_id: user.id, role: 'editor' })
          .then(({ error }) => {
            if (error && error.code !== '23505') console.error('Failed to join board:', error);
          });
      });
  }, [boardId, user]);

  const { createObject, syncUpdate, syncDelete, refreshObjects } = useBoardSync(boardId || '', channel);

  // On reconnection, re-fetch full board state to catch missed updates
  useEffect(() => {
    onReconnect(() => {
      refreshObjects();
    });
  }, [onReconnect, refreshObjects]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous';

  const { handleMouseMove: broadcastCursor } = useCursorBroadcast({
    channel,
    userId: user?.id || '',
    userName,
  });

  // Combined mouse move: broadcast cursor + track connector drawing
  const handleMouseMove = useCallback(
    (stageX: number, stageY: number) => {
      broadcastCursor(stageX, stageY);

      if (connectingFrom) {
        const { x, y, scale } = useViewportStore.getState();
        const worldX = (stageX - x) / scale;
        const worldY = (stageY - y) / scale;
        setConnectingMouse({ x: worldX, y: worldY });
      }
    },
    [broadcastCursor, connectingFrom],
  );

  // --- Tool selection ---
  const handleToolSelect = useCallback((tool: ToolType) => {
    setActiveTool(tool);
    // Clear selection when switching tools
    if (tool) {
      setSelectedIds(new Set());
      setEditingId(null);
    }
  }, []);

  // --- Placement click on canvas ---
  const handlePlacementClick = useCallback(
    (worldX: number, worldY: number) => {
      if (!activeTool || !boardId) return;
      const obj = createObjectAtPosition(boardId, activeTool, worldX, worldY);
      createObject(obj);
      setSelectedIds(new Set([obj.id]));
      // Deactivate tool after placing
      setActiveTool(null);
    },
    [activeTool, boardId, createObject],
  );

  // --- Selection ---
  const handleSelect = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      if (shiftKey) {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }
      return new Set([id]);
    });
  }, []);

  const handleDeselect = useCallback(() => {
    // If we're connecting, cancel it
    if (connectingFrom) {
      setConnectingFrom(null);
      setConnectingMouse(null);
      return;
    }
    setSelectedIds(new Set());
    setEditingId(null);
  }, [connectingFrom]);

  // --- Drag-to-select (rubber band) ---
  const handleSelectionRect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const allObjects = useBoardStore.getState().objects;
    const selected = new Set<string>();

    for (const obj of allObjects.values()) {
      if (
        obj.x < rect.x + rect.width &&
        obj.x + obj.width > rect.x &&
        obj.y < rect.y + rect.height &&
        obj.y + obj.height > rect.y
      ) {
        selected.add(obj.id);
      }
    }
    setSelectedIds(selected);
  }, []);

  // --- Connector drawing ---
  const handleConnectStart = useCallback((sourceId: string, _startX: number, _startY: number) => {
    setConnectingFrom(sourceId);
    setConnectingMouse(null);
  }, []);

  // When user releases mouse during connector drawing, check if over a shape
  const handleConnectEnd = useCallback(
    (worldX: number, worldY: number) => {
      if (!connectingFrom || !boardId) {
        setConnectingFrom(null);
        setConnectingMouse(null);
        return;
      }

      // Find the shape under the drop point
      const allObjects = useBoardStore.getState().objects;
      let targetId: string | null = null;

      for (const obj of allObjects.values()) {
        if (obj.id === connectingFrom) continue;
        if (obj.type === 'connector' || obj.type === 'line') continue;
        if (
          worldX >= obj.x &&
          worldX <= obj.x + obj.width &&
          worldY >= obj.y &&
          worldY <= obj.y + obj.height
        ) {
          targetId = obj.id;
          break;
        }
      }

      if (targetId) {
        const now = new Date().toISOString();
        const connObj: BoardObject = {
          id: uuidv4(),
          board_id: boardId,
          type: 'connector',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          color: '#888888',
          text: '',
          z_index: Date.now(),
          metadata: {
            fromId: connectingFrom,
            toId: targetId,
            style: 'arrow',
          },
          created_at: now,
          updated_at: now,
        };
        createObject(connObj);
      }

      setConnectingFrom(null);
      setConnectingMouse(null);
    },
    [connectingFrom, boardId, createObject],
  );

  // Get source shape center for temp connector line
  const connectingSource = connectingFrom ? objects.get(connectingFrom) : undefined;
  const tempConnectorLine = connectingSource && connectingMouse
    ? {
        fromX: connectingSource.x + connectingSource.width / 2,
        fromY: connectingSource.y + connectingSource.height / 2,
        toX: connectingMouse.x,
        toY: connectingMouse.y,
      }
    : null;

  // --- Drag handlers ---
  const handleDragMove = useCallback(
    (id: string, x: number, y: number) => {
      syncUpdate(id, { x, y });
    },
    [syncUpdate],
  );

  const handleDragEnd = useCallback(
    (id: string, x: number, y: number) => {
      syncUpdate(id, { x, y });
    },
    [syncUpdate],
  );

  // --- Transform handler ---
  const handleTransformEnd = useCallback(
    (obj: BoardObject) => {
      syncUpdate(obj.id, {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        rotation: obj.rotation,
      });
    },
    [syncUpdate],
  );

  // --- Text editing ---
  const handleDoubleClick = useCallback((id: string) => {
    const obj = useBoardStore.getState().getObject(id);
    if (obj?.type === 'sticky_note' || obj?.type === 'text' || obj?.type === 'frame') {
      setEditingId(id);
    }
  }, []);

  const handleTextSave = useCallback(
    (id: string, text: string) => {
      syncUpdate(id, { text });
    },
    [syncUpdate],
  );

  // --- Color change ---
  const handleColorChange = useCallback(
    (color: string) => {
      for (const id of selectedIds) {
        syncUpdate(id, { color });
      }
    },
    [selectedIds, syncUpdate],
  );

  // --- Delete ---
  const deleteSelected = useCallback(() => {
    for (const id of selectedIds) {
      syncDelete(id);
    }
    setSelectedIds(new Set());
  }, [selectedIds, syncDelete]);

  // --- Duplicate ---
  const duplicateSelected = useCallback(() => {
    const store = useBoardStore.getState();
    const newIds = new Set<string>();
    for (const id of selectedIds) {
      const orig = store.getObject(id);
      if (!orig) continue;
      const newObj: BoardObject = {
        ...orig,
        id: uuidv4(),
        x: orig.x + 20,
        y: orig.y + 20,
        z_index: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      createObject(newObj);
      newIds.add(newObj.id);
    }
    setSelectedIds(newIds);
  }, [selectedIds, createObject]);

  // --- Copy / Paste ---
  const copySelected = useCallback(() => {
    const store = useBoardStore.getState();
    const copied: BoardObject[] = [];
    for (const id of selectedIds) {
      const obj = store.getObject(id);
      if (obj) copied.push(obj);
    }
    setClipboard(copied);
  }, [selectedIds]);

  const paste = useCallback(() => {
    if (clipboard.length === 0) return;
    const newIds = new Set<string>();
    for (const orig of clipboard) {
      const newObj: BoardObject = {
        ...orig,
        id: uuidv4(),
        board_id: boardId || orig.board_id,
        x: orig.x + 40,
        y: orig.y + 40,
        z_index: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      createObject(newObj);
      newIds.add(newObj.id);
    }
    setSelectedIds(newIds);
    setClipboard((prev) =>
      prev.map((obj) => ({ ...obj, x: obj.x + 40, y: obj.y + 40 })),
    );
  }, [clipboard, boardId, createObject]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingId) return;
      const isMod = e.metaKey || e.ctrlKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          deleteSelected();
        }
      }
      if (e.key === 'Escape') {
        if (activeTool) {
          setActiveTool(null);
        } else if (connectingFrom) {
          setConnectingFrom(null);
          setConnectingMouse(null);
        } else {
          handleDeselect();
        }
      }
      if (isMod && e.key === 'd') {
        e.preventDefault();
        if (selectedIds.size > 0) duplicateSelected();
      }
      if (isMod && e.key === 'c') {
        if (selectedIds.size > 0) {
          e.preventDefault();
          copySelected();
        }
      }
      if (isMod && e.key === 'v') {
        e.preventDefault();
        paste();
      }
      if (isMod && e.key === 'a') {
        e.preventDefault();
        const allIds = new Set(useBoardStore.getState().objects.keys());
        setSelectedIds(allIds);
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowHelp((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected, editingId, selectedIds.size, handleDeselect, duplicateSelected, copySelected, paste, connectingFrom, activeTool]);

  // --- Auth guards ---
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#1a1a2e', color: '#a0a0b0' }}>
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!boardId) return <Navigate to="/boards" replace />;

  const editingObj = editingId ? objects.get(editingId) : undefined;
  const firstSelectedObj = selectedIds.size > 0 ? objects.get(Array.from(selectedIds)[0]) : undefined;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <CanvasStage
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleDeselect}
        onPlacementClick={handlePlacementClick}
        onSelectionRect={handleSelectionRect}
        onConnectEnd={handleConnectEnd}
        isConnecting={!!connectingFrom}
        isPlacing={!!activeTool}
        tempConnectorLine={tempConnectorLine}
        selectionLayer={
          <SelectionTransformer
            selectedIds={selectedIds}
            stageRef={stageRef}
            onTransformEnd={handleTransformEnd}
          />
        }
      >
        <BoardObjects
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDoubleClick={handleDoubleClick}
          onConnectStart={handleConnectStart}
          connectingFrom={connectingFrom}
        />
      </CanvasStage>

      <BoardHeader boardId={boardId} initialTitle={boardTitle} />
      <OnlineUsers />
      <ConnectionStatus channel={channel} />

      {firstSelectedObj && (
        <ColorPicker selectedColor={firstSelectedObj.color} onColorChange={handleColorChange} />
      )}

      <Toolbar
        boardId={boardId}
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        onDelete={deleteSelected}
        onDuplicate={duplicateSelected}
        hasSelection={selectedIds.size > 0}
      />

      {/* Active tool indicator */}
      {activeTool && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(26, 26, 46, 0.8)',
            color: '#e0e0e0',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            opacity: 0.8,
          }}
        >
          Click to place {activeTool.replace('_', ' ')} — Esc to cancel
        </div>
      )}

      {editingObj && (
        <TextEditor obj={editingObj} onSave={handleTextSave} onClose={() => setEditingId(null)} />
      )}

      <ZoomControls />
      <AIPanel boardId={boardId} onCommandComplete={refreshObjects} />
      {showHelp && <KeyboardShortcutsHelp onClose={() => setShowHelp(false)} />}

      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(26,26,46,0.7)',
          color: '#a0a0b0',
          zIndex: 100,
        }}>
          Loading board...
        </div>
      )}
    </div>
  );
}
