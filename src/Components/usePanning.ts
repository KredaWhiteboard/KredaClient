import { useEffect, useState, useRef } from "react";
import type { RefObject } from "react";

interface Coord { x: number; y: number; }
interface PanningOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  enabled: boolean;
  scale: number;
}

export function usePanning({
  canvasRef,
  enabled,
  scale,
}: PanningOptions) {
  const [offset, setOffset] = useState<Coord>({ x: 0, y: 0 });
  const dragging = useRef(false);
  const start = useRef<Coord>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!enabled) return;
      dragging.current = true;
      start.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
      canvas.style.cursor = "grabbing";
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!enabled || !dragging.current) return;
      setOffset({ x: e.clientX - start.current.x, y: e.clientY - start.current.y });
    };
    const onMouseUp = () => {
      if (!enabled) return;
      dragging.current = false;
      canvas.style.cursor = "grab";
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [canvasRef, enabled, offset.x, offset.y]);

  return { offset };
}
