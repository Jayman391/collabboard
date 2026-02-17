import { useEffect, useCallback, useMemo, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCursorStore } from '../stores/cursorStore';
import { useViewportStore } from '../stores/viewportStore';
import { getUserColor } from '../utils/colors';
import { throttle } from '../utils/throttle';
import type { CursorPosition, PresenceUser } from '../types/board';

interface UseCursorBroadcastProps {
  channel: RealtimeChannel | null;
  userId: string;
  userName: string;
}

export function useCursorBroadcast({ channel, userId, userName }: UseCursorBroadcastProps) {
  const setCursor = useCursorStore((s) => s.setCursor);
  const removeCursor = useCursorStore((s) => s.removeCursor);
  const setOnlineUsers = useCursorStore((s) => s.setOnlineUsers);
  const subscribedRef = useRef(false);

  // Subscribe to cursor broadcasts from other users
  useEffect(() => {
    if (!channel) return;
    subscribedRef.current = false;

    channel
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        const cursor = payload as CursorPosition;
        if (cursor.userId !== userId) {
          setCursor(cursor.userId, cursor);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = new Map<string, PresenceUser>();
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences.length > 0) {
            const user = presences[0];
            users.set(user.userId, user);
          }
        }
        setOnlineUsers(users);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const presence of leftPresences) {
          const user = presence as unknown as PresenceUser;
          removeCursor(user.userId);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
          await channel.track({
            userId,
            userName,
            color: getUserColor(userId),
          });
        }
      });
  }, [channel, userId, userName, setCursor, removeCursor, setOnlineUsers]);

  // Broadcast local cursor position (only when channel is fully joined)
  const broadcastCursor = useMemo(
    () =>
      throttle((worldX: number, worldY: number) => {
        if (!channel || !subscribedRef.current) return;
        // Double-check WebSocket is connected (prevents REST fallback)
        if ((channel as unknown as { state: string }).state !== 'joined') return;
        channel.send({
          type: 'broadcast',
          event: 'cursor',
          payload: {
            userId,
            userName,
            color: getUserColor(userId),
            x: worldX,
            y: worldY,
          } satisfies CursorPosition,
        });
      }, 50),
    [channel, userId, userName],
  );

  const handleMouseMove = useCallback(
    (stageX: number, stageY: number) => {
      // Convert screen coordinates to world coordinates
      const { x, y, scale } = useViewportStore.getState();
      const worldX = (stageX - x) / scale;
      const worldY = (stageY - y) / scale;
      broadcastCursor(worldX, worldY);
    },
    [broadcastCursor],
  );

  return { handleMouseMove };
}
