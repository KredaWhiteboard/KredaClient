import { useEffect } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";

type Options = {
  ref: RefObject<HTMLCanvasElement | null>;
  setCtx: Dispatch<SetStateAction<CanvasRenderingContext2D | null>>;
};

export function useCanvasSize({ ref, setCtx }: Options) {
  useEffect(() => {
    if (!ref.current) return;

    const resize = () => {
      const canvas = ref.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const width  = rect.width;
      const height = rect.height;
      const dpr = window.devicePixelRatio || 1;

      // set the drawing buffer size
      canvas.width  = Math.floor(width  * dpr);
      canvas.height = Math.floor(height * dpr);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setCtx(null);
        return;
      }
      // map 1ctx-unit → 1css-px
      ctx.scale(dpr, dpr);
      setCtx(ctx);
    };

    // initial sizing
    resize();
    // on window resize
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [ref, setCtx]);
}
