'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useEditorStore } from '@/store/useEditorStore';
import {
  addImageToCanvas,
  serializeCanvas,
  generateLayerId,
  formatZoom,
} from '@/lib/fabricHelpers';

const ACCEPTED_FORMATS = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
];

export default function EditorCanvas() {
  const {
    canvasRef,
    canvasElRef,
    containerRef,
    canvasReady,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useCanvas();

  const zoom = useEditorStore((s) => s.zoom);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const addLayer = useEditorStore((s) => s.addLayer);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const incrementImageCounter = useEditorStore((s) => s.incrementImageCounter);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── File picker trigger ─────────────────────────────────
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ── Keyboard shortcuts ──────────────────────────────────
  useKeyboardShortcuts(canvasRef, {
    onOpenFile: openFilePicker,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
  });

  // ── Load image helper ───────────────────────────────────
  const loadImageFile = useCallback(
    (file: File) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        try {
          await addImageToCanvas(canvas, dataUrl);
          const count = incrementImageCounter();

          addLayer({
            id: generateLayerId(),
            name: `Image ${count}`,
            visible: true,
            locked: false,
            opacity: 1,
            type: 'image',
          });

          const snapshot = serializeCanvas(canvas);
          pushHistory(snapshot);
        } catch (err) {
          console.error('Failed to load image:', err);
        }
      };
      reader.readAsDataURL(file);
    },
    [canvasRef, addLayer, pushHistory, incrementImageCounter]
  );

  // ── Drag & Drop handlers ───────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFile = files.find((f) => ACCEPTED_FORMATS.includes(f.type));
      if (imageFile) {
        loadImageFile(imageFile);
      }
    },
    [loadImageFile]
  );

  // ── File input handler ─────────────────────────────────
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && ACCEPTED_FORMATS.includes(file.type)) {
        loadImageFile(file);
      }
      // Reset input so user can re-upload the same file
      e.target.value = '';
    },
    [loadImageFile]
  );

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#1a1a2e]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* Checkerboard background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #808080 25%, transparent 25%),
            linear-gradient(-45deg, #808080 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #808080 75%),
            linear-gradient(-45deg, transparent 75%, #808080 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#e94560]/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#e94560]/50 bg-[#1a1a2e]/80 px-12 py-8">
            <svg
              className="h-10 w-10 text-[#e94560]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm font-medium text-white/70">
              Drop image to add to canvas
            </span>
          </div>
        </div>
      )}

      {/* Fabric.js Canvas */}
      <canvas ref={canvasElRef} className="absolute shadow-2xl" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.bmp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Placeholder (only when canvas has no objects) */}
      {canvasReady && (
        <EmptyCanvasHint
          canvasRef={canvasRef}
          onOpenFile={openFilePicker}
        />
      )}

      {/* Zoom indicator — bottom right */}
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-[10px] font-medium tabular-nums text-white/60">
          {formatZoom(zoom)}
        </span>
      </div>

      {/* Canvas size indicator — bottom left */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <span className="text-[10px] font-medium tabular-nums text-white/40">
          {canvasWidth} × {canvasHeight}
        </span>
      </div>
    </div>
  );
}

/** Overlay hint shown when the canvas has zero objects. */
function EmptyCanvasHint({
  canvasRef,
  onOpenFile,
}: {
  canvasRef: React.MutableRefObject<any>;
  onOpenFile: () => void;
}) {
  const [objectCount, setObjectCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const update = () => setObjectCount(canvas.getObjects().length);
    update();

    canvas.on('object:added', update);
    canvas.on('object:removed', update);
    return () => {
      canvas.off('object:added', update);
      canvas.off('object:removed', update);
    };
  }, [canvasRef]);

  if (objectCount > 0) return null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center">
      <button
        onClick={onOpenFile}
        className="group flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-10 py-8 transition-all hover:border-[#e94560]/30 hover:bg-white/[0.04]"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-[#e94560]/10">
          <svg
            className="h-7 w-7 text-white/25 transition-colors group-hover:text-[#e94560]/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
        </div>
        <span className="text-sm font-medium text-white/20 transition-colors group-hover:text-white/40">
          Drop image or click to open
        </span>
        <span className="text-[10px] text-white/10">
          PNG · JPG · WEBP · GIF · SVG · BMP
        </span>
      </button>
    </div>
  );
}
