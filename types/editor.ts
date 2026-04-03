// ============================================================
// LadeStack Editor — Core Type Definitions
// ============================================================

export type ToolType =
  | 'select'
  | 'crop'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'eyedropper';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface LayerItem {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  type: string;
}

export interface CanvasPreset {
  label: string;
  width: number;
  height: number;
}

export type CanvasBackground = 'white' | 'transparent' | 'black';

export interface EditorState {
  activeTool: ToolType;
  previousTool: ToolType;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  layers: LayerItem[];
  activeLayerId: string | null;
  brushSize: number;
  brushColor: string;
  bgColor: string;
  isProcessing: boolean;
  history: string[];
  historyIndex: number;
  imageCounter: number;
  showNewCanvasDialog: boolean;
  canvasReady: boolean;
  isCropping: boolean;
  adjustments: AdjustmentsState;
  adjustmentTarget: AdjustmentTarget;
  activeFilterId: string;
  filterIntensity: number;
  effects: EffectsState;
  isEraseMaskMode: boolean;
  aiProcessingMessage: string;
  hasUnsavedChanges: boolean;
}

export interface EditorActions {
  setActiveTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  addLayer: (layer: LayerItem) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<LayerItem>) => void;
  setActiveLayer: (id: string) => void;
  setLayers: (layers: LayerItem[]) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setBgColor: (color: string) => void;
  swapColors: () => void;
  setIsProcessing: (val: boolean) => void;
  pushHistory: (state: string) => void;
  undo: () => void;
  redo: () => void;
  incrementImageCounter: () => number;
  setShowNewCanvasDialog: (val: boolean) => void;
  setCanvasReady: (val: boolean) => void;
  setIsCropping: (val: boolean) => void;
  setAdjustment: (key: AdjustmentKey, value: number) => void;
  resetAdjustments: () => void;
  resetAdjustmentSection: (section: AdjustmentSection) => void;
  setAdjustmentTarget: (target: AdjustmentTarget) => void;
  setActiveFilter: (id: string) => void;
  setFilterIntensity: (value: number) => void;
  setEffect: (key: string, config: Partial<EffectConfig> | Partial<DuotoneConfig> | boolean) => void;
  resetEffects: () => void;
  setIsEraseMaskMode: (val: boolean) => void;
  setAiProcessingMessage: (msg: string) => void;
  setHasUnsavedChanges: (val: boolean) => void;
  resetCanvasState: () => void;
}

// ── Adjustments ─────────────────────────────────────────
export interface AdjustmentsState {
  brightness: number;
  contrast: number;
  exposure: number;
  shadows: number;
  highlights: number;
  saturation: number;
  vibrance: number;
  hue: number;
  temperature: number;
  tint: number;
  sharpness: number;
  clarity: number;
  noiseReduction: number;
  vignetteAmount: number;
  vignetteMidpoint: number;
  vignetteFeather: number;
}

export type AdjustmentKey = keyof AdjustmentsState;

export type AdjustmentSection = 'tone' | 'color' | 'detail' | 'vignette';

export type AdjustmentTarget = 'selected' | 'all';

// ── Filters & Effects ───────────────────────────────────
export interface EffectConfig {
  enabled: boolean;
  value: number;
}

export interface DuotoneConfig {
  enabled: boolean;
  shadow: string;
  highlight: string;
}

export interface EffectsState {
  blur: EffectConfig;
  pixelate: EffectConfig;
  grain: EffectConfig;
  glitch: boolean;
  duotone: DuotoneConfig;
}

export type EditorStore = EditorState & EditorActions;
