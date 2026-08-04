"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { Crop, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OUTPUT_WIDTH = 2400;
const OUTPUT_HEIGHT = 120;

interface VipImageCropperProps {
  source: string;
  cancelLabel: string;
  confirmLabel: string;
  hint: string;
  onCancel: () => void;
  onConfirm: (imageData: string) => void;
}

export function VipImageCropper({
  source,
  cancelLabel,
  confirmLabel,
  hint,
  onCancel,
  onConfirm,
}: VipImageCropperProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number }>();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const [frameSize, setFrameSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [source]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const update = () => setFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  function imageLayout() {
    const frameWidth = frameSize.width;
    const frameHeight = frameSize.height;
    const baseScale = Math.max(
      frameWidth / naturalSize.width,
      frameHeight / naturalSize.height
    );
    const width = naturalSize.width * baseScale * zoom;
    const height = naturalSize.height * baseScale * zoom;
    return { frameWidth, frameHeight, width, height };
  }

  function clampOffset(next: { x: number; y: number }) {
    const layout = imageLayout();
    if (!layout) return next;
    const maxX = Math.max(0, (layout.width - layout.frameWidth) / 2);
    const maxY = Math.max(0, (layout.height - layout.frameHeight) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }

  function finishCrop() {
    const image = imageRef.current;
    const layout = imageLayout();
    if (!image || !layout) return;
    const displayLeft = (layout.frameWidth - layout.width) / 2 + offset.x;
    const displayTop = (layout.frameHeight - layout.height) / 2 + offset.y;
    const scaleToNatural = image.naturalWidth / layout.width;
    const sourceX = Math.max(0, -displayLeft * scaleToNatural);
    const sourceY = Math.max(0, -displayTop * scaleToNatural);
    const sourceWidth = Math.min(
      image.naturalWidth - sourceX,
      layout.frameWidth * scaleToNatural
    );
    const sourceHeight = Math.min(
      image.naturalHeight - sourceY,
      layout.frameHeight * scaleToNatural
    );
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT
    );
    onConfirm(canvas.toDataURL("image/jpeg", 0.84));
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-5xl rounded-2xl border border-border bg-card p-4 shadow-2xl sm:p-6">
        <div
          ref={frameRef}
          className="relative aspect-[20/1] w-full touch-none overflow-hidden rounded-lg bg-black cursor-move"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              x: event.clientX,
              y: event.clientY,
              left: offset.x,
              top: offset.y,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            setOffset(
              clampOffset({
                x: drag.left + event.clientX - drag.x,
                y: drag.top + event.clientY - drag.y,
              })
            );
          }}
          onPointerUp={() => { dragRef.current = undefined; }}
          onPointerCancel={() => { dragRef.current = undefined; }}
        >
          <img
            ref={imageRef}
            src={source}
            alt=""
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              width: imageLayout()?.width,
              height: imageLayout()?.height,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
            onLoad={(event) => {
              setNaturalSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
              setOffset({ x: 0, y: 0 });
            }}
          />
          <div className="pointer-events-none absolute inset-0 border-2 border-white/80" />
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Crop className="h-4 w-4" /> {hint}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0" />
          <Input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => {
              setZoom(Number(event.target.value));
              requestAnimationFrame(() => setOffset((current) => clampOffset(current)));
            }}
            className="h-2 cursor-pointer p-0"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>{cancelLabel}</Button>
          <Button type="button" onClick={finishCrop}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
