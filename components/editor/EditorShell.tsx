'use client';

import React, { useCallback, useState } from 'react';
import TopBar from './TopBar';
import Toolbar from './Toolbar';
import EditorCanvas from './EditorCanvas';
import LayersPanel from './LayersPanel';
import AdjustmentsPanel from './AdjustmentsPanel';
import NewCanvasDialog from './NewCanvasDialog';
import { useEditorStore } from '@/store/useEditorStore';
import { CanvasProvider } from '@/contexts/CanvasContext';
import { Separator } from '@/components/ui/separator';

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

  const handleCreateCanvas = useCallback(
    (width: number, height: number, bg: string) => {
      setCanvasSize(width, height);
      setPendingCanvas({ width, height, bg });
      setShowNewCanvasDialog(false);
      // Force canvas remount with new dimensions
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
      {/* Top bar — 48px */}
      <TopBar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar — 56px */}
        <Toolbar />

        {/* Center canvas — fills remaining space */}
        <div className="relative flex-1 overflow-hidden">
          <EditorCanvas key={canvasKey} />
        </div>

        {/* Right panel — 280px */}
        <div className="flex w-[280px] flex-col border-l border-white/[0.06] bg-[#16213e]">
          {/* Layers — top half */}
          <div className="flex-1 overflow-hidden">
            <LayersPanel />
          </div>
          <Separator className="bg-white/[0.06]" />
          {/* Adjustments — bottom half */}
          <div className="flex-1 overflow-hidden">
            <AdjustmentsPanel />
          </div>
        </div>
      </div>

      {/* New Canvas Dialog */}
      <NewCanvasDialog
        open={showNewCanvasDialog}
        onClose={handleCloseDialog}
        onCreateCanvas={handleCreateCanvas}
      />
    </div>
    </CanvasProvider>
  );
}
