import { useEffect, useState } from "react";
import type { RefObject } from "react";

interface Size { width: number; height: number; }
interface Offset { x: number; y: number; }

interface ZoomPanOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  minScale?: number;
  maxScale?: number;
}

export function useZoomPan({
  canvasRef,
  minScale = 0.5,
  maxScale = 3,
}: ZoomPanOptions) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.transformOrigin = "0 0";

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY / 1000;
      const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));

      const dx = (mouseX / scale) * (newScale / scale - 1);
      const dy = (mouseY / scale) * (newScale / scale - 1);

      setOffset(o => ({ x: o.x - dx, y: o.y - dy }));
      setScale(newScale);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => void canvas.removeEventListener("wheel", onWheel);
  }, [canvasRef, scale, minScale, maxScale]);

  return { scale, offset };
}
