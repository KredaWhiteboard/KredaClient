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

		const mouseDownHandler = (event: MouseEvent) => {
			if (pickedTool === "pencil") {
				const offsetX = event.offsetX;
				const offsetY = event.offsetY;
				ctx?.beginPath();
				ctx.lineWidth = thickness;
				ctx.strokeStyle = color;
				ctx?.moveTo(offsetX, offsetY);
				isDrawing.current = true;
			}
			else if (pickedTool === "rubber") {
				ctx.clearRect(event.offsetX, event.offsetY, 35, 35);
				isDrawing.current = true;
			}
		};

		const mouseMoveHandler = (event: MouseEvent) => {
			if (isDrawing.current && pickedTool === "pencil") {
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
			}
			else if (pickedTool === "rubber" && isDrawing.current) ctx.clearRect(event.offsetX, event.offsetY, 35, 35);
		};

		const mouseUpHandler = (event: MouseEvent) => {
			if (pickedTool === "rubber" && isDrawing.current) isDrawing.current = false;
			else if (isDrawing.current && pickedTool == "pencil") {
				isDrawing.current = false;
				ctx?.closePath();
			}
		};
		canvas?.addEventListener("mousedown", mouseDownHandler);
		canvas?.addEventListener("mousemove", mouseMoveHandler);
		canvas?.addEventListener("mouseup", mouseUpHandler);
		canvas?.addEventListener("mouseleave", mouseUpHandler);

		return () => {
			canvas?.removeEventListener("mousedown", mouseDownHandler);
			canvas?.removeEventListener("mousemove", mouseMoveHandler);
			canvas?.removeEventListener("mouseup", mouseUpHandler);
			canvas?.removeEventListener("mouseleave", mouseUpHandler);
		}
	}, [ctx, pickedTool, color]);

}