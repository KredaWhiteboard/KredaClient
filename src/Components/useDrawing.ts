import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";


type ColorObjectType = { r: number, g: number, b: number, a: number };

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
	const remoteUsersState = useRef(new Map());

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
		if (!canvasRef.current || !ctx) return;
		const canvas = canvasRef.current;

		const mouseDownHandler = (event: MouseEvent) => {
			if (pickedTool === "Pencil") {
				const offsetX = event.offsetX;
				const offsetY = event.offsetY;
				ctx?.beginPath();
				ctx.lineWidth = thickness;
				ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a > 1 ? color.a / 255 : color.a})`;
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
						X: offsetX,
						Y: offsetY,
						Mode: pickedTool === "pencil" ? "Pencil" : "Eraser",
						Size: thickness,
						R: color.r,
						G: color.g,
						B: color.b,
						A: color.a,
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

		canvas?.addEventListener("mousedown", mouseDownHandler);
		canvas?.addEventListener("mousemove", mouseMoveHandler);
		canvas?.addEventListener("mouseup", mouseUpHandler);
		canvas?.addEventListener("mouseleave", mouseUpHandler);

		return () => {
			canvas?.removeEventListener("mousedown", mouseDownHandler);
			canvas?.removeEventListener("mousemove", mouseMoveHandler);
			canvas?.removeEventListener("mouseup", mouseUpHandler);
			canvas?.removeEventListener("mouseleave", mouseUpHandler);
			throttledSendAction.cancel();
		}
	}, [ctx, pickedTool, color, throttledSendAction, connection, username]);


	useEffect(() => {
		if (!connection || !ctx) return;

		const handleRemoteAction = (actionData: { username: string, x: number, y: number, Mode: string, Size: number, R: number, G: Number, B: number, A: number }) => {
			const { username: remoteUsername, x, y, Mode, Size, R, G, B, A } = actionData;
			if (remoteUsername === username) return;

			ctx.save();
			if (Mode == "Pencil") {
				ctx.strokeStyle = `rgba(${actionData.R}, ${actionData.G}, ${actionData.B}, ${actionData.A > 1 ? actionData.A / 255 : actionData.A})`;
				ctx.lineWidth = actionData.Size;
				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				const userJustStartedDrawing = isDrawing && !remoteUsersState.current.get(remoteUsername)?.isDrawing;
				if (userJustStartedDrawing) {
					ctx.beginPath();
					ctx.moveTo(x, y);
				} else if (isDrawing) {
					const lastPos = remoteUsersState.current.get(remoteUsername);
					if (lastPos) {
						ctx.beginPath();
						ctx.moveTo(lastPos.x, lastPos.y);
						ctx.lineTo(x, y);
						ctx.stroke();

					}
				}
			}

			else {

				drawCursor(ctx, x, y, remoteUsername);
			}
			remoteUsersState.current.set(remoteUsername, { x, y, isDrawing });
			ctx.restore();
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