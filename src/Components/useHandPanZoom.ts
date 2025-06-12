// src/hooks/useHandPanZoom.ts
import { usePanZoom } from "./usePanZoom";
import type { RefObject, Dispatch, SetStateAction } from "react";

interface HandPanZoomOptions {
  /** canvas ref */
  ref: RefObject<HTMLCanvasElement | null>;
  /** whether hand tool is active */
  pickedTool: string;
  /** your setCtx from useState */
  setCtx: Dispatch<SetStateAction<CanvasRenderingContext2D | null>>;
  /** zoom step */
  scaleStep?: number;
  /** min zoom */
  minScale?: number;
  /** max zoom */
  maxScale?: number;
}

export function useHandPanZoom({
  ref,
  pickedTool,
  setCtx,
  scaleStep = 0.1,
  minScale  = 0.5,
  maxScale  = 3,
}: HandPanZoomOptions) {
  usePanZoom({
    ref,
    setCtx,
    scaleStep,
    minScale,
    maxScale,
    enablePan: pickedTool === "hand",
  });
}
