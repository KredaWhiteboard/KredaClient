import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";

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

	const throttledSendAction = useCallback(
		throttle((x: number, y: number) => {
			if (connection) {
				try {
					const status = isDrawing.current;
					connection.invoke("SendUserAction", { username, x, y, status });
				} catch (e) {
					console.error("Błąd wysyłania danych: ", e);
				}
			}
		}, 50),
		[connection]
	);

	useEffect(() => {
		if (!canvasRef.current || !ctx) return;
		const canvas = canvasRef.current;

		const mouseDownHandler = (event: MouseEvent) => {
			if (pickedTool === "Pencil") {
				const offsetX = event.offsetX;
				const offsetY = event.offsetY;
				ctx?.beginPath();
				ctx.lineWidth = thickness;
				ctx.strokeStyle = color;
				ctx?.moveTo(offsetX, offsetY);
				isDrawing.current = true;
			}
			else if (pickedTool === "Rubber") {
				ctx.clearRect(event.offsetX, event.offsetY, 35, 35);
				isDrawing.current = true;
			}
		};

		const mouseMoveHandler = (event: MouseEvent) => {
			if (isDrawing.current && pickedTool === "Pencil") {
				const offsetX = event.offsetX;
				const offsetY = event.offsetY;
				ctx?.lineTo(offsetX, offsetY);
				ctx?.stroke();

				if (connection) {
					const SendUserAction = {
						username: username,
						x: offsetX,
						y: offsetY,
						isDrawing: isDrawing.current,
					};

					try {
						connection.invoke("SendUserAction", SendUserAction);
					} catch (e) {
						console.error("Błąd wysyłania danych: ", e);
					}
				}
			}
			else if (pickedTool === "Rubber" && isDrawing.current) ctx.clearRect(event.offsetX, event.offsetY, 35, 35);
			else {
				const { offsetX, offsetY } = event;
				throttledSendAction(offsetX, offsetY);
			}
		};

		const mouseUpHandler = () => {
			if (pickedTool === "Rubber" && isDrawing.current) isDrawing.current = false;
			else if (isDrawing.current && pickedTool == "Pencil") {
				isDrawing.current = false;
				ctx?.closePath();
			}
		};

		// const trackCursorHandler = (event: MouseEvent) => {
		// 	const { offsetX, offsetY } = event;
		// 	throttledCursorUpdate(offsetX, offsetY);
		// };

		canvas?.addEventListener("mousedown", mouseDownHandler);
		canvas?.addEventListener("mousemove", mouseMoveHandler);
		canvas?.addEventListener("mouseup", mouseUpHandler);
		canvas?.addEventListener("mouseleave", mouseUpHandler);
		// canvas.addEventListener("mousemove", trackCursorHandler);

		return () => {
			canvas?.removeEventListener("mousedown", mouseDownHandler);
			canvas?.removeEventListener("mousemove", mouseMoveHandler);
			canvas?.removeEventListener("mouseup", mouseUpHandler);
			canvas?.removeEventListener("mouseleave", mouseUpHandler);
			// canvas.removeEventListener("mousemove", trackCursorHandler);
			throttledSendAction.cancel();
		}
	}, [ctx, pickedTool, color, throttledSendAction, connection, username]);

}

export function drawDottedGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
	const spacing = 30;
	const dotRadius = 1;
	ctx.fillStyle = '#dcdcdc';

	for (let x = 0; x < width; x += spacing) {
		for (let y = 0; y < height; y += spacing) {
			ctx.beginPath();
			ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
			ctx.fill();
		}
	}
}