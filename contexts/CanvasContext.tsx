'use client';

import React, { createContext, useContext, useRef } from 'react';

interface CanvasContextValue {
  canvasRef: React.MutableRefObject<any>;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<any>(null);
  return (
    <CanvasContext.Provider value={{ canvasRef }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvasContext must be used within CanvasProvider');
  return ctx;
}
