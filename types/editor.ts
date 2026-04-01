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
  | 'soft-light';

export interface LayerItem {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
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
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  layers: LayerItem[];
  activeLayerId: string | null;
  brushSize: number;
  brushColor: string;
  isProcessing: boolean;
  history: string[];
  historyIndex: number;
  imageCounter: number;
  showNewCanvasDialog: boolean;
  canvasReady: boolean;
}

export interface EditorActions {
  setActiveTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setCanvasSize: (width: number, height: number) => void;
  addLayer: (layer: LayerItem) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<LayerItem>) => void;
  setActiveLayer: (id: string) => void;
  setBrushSize: (size: number) => void;
  setBrushColor: (color: string) => void;
  setIsProcessing: (val: boolean) => void;
  pushHistory: (state: string) => void;
  undo: () => void;
  redo: () => void;
  incrementImageCounter: () => number;
  setShowNewCanvasDialog: (val: boolean) => void;
  setCanvasReady: (val: boolean) => void;
}

export type EditorStore = EditorState & EditorActions;
