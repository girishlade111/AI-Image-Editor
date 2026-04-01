// ============================================================
// Fabric.js helper utilities — LadeStack Editor
// ============================================================
import { fabric } from 'fabric';

// ── Utilities ─────────────────────────────────────────────

/** Generate a unique layer ID. */
export function generateLayerId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Convert degrees to radians. */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Format zoom level as a percentage string. */
export function formatZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

// ── Canvas Lifecycle ──────────────────────────────────────

/** Initialize a new Fabric.js canvas on the given HTML element. */
export function initCanvas(
  canvasEl: HTMLCanvasElement,
  width: number,
  height: number
): fabric.Canvas {
  const canvas = new fabric.Canvas(canvasEl, {
    width,
    height,
    backgroundColor: '#ffffff',
    selection: true,
    preserveObjectStacking: true,
    renderOnAddRemove: true,
    stopContextMenu: true,
    fireRightClick: true,
  });
  return canvas;
}

/** Safely dispose of a Fabric.js canvas. */
export function disposeCanvas(canvas: fabric.Canvas): void {
  try {
    canvas.dispose();
  } catch {
    // silently ignore disposal errors during unmount
  }
}

// ── Serialization ─────────────────────────────────────────

/** Serialize the entire canvas state to a JSON string. */
export function serializeCanvas(canvas: fabric.Canvas): string {
  return JSON.stringify(canvas.toJSON());
}

/** Deserialize (load) canvas state from a JSON string. */
export function deserializeCanvas(
  canvas: fabric.Canvas,
  json: string
): Promise<void> {
  return new Promise((resolve) => {
    canvas.loadFromJSON(JSON.parse(json), () => {
      canvas.renderAll();
      resolve();
    });
  });
}

// ── Export ─────────────────────────────────────────────────

/** Export the canvas as a Blob in the given format. */
export function getCanvasBlob(
  canvas: fabric.Canvas,
  format: string = 'png',
  quality: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const dataURL = canvas.toDataURL({
      format: format as 'png' | 'jpeg',
      quality,
      multiplier: 1,
    });
    fetch(dataURL)
      .then((res) => res.blob())
      .then(resolve)
      .catch(reject);
  });
}

// ── Object Helpers ────────────────────────────────────────

/** Center an object on the canvas. */
export function centerObjectOnCanvas(
  canvas: fabric.Canvas,
  obj: fabric.Object
): void {
  const canvasCenter = canvas.getCenter();
  canvas.viewportCenterObject(obj);
  obj.setCoords();
  canvas.renderAll();
}

/** Fit the canvas within a container and return the computed zoom level. */
export function fitCanvasToScreen(
  canvas: fabric.Canvas,
  containerWidth: number,
  containerHeight: number
): number {
  const canvasWidth = canvas.getWidth();
  const canvasHeight = canvas.getHeight();

  const padding = 60; // px breathing room on each side
  const availW = containerWidth - padding * 2;
  const availH = containerHeight - padding * 2;

  const scaleX = availW / canvasWidth;
  const scaleY = availH / canvasHeight;
  const zoom = Math.min(scaleX, scaleY, 1); // never zoom beyond 100%

  // Reset viewport
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  // Center the canvas in the container
  const vpw = canvasWidth * zoom;
  const vph = canvasHeight * zoom;
  const offsetX = (containerWidth - vpw) / 2;
  const offsetY = (containerHeight - vph) / 2;

  canvas.setViewportTransform([zoom, 0, 0, zoom, offsetX, offsetY]);
  canvas.renderAll();

  return zoom;
}

// ── Image Loading ─────────────────────────────────────────

/** Load an image from a data URL and add it to the canvas. */
export function addImageToCanvas(
  canvas: fabric.Canvas,
  dataUrl: string,
  maxWidthRatio = 0.9,
  maxHeightRatio = 0.9
): Promise<fabric.Image> {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      dataUrl,
      (img) => {
        if (!img) {
          reject(new Error('Failed to load image'));
          return;
        }

        const canvasW = canvas.getWidth();
        const canvasH = canvas.getHeight();
        const maxW = canvasW * maxWidthRatio;
        const maxH = canvasH * maxHeightRatio;

        const imgW = img.width || 1;
        const imgH = img.height || 1;

        // Scale to fit within max bounds
        const scale = Math.min(maxW / imgW, maxH / imgH, 1);
        img.scale(scale);

        // Center on canvas
        img.set({
          left: (canvasW - imgW * scale) / 2,
          top: (canvasH - imgH * scale) / 2,
          originX: 'left',
          originY: 'top',
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        resolve(img);
      },
      { crossOrigin: 'anonymous' }
    );
  });
}
