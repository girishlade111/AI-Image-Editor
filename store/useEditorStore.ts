import { create } from 'zustand';
import type { EditorStore, LayerItem, ToolType } from '@/types/editor';

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorStore>((set, get) => ({
  // ── State ───────────────────────────────────────────────
  activeTool: 'select',
  previousTool: 'select',
  zoom: 1,
  canvasWidth: 800,
  canvasHeight: 600,
  layers: [],
  activeLayerId: null,
  brushSize: 5,
  brushColor: '#000000',
  bgColor: '#ffffff',
  isProcessing: false,
  history: [],
  historyIndex: -1,
  imageCounter: 0,
  showNewCanvasDialog: true,
  canvasReady: false,
  isCropping: false,

  // ── Actions ─────────────────────────────────────────────
  setActiveTool: (tool: ToolType) =>
    set((s) => ({ activeTool: tool, previousTool: s.activeTool })),

  setZoom: (zoom: number) =>
    set({ zoom: Math.max(0.05, Math.min(30, zoom)) }),

  setCanvasSize: (width: number, height: number) =>
    set({ canvasWidth: width, canvasHeight: height }),

  addLayer: (layer: LayerItem) =>
    set((state) => ({
      layers: [...state.layers, layer],
      activeLayerId: layer.id,
    })),

  removeLayer: (id: string) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId:
        state.activeLayerId === id
          ? state.layers.find((l) => l.id !== id)?.id ?? null
          : state.activeLayerId,
    })),

  updateLayer: (id: string, updates: Partial<LayerItem>) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  setActiveLayer: (id: string) => set({ activeLayerId: id }),

  setBrushSize: (size: number) =>
    set({ brushSize: Math.max(1, Math.min(200, size)) }),

  setBrushColor: (color: string) => set({ brushColor: color }),

  setBgColor: (color: string) => set({ bgColor: color }),

  swapColors: () => {
    const { brushColor, bgColor } = get();
    set({ brushColor: bgColor, bgColor: brushColor });
  },

  setIsProcessing: (val: boolean) => set({ isProcessing: val }),

  pushHistory: (snapshot: string) => {
    const { history, historyIndex } = get();
    const trimmed = history.slice(0, historyIndex + 1);
    const next = [...trimmed, snapshot];
    if (next.length > MAX_HISTORY) next.shift();
    set({ history: next, historyIndex: next.length - 1 });
  },

  undo: () => {
    const { historyIndex } = get();
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({ historyIndex: historyIndex + 1 });
    }
  },

  incrementImageCounter: () => {
    const current = get().imageCounter + 1;
    set({ imageCounter: current });
    return current;
  },

  setShowNewCanvasDialog: (val: boolean) => set({ showNewCanvasDialog: val }),
  setCanvasReady: (val: boolean) => set({ canvasReady: val }),
  setIsCropping: (val: boolean) => set({ isCropping: val }),
}));
