'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';

export default function AILoadingOverlay() {
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const aiProcessingMessage = useEditorStore((s) => s.aiProcessingMessage);

  if (!isProcessing) return null;

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60">
      <div className="flex flex-col items-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 animate-pulse rounded-full bg-[#e94560]/20 blur-xl" />
          <Sparkles className="relative h-12 w-12 text-[#e94560]" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-white" />
        <p className="mt-3 text-sm font-medium text-white">
          {aiProcessingMessage || 'Processing...'}
        </p>
      </div>
    </div>
  );
}
