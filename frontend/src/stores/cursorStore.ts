import { create } from 'zustand';
import type { CursorPosition, PresenceUser } from '../types/board';

interface CursorState {
  cursors: Map<string, CursorPosition>;
  onlineUsers: Map<string, PresenceUser>;
  setCursor: (userId: string, cursor: CursorPosition) => void;
  removeCursor: (userId: string) => void;
  setOnlineUsers: (users: Map<string, PresenceUser>) => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  cursors: new Map(),
  onlineUsers: new Map(),
  setCursor: (userId, cursor) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.set(userId, cursor);
      return { cursors: next };
    }),
  removeCursor: (userId) =>
    set((state) => {
      const next = new Map(state.cursors);
      next.delete(userId);
      return { cursors: next };
    }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));
