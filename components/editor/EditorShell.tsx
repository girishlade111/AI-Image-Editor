'use client';

import React, { useCallback, useState, useRef } from 'react';
import TopBar from './TopBar';
import Toolbar from './Toolbar';
import EditorCanvas from './EditorCanvas';
import LayersPanel from './LayersPanel';
import AdjustmentsPanel from './AdjustmentsPanel';
import FiltersPanel from './FiltersPanel';
import PropertiesPanel from './PropertiesPanel';
import AIToolsPanel from './AIToolsPanel';
import AILoadingOverlay from './AILoadingOverlay';
import NewCanvasDialog from './NewCanvasDialog';
import CanvasResizeModal from './CanvasResizeModal';
import ExportDialog from './ExportDialog';
import { useEditorStore } from '@/store/useEditorStore';
import { CanvasProvider, useCanvasContext } from '@/contexts/CanvasContext';
import { Toaster, toast } from 'react-hot-toast';

export const successToast = (msg: string) => toast.success(msg);
export const errorToast = (msg: string) => toast.error(msg);
export const infoToast = (msg: string) => toast(msg);

const TABS = [
  { id: 'layers', label: 'Layers' },
  { id: 'adjust', label: 'Adjust' },
  { id: 'filters', label: 'Filters' },
  { id: 'ai', label: 'AI' },
  { id: 'properties', label: 'Props' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function EditorShell() {
  const showNewCanvasDialog = useEditorStore((s) => s.showNewCanvasDialog);
  const setShowNewCanvasDialog = useEditorStore((s) => s.setShowNewCanvasDialog);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);

  const [canvasKey, setCanvasKey] = useState(0);
  const [pendingCanvas, setPendingCanvas] = useState<{
    width: number;
    height: number;
    bg: string;
  } | null>(null);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleCreateCanvas = useCallback(
    (width: number, height: number, bg: string) => {
      setCanvasSize(width, height);
      setPendingCanvas({ width, height, bg });
      setShowNewCanvasDialog(false);
      setCanvasKey((k) => k + 1);
    },
    [setCanvasSize, setShowNewCanvasDialog]
  );

  const handleCloseDialog = useCallback(() => {
    setShowNewCanvasDialog(false);
  }, [setShowNewCanvasDialog]);

  return (
    <CanvasProvider>
      <EditorShellInner
        canvasKey={canvasKey}
        showNewCanvasDialog={showNewCanvasDialog}
        showResizeModal={showResizeModal}
        showExportDialog={showExportDialog}
        setShowResizeModal={setShowResizeModal}
        setShowExportDialog={setShowExportDialog}
        handleCloseDialog={handleCloseDialog}
        handleCreateCanvas={handleCreateCanvas}
      />
    </CanvasProvider>
  );
}

function EditorShellInner({
  canvasKey,
  showNewCanvasDialog,
  showResizeModal,
  showExportDialog,
  setShowResizeModal,
  setShowExportDialog,
  handleCloseDialog,
  handleCreateCanvas,
}: {
  canvasKey: number;
  showNewCanvasDialog: boolean;
  showResizeModal: boolean;
  showExportDialog: boolean;
  setShowResizeModal: (v: boolean) => void;
  setShowExportDialog: (v: boolean) => void;
  handleCloseDialog: () => void;
  handleCreateCanvas: (width: number, height: number, bg: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<TabId>('layers');

  const addLayer = useEditorStore((s) => s.addLayer);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const incrementImageCounter = useEditorStore((s) => s.incrementImageCounter);
  const setHasUnsavedChanges = useEditorStore((s) => s.setHasUnsavedChanges);
  const setLayers = useEditorStore((s) => s.setLayers);
  const setAdjustment = useEditorStore((s) => s.setAdjustment);
  const store = useEditorStore();
  const { canvasRef } = useCanvasContext();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectInputRef = useRef<HTMLInputElement | null>(null);

  const serializeCanvas = useCallback((canvas: any) => {
    return JSON.stringify(canvas.toJSON(['id', 'name', 'layerId']));
  }, []);

  const loadImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;
      const { addImageToCanvas } = await import('@/lib/fabricHelpers');
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const img = await addImageToCanvas(canvas, dataUrl);
        const { generateLayerId } = await import('@/lib/fabricHelpers');
        const layerId = generateLayerId();
        (img as any).__layerId = layerId;
        addLayer({
          id: layerId,
          name: `Image ${incrementImageCounter()}`,
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'normal',
          type: 'image',
        });
        pushHistory(serializeCanvas(canvas));
        setHasUnsavedChanges(true);
      } catch (err) {
        console.error('Failed to load image:', err);
      }
    };
    reader.readAsDataURL(file);
  }, [canvasRef, addLayer, pushHistory, incrementImageCounter, setHasUnsavedChanges, serializeCanvas]);

  const loadProjectFile = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const state = JSON.parse(e.target?.result as string);
        const canvas = canvasRef.current;
        if (!canvas || !state.canvasJSON) return;

        canvas.loadFromJSON(state.canvasJSON, () => {
          canvas.renderAll();
          canvas.setWidth(state.canvasWidth);
          canvas.setHeight(state.canvasHeight);
          canvas.renderAll();

          if (state.layers) setLayers(state.layers);
          if (state.adjustments) {
            Object.entries(state.adjustments).forEach(([key, value]) => {
              setAdjustment(key as any, value as number);
            });
          }

          pushHistory(serializeCanvas(canvas));
          setHasUnsavedChanges(false);
        });
      } catch (err) {
        console.error('Failed to load project:', err);
      }
    };
    reader.readAsText(file);
  }, [canvasRef, setLayers, setAdjustment, pushHistory, setHasUnsavedChanges, serializeCanvas]);

  const saveProject = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = {
      version: '1.0',
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasJSON: canvas.toJSON(['id', 'name', 'layerId']),
      layers: store.layers,
      adjustments: store.adjustments,
      savedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'ladestack-project.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    successToast('Project saved!');
  }, [canvasRef, store.layers, store.adjustments]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-metal-900">
      <TopBar
        onOpenImage={() => fileInputRef.current?.click()}
        onOpenProject={() => projectInputRef.current?.click()}
        onSaveProject={saveProject}
        onExport={() => setShowExportDialog(true)}
        onResizeCanvas={() => setShowResizeModal(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg,.bmp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadImageFile(file);
          e.target.value = '';
        }}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) loadProjectFile(file);
          e.target.value = '';
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar />

        <div className="relative flex-1 overflow-hidden bg-metal-800">
          <EditorCanvas key={canvasKey} />
        </div>

        {/* Right panel — 280px with metallic finish and tabs */}
        <div className="flex w-[280px] flex-col border-l border-white/[0.04] bg-metal-panel">
          {/* Tab bar — metallic with subtle gradient */}
          <div className="flex border-b border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 px-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'text-white/85'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <>
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] shadow-[0_0_8px_rgba(233,69,96,0.4)]" />
                    <span className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#e94560]/20 to-transparent" />
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'layers' && <LayersPanel />}
            {activeTab === 'adjust' && <AdjustmentsPanel />}
            {activeTab === 'filters' && <FiltersPanel />}
            {activeTab === 'ai' && <AIToolsPanel />}
            {activeTab === 'properties' && <PropertiesPanel />}
          </div>
        </div>
      </div>

      <AILoadingOverlay />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(22, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
            color: '#e2e8f0',
            fontSize: '12px',
            borderRadius: '12px',
          },
        }}
      />
      <CanvasResizeModal
        open={showResizeModal}
        onClose={() => setShowResizeModal(false)}
      />
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
      <NewCanvasDialog
        open={showNewCanvasDialog}
        onClose={handleCloseDialog}
        onCreateCanvas={handleCreateCanvas}
      />
    </div>
  );
}
