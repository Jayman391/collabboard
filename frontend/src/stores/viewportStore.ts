import { create } from 'zustand';

interface ViewportState {
  x: number;
  y: number;
  scale: number;
  setPosition: (x: number, y: number) => void;
  setScale: (scale: number) => void;
  setViewport: (x: number, y: number, scale: number) => void;
}

export const useViewportStore = create<ViewportState>((set) => ({
  x: 0,
  y: 0,
  scale: 1,
  setPosition: (x, y) => set({ x, y }),
  setScale: (scale) => set({ scale }),
  setViewport: (x, y, scale) => set({ x, y, scale }),
}));
