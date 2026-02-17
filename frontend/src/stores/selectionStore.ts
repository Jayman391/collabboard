import { create } from 'zustand';

interface SelectionState {
  selectedIds: Set<string>;
  select: (id: string, multi: boolean) => void;
  deselect: () => void;
  setSelected: (ids: Set<string>) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: new Set(),

  select: (id, multi) =>
    set((state) => {
      if (multi) {
        const next = new Set(state.selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedIds: next };
      }
      return { selectedIds: new Set([id]) };
    }),

  deselect: () => set({ selectedIds: new Set() }),

  setSelected: (ids) => set({ selectedIds: ids }),
}));
