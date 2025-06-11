import { useEffect, useRef } from "react";

export function useDrawing(
	pickedTool: string,
	canvasRef: React.RefObject<HTMLCanvasElement | null>,
	ctx: CanvasRenderingContext2D | null,
	color: string
){
	const isDrawing = useRef(false);
	
	useEffect(() => {
		if (!canvasRef.current || !ctx) return;
		const canvas = canvasRef.current;
		const startDrawing = (event: MouseEvent) => {
			if(pickedTool !== "pencil") return;
			const offsetX = event.offsetX;
			const offsetY = event.offsetY;
			ctx?.beginPath();
			ctx.strokeStyle = color;
			ctx?.moveTo(offsetX, offsetY);
			isDrawing.current = true;
		};

		const draw = (event: MouseEvent) => {
			if(!isDrawing.current || pickedTool !== "pencil") return;
			const offsetX = event.offsetX;
			const offsetY = event.offsetY;
			ctx?.lineTo(offsetX, offsetY);
			ctx?.stroke();
		}

		const stopDrawing = () => {
			if(!isDrawing.current || pickedTool !== "pencil") return;
			isDrawing.current = false;
			ctx?.closePath();
		}

		canvas?.addEventListener("mousedown", startDrawing);
		canvas?.addEventListener("mousemove", draw);
		canvas?.addEventListener("mouseup", stopDrawing);
		canvas?.addEventListener("mouseleave", stopDrawing);

		return () => {
		canvas?.removeEventListener("mousedown", startDrawing);
		canvas?.removeEventListener("mousemove", draw);
		canvas?.removeEventListener("mouseup", stopDrawing);
		canvas?.removeEventListener("mouseleave", stopDrawing);}
	}, [ctx, pickedTool, color]);

}