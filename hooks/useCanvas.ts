'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { fabric } from 'fabric';
import {
  initCanvas,
  disposeCanvas,
  fitCanvasToScreen,
  serializeCanvas,
  deserializeCanvas,
  clamp,
} from '@/lib/fabricHelpers';
import { useEditorStore } from '@/store/useEditorStore';

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 30;

/**
 * Core hook managing the entire Fabric.js canvas lifecycle,
 * zoom, pan, and synchronisation with the Zustand store.
 */
export function useCanvas(
  externalCanvasRef?: React.MutableRefObject<any>
) {
  const internalCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const spaceHeld = useRef(false);
  const isUndoRedoing = useRef(false);

  const [canvasReady, setLocalCanvasReady] = useState(false);

  const setZoom = useEditorStore((s) => s.setZoom);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const history = useEditorStore((s) => s.history);
  const setCanvasReady = useEditorStore((s) => s.setCanvasReady);

  // ── Initialise canvas on mount ─────────────────────────
  useEffect(() => {
    const canvasEl = canvasElRef.current;
    const container = containerRef.current;
    if (!canvasEl || !container) return;

    const canvas = initCanvas(canvasEl, canvasWidth, canvasHeight);
    canvasRef.current = canvas;

    // Fit to container
    const rect = container.getBoundingClientRect();
    const zoom = fitCanvasToScreen(canvas, rect.width, rect.height);
    setZoom(zoom);

    // Push initial empty state
    const initialState = serializeCanvas(canvas);
    pushHistory(initialState);

    setLocalCanvasReady(true);
    setCanvasReady(true);

    // ── Mouse wheel zoom ──────────────────────────────────
    canvas.on('mouse:wheel', (opt) => {
      const evt = opt.e as WheelEvent;
      evt.preventDefault();
      evt.stopPropagation();

      const delta = evt.deltaY;
      let currentZoom = canvas.getZoom();
      const factor = delta > 0 ? 0.92 : 1.08;
      currentZoom *= factor;
      currentZoom = clamp(currentZoom, MIN_ZOOM, MAX_ZOOM);

      const point = new fabric.Point(evt.offsetX, evt.offsetY);
      canvas.zoomToPoint(point, currentZoom);
      setZoom(currentZoom);
      canvas.renderAll();
    });

    // ── Middle-mouse / space panning ──────────────────────
    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      // Middle button (1) or space+left
      if (evt.button === 1 || (spaceHeld.current && evt.button === 0)) {
        isPanning.current = true;
        lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
        canvas.selection = false;
        canvas.setCursor('grabbing');
        evt.preventDefault();
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (!isPanning.current || !lastPanPoint.current) return;
      const evt = opt.e as MouseEvent;
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      vpt[4] += evt.clientX - lastPanPoint.current.x;
      vpt[5] += evt.clientY - lastPanPoint.current.y;
      lastPanPoint.current = { x: evt.clientX, y: evt.clientY };
      canvas.requestRenderAll();
    });

    canvas.on('mouse:up', () => {
      if (isPanning.current) {
        isPanning.current = false;
        lastPanPoint.current = null;
        canvas.selection = true;
        canvas.setCursor('default');
      }
    });

    // ── History tracking ──────────────────────────────────
    const pushSnapshot = () => {
      if (isUndoRedoing.current) return;
      const snapshot = serializeCanvas(canvas);
      pushHistory(snapshot);
    };

    canvas.on('object:modified', pushSnapshot);
    canvas.on('object:added', pushSnapshot);
    canvas.on('object:removed', pushSnapshot);

    return () => {
      canvasRef.current = null;
      setCanvasReady(false);
      setLocalCanvasReady(false);
      disposeCanvas(canvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Window resize handler ──────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const zoom = fitCanvasToScreen(canvas, rect.width, rect.height);
      setZoom(zoom);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setZoom]);

  // ── Space key tracking (for pan) ───────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        spaceHeld.current = true;
        const canvas = canvasRef.current;
        if (canvas) canvas.setCursor('grab');
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeld.current = false;
        isPanning.current = false;
        lastPanPoint.current = null;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.selection = true;
          canvas.setCursor('default');
        }
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // ── Undo / Redo reactions ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndex < 0 || !history[historyIndex]) return;

    isUndoRedoing.current = true;
    deserializeCanvas(canvas, history[historyIndex]).then(() => {
      isUndoRedoing.current = false;
    });
  }, [historyIndex, history]);

  // ── Zoom helpers ───────────────────────────────────────
  const zoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const center = canvas.getCenter();
    let z = canvas.getZoom() * 1.2;
    z = clamp(z, MIN_ZOOM, MAX_ZOOM);
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), z);
    setZoom(z);
    canvas.renderAll();
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const center = canvas.getCenter();
    let z = canvas.getZoom() * 0.8;
    z = clamp(z, MIN_ZOOM, MAX_ZOOM);
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), z);
    setZoom(z);
    canvas.renderAll();
  }, [setZoom]);

  const resetZoom = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const z = fitCanvasToScreen(canvas, rect.width, rect.height);
    setZoom(z);
  }, [setZoom]);

  const setZoomLevel = useCallback(
    (level: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const center = canvas.getCenter();
      const z = clamp(level, MIN_ZOOM, MAX_ZOOM);
      canvas.zoomToPoint(new fabric.Point(center.left, center.top), z);
      setZoom(z);
      canvas.renderAll();
    },
    [setZoom]
  );

  return {
    canvas: canvasRef.current,
    canvasRef,
    canvasElRef,
    containerRef,
    canvasReady,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
  };
}
