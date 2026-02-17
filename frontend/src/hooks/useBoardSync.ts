import { useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { useBoardStore } from '../stores/boardStore';
import type { BoardObject } from '../types/board';

export function useBoardSync(boardId: string, channel: RealtimeChannel | null) {
  const { setObjects, addObject, updateObject, deleteObject, applyRemoteUpdate, setLoading } = useBoardStore();
  const channelRef = useRef(channel);
  channelRef.current = channel;

  // Load initial board objects
  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    supabase
      .from('board_objects')
      .select('*')
      .eq('board_id', boardId)
      .order('z_index', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load board objects:', error);
          setLoading(false);
          return;
        }
        setObjects(data || []);
      });
  }, [boardId, setObjects, setLoading]);

  // Listen for broadcast events from peers + handle reconnection + AI refresh
  useEffect(() => {
    if (!channel || !boardId) return;

    channel
      .on('broadcast', { event: 'object_create' }, ({ payload }) => {
        applyRemoteUpdate(payload as BoardObject);
      })
      .on('broadcast', { event: 'object_update' }, ({ payload }) => {
        applyRemoteUpdate(payload as BoardObject);
      })
      .on('broadcast', { event: 'object_delete' }, ({ payload }) => {
        deleteObject((payload as { id: string }).id);
      })
      .on('broadcast', { event: 'board_refresh' }, () => {
        // Another user's AI command completed — re-fetch the full board state
        supabase
          .from('board_objects')
          .select('*')
          .eq('board_id', boardId)
          .order('z_index', { ascending: true })
          .then(({ data }) => {
            if (data) setObjects(data);
          });
      });
  }, [channel, boardId, applyRemoteUpdate, deleteObject, setObjects]);

  // Helper: only send if channel is subscribed (avoids REST fallback warning)
  const safeSend = useCallback((event: string, payload: unknown) => {
    const ch = channelRef.current;
    if (!ch) return;
    // RealtimeChannel.state is 'joined' when subscribed
    if ((ch as unknown as { state: string }).state === 'joined') {
      ch.send({ type: 'broadcast', event, payload });
    }
  }, []);

  // Create object: optimistic UI → broadcast → DB write
  const createObject = useCallback(
    async (obj: BoardObject) => {
      addObject(obj);
      safeSend('object_create', obj);

      const { error } = await supabase.from('board_objects').insert(obj);
      if (error) console.error('DB insert failed:', error);
    },
    [addObject, safeSend],
  );

  // Update object: optimistic UI → broadcast → DB write
  const syncUpdate = useCallback(
    async (id: string, updates: Partial<BoardObject>) => {
      const updatedAt = new Date().toISOString();
      const fullUpdates = { ...updates, updated_at: updatedAt };
      updateObject(id, fullUpdates);

      const current = useBoardStore.getState().getObject(id);
      if (current) {
        safeSend('object_update', current);
      }

      const { error } = await supabase
        .from('board_objects')
        .update(fullUpdates)
        .eq('id', id);
      if (error) console.error('DB update failed:', error);
    },
    [updateObject, safeSend],
  );

  // Delete object: optimistic UI → broadcast → DB delete
  const syncDelete = useCallback(
    async (id: string) => {
      deleteObject(id);
      safeSend('object_delete', { id });

      const { error } = await supabase
        .from('board_objects')
        .delete()
        .eq('id', id);
      if (error) console.error('DB delete failed:', error);
    },
    [deleteObject, safeSend],
  );

  // Re-fetch all objects from DB and broadcast refresh to other users
  const refreshObjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('board_objects')
      .select('*')
      .eq('board_id', boardId)
      .order('z_index', { ascending: true });
    if (error) {
      console.error('Failed to refresh board objects:', error);
      return;
    }
    setObjects(data || []);
    // Signal other users to refresh too (AI commands write directly to DB)
    safeSend('board_refresh', {});
  }, [boardId, setObjects, safeSend]);

  return { createObject, syncUpdate, syncDelete, refreshObjects };
}
