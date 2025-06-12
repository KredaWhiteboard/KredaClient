// src/hooks/usePanZoom.ts
import { useEffect, useRef } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";

type Options = {
  ref: RefObject<HTMLCanvasElement | null>;
  setCtx: Dispatch<SetStateAction<CanvasRenderingContext2D | null>>;
  expandFactor?: number;
  scaleStep?: number;
  minScale?: number;
  maxScale?: number;
  enablePan?: boolean;
};

export function usePanZoom({
  ref,
  setCtx,
  expandFactor = 1.05,
  scaleStep   = 0.1,
  minScale    = 0.2,
  maxScale    = 4,
  enablePan   = true,
}: Options) {
  // guard so initSize only ever runs once
  const hasInit = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCtx(null);
      return;
    }
    setCtx(ctx);

    // track transform state
    let scale = 1;
    let originX = 0;
    let originY = 0;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const clampOffsets = () => {
    const viewW   = canvas.clientWidth;
    const viewH   = canvas.clientHeight;
    const bufferW = canvas.width  * scale;
    const bufferH = canvas.height * scale;

    // don't pan past left/top (origin cannot be > 0)
    originX = Math.min(0, Math.max(viewW  - bufferW, originX));
    originY = Math.min(0, Math.max(viewH  - bufferH, originY));
    };
    
    // ONE‐TIME setup of buffer & context scaling
    const initSize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width  = w;
      canvas.height = h;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.scale(1, 1);
      setCtx(ctx);
      canvas.style.transformOrigin = "0 0";
      canvas.style.cursor = enablePan ? "grab" : "default";
    };
    if (!hasInit.current) {
      initSize();
      hasInit.current = true;
    }

    // apply the current pan+zoom
    const applyTransform = () => {
      canvas.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    };

    // expand logic (unchanged)
    const expandCanvas = () => {
      const oldW = canvas.width, oldH = canvas.height;
      const newW = Math.floor(oldW * expandFactor),
            newH = Math.floor(oldH * expandFactor);
      const tmp = document.createElement("canvas");
      tmp.width  = oldW;
      tmp.height = oldH;
      tmp.getContext("2d")!.drawImage(canvas, 0, 0);

      canvas.width  = newW;
      canvas.height = newH;

      const dx = (newW - oldW) / 2, dy = (newH - oldH) / 2;
      originX -= dx; originY -= dy;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, newW, newH);
      ctx.drawImage(tmp, dx, dy);
      setCtx(ctx);
      applyTransform();
    };
    const checkExpandOnPanOrZoom = () => {
      const viewW = canvas.clientWidth, viewH = canvas.clientHeight;
      if (
        originX > 0 ||
        originY > 0 ||
        originX + canvas.width * scale < viewW ||
        originY + canvas.height * scale < viewH
      ) {
        expandCanvas();
      }
    };

    // wheel → zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const delta = e.deltaY < 0 ? 1 + scaleStep : 1 - scaleStep;
      const newScale = Math.min(maxScale, Math.max(minScale, scale * delta));
      originX = x - (x - originX) * (newScale / scale);
      originY = y - (y - originY) * (newScale / scale);
      scale = newScale;
      clampOffsets();
      applyTransform();
      checkExpandOnPanOrZoom();
    };

    // mouse drag → pan (only if enablePan)
    const onMouseDown = (e: MouseEvent) => {
      if (!enablePan) return;
      isPanning = true;
      canvas.style.cursor = "grabbing";
      startX = e.clientX - originX;
      startY = e.clientY - originY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!enablePan || !isPanning) return;
      originX = e.clientX - startX;
      originY = e.clientY - startY;
      clampOffsets();
      applyTransform();
    };
    const onMouseUp = () => {
      if (!isPanning) return;
      isPanning = false;
      canvas.style.cursor = enablePan ? "grab" : "default";
      checkExpandOnPanOrZoom();
    };

    // listeners
    canvas.addEventListener("wheel", onWheel, { passive: false });
    if (enablePan) {
      canvas.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("mouseleave", onMouseUp);
    }

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      if (enablePan) {
        canvas.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        canvas.removeEventListener("mouseup", onMouseUp);
        canvas.removeEventListener("mouseleave", onMouseUp);
      }
    };
  }, [
    ref,
    setCtx,
    expandFactor,
    scaleStep,
    minScale,
    maxScale,
    enablePan,   // re-attach pan listeners when this toggles
  ]);
}
