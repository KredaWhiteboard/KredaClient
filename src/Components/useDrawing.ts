import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef } from "react";

export function useDrawing(
	pickedTool: string,
	canvasRef: React.RefObject<HTMLCanvasElement | null>,
	ctx: CanvasRenderingContext2D | null,
	color: string,
	thickness: number,
	connection: HubConnection | null,
	username: string | null
) {
	const isDrawing = useRef(false);

	useEffect(() => {
		if (!canvasRef.current || !ctx) return;
		const canvas = canvasRef.current;

		const startDrawing = (event: MouseEvent) => {
			if (pickedTool !== "pencil") return;
			const offsetX = event.offsetX;
			const offsetY = event.offsetY;
			ctx?.beginPath();
			ctx.lineWidth = thickness;
			ctx.strokeStyle = color;
			ctx?.moveTo(offsetX, offsetY);
			isDrawing.current = true;
		};

		const draw = (event: MouseEvent) => {
			if (!isDrawing.current || pickedTool !== "pencil") return;
			const offsetX = event.offsetX;
			const offsetY = event.offsetY;
			ctx?.lineTo(offsetX, offsetY);
			ctx?.stroke();

			// if (connection) {
			// 	// Stwórz obiekt z danymi do wysłania
			// 	const lineData = {
			// 		x: offsetX,
			// 		y: offsetY,
			// 		isDrawing: isDrawing,
			// 	};

			// 	// Wywołaj metodę na serwerze
			// 	try {
			// 		connection.invoke("DrawLine", lineData);
			// 	} catch (e) {
			// 		console.error("Błąd wysyłania danych: ", e);
			// 	}
			// }
		};

		const stopDrawing = () => {
			if (!isDrawing.current || pickedTool !== "pencil") return;
			isDrawing.current = false;
			ctx?.closePath();
		};

		canvas?.addEventListener("mousedown", startDrawing);
		canvas?.addEventListener("mousemove", draw);
		canvas?.addEventListener("mouseup", stopDrawing);
		canvas?.addEventListener("mouseleave", stopDrawing);

		return () => {
			canvas?.removeEventListener("mousedown", startDrawing);
			canvas?.removeEventListener("mousemove", draw);
			canvas?.removeEventListener("mouseup", stopDrawing);
			canvas?.removeEventListener("mouseleave", stopDrawing);
		}
	}, [ctx, pickedTool, color]);

}