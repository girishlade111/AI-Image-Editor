import { create } from 'zustand';
import type { EditorStore, LayerItem, ToolType, AdjustmentKey, AdjustmentSection, AdjustmentTarget, AdjustmentsState, EffectsState, EffectConfig, DuotoneConfig } from '@/types/editor';

const DEFAULT_ADJUSTMENTS: AdjustmentsState = {
  brightness: 0, contrast: 0, exposure: 0,
  shadows: 0, highlights: 0,
  saturation: 0, vibrance: 0, hue: 0,
  temperature: 0, tint: 0,
  sharpness: 0, clarity: 0, noiseReduction: 0,
  vignetteAmount: 0, vignetteMidpoint: 50, vignetteFeather: 50,
};

const SECTION_KEYS: Record<AdjustmentSection, (keyof AdjustmentsState)[]> = {
  tone: ['brightness', 'contrast', 'exposure', 'shadows', 'highlights'],
  color: ['saturation', 'vibrance', 'hue', 'temperature', 'tint'],
  detail: ['sharpness', 'clarity', 'noiseReduction'],
  vignette: ['vignetteAmount', 'vignetteMidpoint', 'vignetteFeather'],
};

const DEFAULT_EFFECTS: EffectsState = {
  blur: { enabled: false, value: 0 },
  pixelate: { enabled: false, value: 1 },
  grain: { enabled: false, value: 0 },
  glitch: false,
  duotone: { enabled: false, shadow: '#000000', highlight: '#ffffff' },
};

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
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  adjustmentTarget: 'selected' as AdjustmentTarget,
  activeFilterId: 'none',
  filterIntensity: 100,
  effects: { ...DEFAULT_EFFECTS },

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

  reorderLayers: (fromIndex: number, toIndex: number) =>
    set((state) => {
      const newLayers = [...state.layers];
      const [moved] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, moved);
      return { layers: newLayers };
    }),

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

  setAdjustment: (key: AdjustmentKey, value: number) =>
    set((s) => ({ adjustments: { ...s.adjustments, [key]: value } })),

  resetAdjustments: () => set({ adjustments: { ...DEFAULT_ADJUSTMENTS } }),

  resetAdjustmentSection: (section: AdjustmentSection) =>
    set((s) => {
      const keys = SECTION_KEYS[section];
      const patch: Partial<AdjustmentsState> = {};
      for (const k of keys) patch[k] = DEFAULT_ADJUSTMENTS[k];
      return { adjustments: { ...s.adjustments, ...patch } };
    }),

  setAdjustmentTarget: (target: AdjustmentTarget) => set({ adjustmentTarget: target }),

  setActiveFilter: (id: string) => set({ activeFilterId: id }),
  setFilterIntensity: (value: number) => set({ filterIntensity: value }),

  setEffect: (key: string, config: Partial<EffectConfig> | Partial<DuotoneConfig> | boolean) =>
    set((s) => {
      if (key === 'glitch') {
        return { effects: { ...s.effects, glitch: config as boolean } };
      }
      const prev = s.effects[key as keyof Omit<EffectsState, 'glitch'>] as object;
      return { effects: { ...s.effects, [key]: { ...prev, ...(config as object) } } };
    }),

  resetEffects: () => set({ effects: { ...DEFAULT_EFFECTS }, activeFilterId: 'none', filterIntensity: 100 }),
}));
