import { create } from 'zustand';
import type { BoardObject } from '../types/board';

interface BoardState {
  objects: Map<string, BoardObject>;
  boardId: string | null;
  isLoading: boolean;

  setBoardId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setObjects: (objects: BoardObject[]) => void;
  addObject: (obj: BoardObject) => void;
  updateObject: (id: string, updates: Partial<BoardObject>) => void;
  deleteObject: (id: string) => void;
  applyRemoteUpdate: (obj: BoardObject) => void;
  getObject: (id: string) => BoardObject | undefined;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  objects: new Map(),
  boardId: null,
  isLoading: true,

  setBoardId: (id) => set({ boardId: id }),
  setLoading: (loading) => set({ isLoading: loading }),

  setObjects: (objects) => {
    const map = new Map<string, BoardObject>();
    for (const obj of objects) {
      map.set(obj.id, obj);
    }
    set({ objects: map, isLoading: false });
  },

  addObject: (obj) =>
    set((state) => {
      const next = new Map(state.objects);
      next.set(obj.id, obj);
      return { objects: next };
    }),

  updateObject: (id, updates) =>
    set((state) => {
      const existing = state.objects.get(id);
      if (!existing) return state;
      const next = new Map(state.objects);
      next.set(id, { ...existing, ...updates, updated_at: new Date().toISOString() });
      return { objects: next };
    }),

  deleteObject: (id) =>
    set((state) => {
      const next = new Map(state.objects);
      next.delete(id);
      return { objects: next };
    }),

  // Last-write-wins: only apply if remote is newer
  applyRemoteUpdate: (obj) =>
    set((state) => {
      const existing = state.objects.get(obj.id);
      if (existing && existing.updated_at >= obj.updated_at) {
        return state; // local is newer, skip
      }
      const next = new Map(state.objects);
      next.set(obj.id, obj);
      return { objects: next };
    }),

  getObject: (id) => get().objects.get(id),
}));
