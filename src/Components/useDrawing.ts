import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";

type ColorObjectType = { r: number, g: number, b: number, a: number };

type SentUserAction = {
	X: number;
	Y: number;
	Tool: 'Pencil' | 'Rubber' | null;
	BrushSize?: number | null;
	R?: number | null,
	G?: number | null,
	B?: number | null,
	A?: number | null,
};

type ReceivedUserAction = SentUserAction & { username: string };

export function useDrawing(
	pickedTool: string,
	canvasRef: React.RefObject<HTMLCanvasElement | null>,
	ctx: CanvasRenderingContext2D | null,
	color: ColorObjectType,
	thickness: number,
	connection: HubConnection | null,
	username: string | null
) {
	const isDrawing = useRef(false);
	const remoteUsersState = useRef(new Map<string, ReceivedUserAction>());

	const throttledSendAction = useCallback(
		throttle((action: SentUserAction) => {
			if (connection) {
				try {
					connection.invoke("SendUserAction", action);
				} catch (e) {
					console.error("Błąd wysyłania danych: ", e);
				}
			}
		}, 50),
		[connection]
	);

	const drawCursor = (ctx: CanvasRenderingContext2D, x: number, y: number, username: string) => {
		ctx.fillStyle = "black";
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x + 10, y + 25);
		ctx.lineTo(x + 20, y + 20);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.font = '14px sans-serif';
		ctx.fillText(username, x + 25, y + 35);
	};

	useEffect(() => {
		if (!canvasRef.current || !ctx || !username) return;
		const canvas = canvasRef.current;

		const mouseDownHandler = (event: MouseEvent) => {
			if (pickedTool === "Pencil" || pickedTool === "Rubber") {
				isDrawing.current = true;
				ctx.beginPath();
				ctx.moveTo(event.offsetX, event.offsetY);

				const startAction: SentUserAction = {
					X: event.offsetX,
					Y: event.offsetY,
					Tool: pickedTool as 'Pencil' | 'Rubber',
					BrushSize: pickedTool === 'Pencil' ? thickness : 35,
					R: color.r, G: color.g, B: color.b, A: color.a,
				};
				if (connection) connection.invoke("SendUserAction", startAction);
			}
		};

		const mouseMoveHandler = (event: MouseEvent) => {
			const { offsetX, offsetY } = event;
			let action: SentUserAction;

			if (isDrawing.current && (pickedTool === "Pencil" || pickedTool === "Rubber")) {
				if (pickedTool === "Pencil") {
					ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a > 1 ? color.a / 255 : color.a})`;
					ctx.lineWidth = thickness;
					ctx.lineTo(offsetX, offsetY);
					ctx.stroke();
				} else if (pickedTool === "Rubber") {
					ctx.clearRect(offsetX - 17.5, offsetY - 17.5, 35, 35);
				}

				action = {
					X: offsetX,
					Y: offsetY,
					Tool: pickedTool as 'Pencil' | 'Rubber',
					BrushSize: pickedTool === 'Pencil' ? thickness : 35,
					R: color.r, G: color.g, B: color.b, A: color.a,
				};
			} else {
				action = {
					X: offsetX,
					Y: offsetY,
					Tool: null,
					BrushSize: null,
					R: null, G: null, B: null, A: null,
				};
			}
			throttledSendAction(action);
		};

		const mouseUpHandler = (event: MouseEvent) => {
			if (isDrawing.current) {
				isDrawing.current = false;
				ctx.closePath();

				const stopAction: SentUserAction = {
					X: event.offsetX,
					Y: event.offsetY,
					Tool: null,
					BrushSize: null,
					R: null, G: null, B: null, A: null,
				};
				if (connection) connection.invoke("SendUserAction", stopAction);
			}
		};

		canvas.addEventListener("mousedown", mouseDownHandler);
		canvas.addEventListener("mousemove", mouseMoveHandler);
		canvas.addEventListener("mouseup", mouseUpHandler);
		canvas.addEventListener("mouseleave", mouseUpHandler);

		return () => {
			canvas.removeEventListener("mousedown", mouseDownHandler);
			canvas.removeEventListener("mousemove", mouseMoveHandler);
			canvas.removeEventListener("mouseup", mouseUpHandler);
			canvas.removeEventListener("mouseleave", mouseUpHandler);
			throttledSendAction.cancel();
		};
	}, [ctx, pickedTool, color, thickness, connection, username, throttledSendAction]);

	useEffect(() => {
		if (!connection || !ctx || !username) return;

		const handleRemoteAction = (actionData: ReceivedUserAction) => {
			if (!actionData.username || actionData.username === username || actionData.X === undefined || actionData.Y === undefined) return;

			const remoteUsername = actionData.username;
			const userState = remoteUsersState.current.get(remoteUsername);
			const wasDrawing = userState?.Tool === 'Pencil';

			ctx.save();
			try {
				if (actionData.Tool === "Pencil" && actionData.R != null && actionData.G != null && actionData.B != null && actionData.A != null) {
					ctx.strokeStyle = `rgba(${actionData.R}, ${actionData.G}, ${actionData.B}, ${actionData.A > 1 ? actionData.A / 255 : 1})`;
					ctx.lineWidth = actionData.BrushSize ?? 1;
					ctx.lineCap = "round";
					ctx.lineJoin = "round";

					if (!wasDrawing) {
						ctx.beginPath();
						ctx.moveTo(actionData.X, actionData.Y);
						ctx.lineTo(actionData.X, actionData.Y);
						ctx.stroke();
					} else if (userState) {
						ctx.beginPath();
						ctx.moveTo(userState.X, userState.Y);
						ctx.lineTo(actionData.X, actionData.Y);
						ctx.stroke();
					}
				} else if (actionData.Tool === "Rubber") {
					ctx.clearRect(actionData.X - 17.5, actionData.Y - 17.5, 35, 35);
				}
			} finally {
				ctx.restore();
			}

			remoteUsersState.current.set(remoteUsername, actionData);
		};

		connection.on("ReceiveUserAction", handleRemoteAction);

		return () => {
			connection.off("ReceiveUserAction", handleRemoteAction);
		};

	}, [connection, ctx, username]);
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
