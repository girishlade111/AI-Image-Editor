'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/store/useEditorStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { fabric } from 'fabric';
import {
  Sparkles,
  ImageIcon,
  Maximize2,
  Eraser,
  Wand2,
  Expand,
  Palette,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { successToast, errorToast } from './EditorShell';

interface AICardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onUse: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function AICard({ icon, title, description, badge, onUse, disabled, comingSoon }: AICardProps) {
  return (
    <div className={`rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 ${disabled || comingSoon ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e94560]/20 text-[#e94560]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/80">{title}</span>
            {badge && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/50">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[10px] text-white/40">{description}</p>
        </div>
      </div>
      <Button
        onClick={onUse}
        disabled={disabled || comingSoon}
        className="mt-2 w-full bg-[#e94560] hover:bg-[#e94560]/80 text-[10px] h-7"
      >
        {comingSoon ? 'Coming Soon' : 'Use'}
      </Button>
    </div>
  );
}

function UpscaleModal({
  open,
  onClose,
  onConfirm,
  currentWidth,
  currentHeight,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (scale: number) => void;
  currentWidth: number;
  currentHeight: number;
}) {
  const [scale, setScale] = useState(2);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[280px] rounded-lg border border-white/[0.1] bg-[#16213e] p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">AI Upscale</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-white/50">Select scale factor:</p>
        <div className="mt-3 flex gap-2">
          {[2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${
                scale === s
                  ? 'border-[#e94560] bg-[#e94560]/20 text-white'
                  : 'border-white/[0.1] text-white/60 hover:border-white/30'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-white/40">
          Result will be: {currentWidth * scale} × {currentHeight * scale}
        </p>
        <Button
          onClick={() => onConfirm(scale)}
          className="mt-4 w-full bg-[#e94560] hover:bg-[#e94560]/80"
        >
          Upscale Image
        </Button>
      </div>
    </div>
  );
}

function EraseMaskOverlay({
  onErase,
  onCancel,
}: {
  onErase: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60">
      <div className="mb-4 text-center">
        <p className="text-sm font-medium text-white">AI Object Erase</p>
        <p className="mt-1 text-[11px] text-white/60">
          Paint over the object you want to remove, then click Erase
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onErase}
          className="bg-[#e94560] hover:bg-[#e94560]/80 text-xs"
        >
          Erase Object
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-white/[0.2] text-white hover:bg-white/10 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function LimitModal({
  open,
  onClose,
  feature,
}: {
  open: boolean;
  onClose: () => void;
  feature: string;
}) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[280px] rounded-lg border border-white/[0.1] bg-[#16213e] p-4 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-[#e94560]" />
        <h3 className="mt-3 text-sm font-medium text-white">Daily Limit Reached</h3>
        <p className="mt-2 text-[11px] text-white/60">
          You've used 5 {feature} credits today. Upgrade to Pro for unlimited AI features.
        </p>
        <Button onClick={onClose} className="mt-4 w-full bg-[#e94560] hover:bg-[#e94560]/80">
          Got it
        </Button>
      </div>
    </div>
  );
}

interface UsageLimits {
  removeBgCount: number;
  upscaleCount: number;
  cleanupCount: number;
  lastResetDate: string;
}

function getUsageLimits(): UsageLimits {
  if (typeof window === 'undefined') {
    return { removeBgCount: 0, upscaleCount: 0, cleanupCount: 0, lastResetDate: '' };
  }
  const stored = localStorage.getItem('aiUsageLimits');
  if (!stored) return { removeBgCount: 0, upscaleCount: 0, cleanupCount: 0, lastResetDate: new Date().toISOString().split('T')[0] };
  
  const limits: UsageLimits = JSON.parse(stored);
  const today = new Date().toISOString().split('T')[0];
  
  if (limits.lastResetDate !== today) {
    const reset = { ...limits, removeBgCount: 0, upscaleCount: 0, cleanupCount: 0, lastResetDate: today };
    localStorage.setItem('aiUsageLimits', JSON.stringify(reset));
    return reset;
  }
  
  return limits;
}

function saveUsageLimits(limits: UsageLimits) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('aiUsageLimits', JSON.stringify(limits));
  }
}

export default function AIToolsPanel() {
  const { canvasRef } = useCanvasContext();
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const setIsProcessing = useEditorStore((s) => s.setIsProcessing);
  const aiProcessingMessage = useEditorStore((s) => s.aiProcessingMessage);
  const setAiProcessingMessage = useEditorStore((s) => s.setAiProcessingMessage);
  const isEraseMaskMode = useEditorStore((s) => s.isEraseMaskMode);
  const setIsEraseMaskMode = useEditorStore((s) => s.setIsEraseMaskMode);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const [showUpscaleModal, setShowUpscaleModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitFeature, setLimitFeature] = useState('');
  const [currentImageSize, setCurrentImageSize] = useState({ width: 0, height: 0 });

  const getLimits = useCallback(() => getUsageLimits(), []);
  const [limits, setLimits] = useState<UsageLimits>(getLimits);

  useEffect(() => {
    setLimits(getLimits());
  }, [getLimits]);

  const checkLimit = useCallback((feature: 'removeBg' | 'upscale' | 'cleanup') => {
    const current = getLimits();
    const count = feature === 'removeBg' ? current.removeBgCount : feature === 'upscale' ? current.upscaleCount : current.cleanupCount;
    return count >= 5;
  }, [getLimits]);

  const incrementLimit = useCallback((feature: 'removeBg' | 'upscale' | 'cleanup') => {
    const current = getLimits();
    const updated = {
      ...current,
      removeBgCount: feature === 'removeBg' ? current.removeBgCount + 1 : current.removeBgCount,
      upscaleCount: feature === 'upscale' ? current.upscaleCount + 1 : current.upscaleCount,
      cleanupCount: feature === 'cleanup' ? current.cleanupCount + 1 : current.cleanupCount,
    };
    saveUsageLimits(updated);
    setLimits(updated);
  }, [getLimits]);

  const getSelectedImage = useCallback((): any => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'image') return null;
    return active;
  }, [canvasRef]);

  const removeBackground = useCallback(async () => {
    if (checkLimit('removeBg')) {
      setLimitFeature('Background Remove');
      setShowLimitModal(true);
      return;
    }

    const imgObj = getSelectedImage();
    if (!imgObj) return;

    setIsProcessing(true);
    setAiProcessingMessage('Removing background...');

    try {
      const dataUrl = imgObj.toDataURL({ format: 'png', multiplier: 1 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'image.png');

      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove background');
      }

      const arrayBuffer = await res.arrayBuffer();
      const resultBlob = new Blob([arrayBuffer], { type: 'image/png' });
      const resultUrl = URL.createObjectURL(resultBlob);

      fabric.Image.fromURL(resultUrl, (newImg: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        newImg.set({
          left: imgObj.left,
          top: imgObj.top,
          scaleX: imgObj.scaleX,
          scaleY: imgObj.scaleY,
        });
        
        canvas.remove(imgObj);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        canvas.renderAll();
        pushHistory(canvas.toJSON());
      });
    } catch (error: any) {
      console.error('Remove background error:', error);
      errorToast(error.message || 'Failed to remove background');
    } finally {
      setIsProcessing(false);
      setAiProcessingMessage('');
      incrementLimit('removeBg');
      successToast('Background removed!');
    }
  }, [canvasRef, checkLimit, getSelectedImage, incrementLimit, pushHistory, setAiProcessingMessage, setIsProcessing]);

  const handleUpscaleClick = useCallback(() => {
    const imgObj = getSelectedImage();
    if (!imgObj) return;
    
    const width = (imgObj.width || 0) * (imgObj.scaleX || 1);
    const height = (imgObj.height || 0) * (imgObj.scaleY || 1);
    setCurrentImageSize({ width: Math.round(width), height: Math.round(height) });
    setShowUpscaleModal(true);
  }, [getSelectedImage]);

  const upscaleImage = useCallback(async (scale: number) => {
    if (checkLimit('upscale')) {
      setLimitFeature('AI Upscale');
      setShowLimitModal(true);
      setShowUpscaleModal(false);
      return;
    }

    const imgObj = getSelectedImage();
    if (!imgObj) return;

    setShowUpscaleModal(false);
    setIsProcessing(true);
    setAiProcessingMessage('Upscaling image... This may take a moment');

    try {
      const dataUrl = imgObj.toDataURL({ format: 'png', multiplier: 1 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'image.png');
      formData.append('scale', scale.toString());

      const res = await fetch('/api/upscale', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upscale image');
      }

      const arrayBuffer = await res.arrayBuffer();
      const resultBlob = new Blob([arrayBuffer], { type: 'image/png' });
      const resultUrl = URL.createObjectURL(resultBlob);

      const canvas = canvasRef.current;
      if (!canvas) return;

      fabric.Image.fromURL(resultUrl, (newImg: any) => {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        let newScale = 1;
        if (newImg.width && newImg.height) {
          if (newImg.width > canvasWidth || newImg.height > canvasHeight) {
            const scaleX = canvasWidth / newImg.width;
            const scaleY = canvasHeight / newImg.height;
            newScale = Math.min(scaleX, scaleY) * 0.9;
          }
        }

        newImg.set({
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center',
          scaleX: newScale,
          scaleY: newScale,
        });

        canvas.remove(imgObj);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        canvas.renderAll();
        pushHistory(canvas.toJSON());
        const newWidth = Math.round((newImg.width || 0) * newScale);
        const newHeight = Math.round((newImg.height || 0) * newScale);
        successToast(`Image upscaled to ${newWidth}×${newHeight}!`);
      });
    } catch (error: any) {
      console.error('Upscale error:', error);
      errorToast(error.message || 'Failed to upscale image');
    } finally {
      setIsProcessing(false);
      setAiProcessingMessage('');
      incrementLimit('upscale');
    }
  }, [canvasRef, checkLimit, getSelectedImage, incrementLimit, pushHistory, setAiProcessingMessage, setIsProcessing]);

  const startEraseMaskMode = useCallback(() => {
    const imgObj = getSelectedImage();
    if (!imgObj) return;
    
    setIsEraseMaskMode(true);
  }, [getSelectedImage, setIsEraseMaskMode]);

  const cancelEraseMask = useCallback(() => {
    setIsEraseMaskMode(false);
  }, [setIsEraseMaskMode]);

  const confirmEraseObject = useCallback(async () => {
    if (checkLimit('cleanup')) {
      setLimitFeature('AI Object Erase');
      setShowLimitModal(true);
      return;
    }

    const canvas = canvasRef.current;
    const imgObj = getSelectedImage();
    if (!canvas || !imgObj) return;

    setIsProcessing(true);
    setAiProcessingMessage('Erasing object...');

    try {
      const dataUrl = imgObj.toDataURL({ format: 'png', multiplier: 1 });
      const imageResponse = await fetch(dataUrl);
      const imageBlob = await imageResponse.blob();

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = canvas.getWidth();
      maskCanvas.height = canvas.getHeight();
      const ctx = maskCanvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      ctx.fillStyle = 'white';

      const maskImage = new Image();
      const maskDataUrl = imgObj.toDataURL({ format: 'png', multiplier: 1 });
      
      await new Promise<void>((resolve) => {
        maskImage.onload = () => {
          ctx.drawImage(maskImage, 0, 0, maskCanvas.width, maskCanvas.height);
          resolve();
        };
        maskImage.src = maskDataUrl;
      });

      const maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvas.toBlob((b) => resolve(b!), 'image/png');
      });

      const formData = new FormData();
      formData.append('image', imageBlob, 'image.png');
      formData.append('mask', maskBlob, 'mask.png');

      const res = await fetch('/api/cleanup', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to erase object');
      }

      const arrayBuffer = await res.arrayBuffer();
      const resultBlob = new Blob([arrayBuffer], { type: 'image/png' });
      const resultUrl = URL.createObjectURL(resultBlob);

      fabric.Image.fromURL(resultUrl, (newImg: any) => {
        newImg.set({
          left: imgObj.left,
          top: imgObj.top,
          scaleX: imgObj.scaleX,
          scaleY: imgObj.scaleY,
        });
        
        canvas.remove(imgObj);
        canvas.add(newImg);
        canvas.setActiveObject(newImg);
        canvas.renderAll();
        pushHistory(canvas.toJSON());
      });
    } catch (error: any) {
      console.error('Erase object error:', error);
      errorToast(error.message || 'Failed to erase object');
    } finally {
      setIsProcessing(false);
      setAiProcessingMessage('');
      setIsEraseMaskMode(false);
      incrementLimit('cleanup');
      successToast('Object erased!');
    }
  }, [canvasRef, checkLimit, getSelectedImage, incrementLimit, pushHistory, setAiProcessingMessage, setIsEraseMaskMode, setIsProcessing]);

  const autoEnhance = useCallback(() => {
    const canvas = canvasRef.current;
    const imgObj = getSelectedImage();
    if (!canvas || !imgObj) return;

    const filters = [
      new fabric.Image.filters.Brightness({ brightness: 0.1 }),
      new fabric.Image.filters.Contrast({ contrast: 0.15 }),
      new fabric.Image.filters.Saturation({ saturation: 0.2 }),
      new fabric.Image.filters.Convolve({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      }),
    ];

    imgObj.filters = filters;
    imgObj.applyFilters();
    canvas.renderAll();
    pushHistory(canvas.toJSON());
    successToast('Image enhanced automatically!');
  }, [canvasRef, getSelectedImage, pushHistory]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-white/[0.06] px-3 py-2">
        <Sparkles className="mr-2 h-3.5 w-3.5 text-[#e94560]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          AI Tools
        </span>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-3">
          <AICard
            icon={<ImageIcon className="h-4 w-4" />}
            title="Background Remove"
            description="Instantly remove image background"
            badge="Free · 5/day"
            onUse={removeBackground}
          />
          <AICard
            icon={<Maximize2 className="h-4 w-4" />}
            title="AI Upscale"
            description="Upscale image 2x or 4x without quality loss"
            badge="Free · 5/day"
            onUse={handleUpscaleClick}
          />
          <AICard
            icon={<Eraser className="h-4 w-4" />}
            title="AI Object Erase"
            description="Paint over objects to erase them"
            badge="Free · 5/day"
            onUse={startEraseMaskMode}
          />
          <AICard
            icon={<Wand2 className="h-4 w-4" />}
            title="AI Enhance"
            description="Auto-enhance brightness, contrast, color"
            badge="Free · 5/day"
            onUse={autoEnhance}
          />
          <AICard
            icon={<Expand className="h-4 w-4" />}
            title="AI Expand"
            description="Extend image beyond its borders"
            onUse={() => {}}
            comingSoon
          />
          <AICard
            icon={<Palette className="h-4 w-4" />}
            title="AI Recolor"
            description="Change colors with natural results"
            onUse={() => {}}
            comingSoon
          />
        </div>
      </ScrollArea>

      {showUpscaleModal && (
        <UpscaleModal
          open={showUpscaleModal}
          onClose={() => setShowUpscaleModal(false)}
          onConfirm={upscaleImage}
          currentWidth={currentImageSize.width}
          currentHeight={currentImageSize.height}
        />
      )}

      {isEraseMaskMode && (
        <EraseMaskOverlay
          onErase={confirmEraseObject}
          onCancel={cancelEraseMask}
        />
      )}

      {showLimitModal && (
        <LimitModal
          open={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          feature={limitFeature}
        />
      )}
    </div>
  );
}
