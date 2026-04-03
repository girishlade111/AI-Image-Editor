'use client';

import React, { useCallback, useState } from 'react';
import TopBar from './TopBar';
import Toolbar from './Toolbar';
import EditorCanvas from './EditorCanvas';
import LayersPanel from './LayersPanel';
import AdjustmentsPanel from './AdjustmentsPanel';
import FiltersPanel from './FiltersPanel';
import PropertiesPanel from './PropertiesPanel';
import NewCanvasDialog from './NewCanvasDialog';
import { useEditorStore } from '@/store/useEditorStore';
import { CanvasProvider } from '@/contexts/CanvasContext';

const TABS = [
  { id: 'layers', label: 'Layers' },
  { id: 'adjust', label: 'Adjust' },
  { id: 'filters', label: 'Filters' },
  { id: 'properties', label: 'Props' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function EditorShell() {
  const showNewCanvasDialog = useEditorStore((s) => s.showNewCanvasDialog);
  const setShowNewCanvasDialog = useEditorStore((s) => s.setShowNewCanvasDialog);
  const setCanvasSize = useEditorStore((s) => s.setCanvasSize);
  const [canvasKey, setCanvasKey] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('layers');
  const [pendingCanvas, setPendingCanvas] = useState<{
    width: number;
    height: number;
    bg: string;
  } | null>(null);

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#1a1a2e]">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <Toolbar />

        <div className="relative flex-1 overflow-hidden">
          <EditorCanvas key={canvasKey} />
        </div>

        {/* Right panel — 280px with tabs */}
        <div className="flex w-[280px] flex-col border-l border-white/[0.06] bg-[#16213e]">
          {/* Tab bar */}
          <div className="flex border-b border-white/[0.06]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 px-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? 'text-white/80'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-[#e94560]" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'layers' && <LayersPanel />}
            {activeTab === 'adjust' && <AdjustmentsPanel />}
            {activeTab === 'filters' && <FiltersPanel />}
            {activeTab === 'properties' && <PropertiesPanel />}
          </div>
        </div>
      </div>

      <NewCanvasDialog
        open={showNewCanvasDialog}
        onClose={handleCloseDialog}
        onCreateCanvas={handleCreateCanvas}
      />
    </div>
    </CanvasProvider>
  );
}
