import type { HubConnection } from "@microsoft/signalr";
import { useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";

type ColorObjectType = { r: number, g: number, b: number, a: number };

type SentUserAction = {
	x: number;
	y: number;
	tool: 'Pencil' | 'Rubber' | null;
	brushSize?: number | null;
	r?: number | null,
	g?: number | null,
	b?: number | null,
	a?: number | null,
};

type ReceivedUserAction = SentUserAction & { username: string };

export function useDrawing(
	pickedTool: string,
	canvasRef: React.RefObject<HTMLCanvasElement | null>,
	cursorCanvasRef: React.RefObject<HTMLCanvasElement | null>,
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

	//GLOWNA LOGIKA RYSOWANIA
	useEffect(() => {
		console.log("🔔 useDrawing efekt, ctx:", ctx, "tool:", pickedTool);
		console.log("🔍 username:", username);

		if (!canvasRef.current || !ctx || !username) return;
		const canvas = canvasRef.current;

		const mouseDownHandler = (event: MouseEvent) => {
			console.log("🔴 mousedown", event.offsetX, event.offsetY);
			if (pickedTool === "Pencil" || pickedTool === "Rubber") {
				isDrawing.current = true;

				ctx.beginPath();
				ctx.moveTo(event.offsetX, event.offsetY);

				const startAction: SentUserAction = {
					x: event.offsetX,
					y: event.offsetY,
					tool: pickedTool as 'Pencil' | 'Rubber',
					brushSize: pickedTool === 'Pencil' ? thickness : 35,
					r: color.r, g: color.g, b: color.b, a: color.a,
				};
				if (connection) connection.invoke("SendUserAction", startAction);
			}

		};

		const mouseMoveHandler = (event: MouseEvent) => {
			console.log("🟢 mousemove", event.offsetX, event.offsetY, "drawing?", isDrawing.current);
			const { offsetX, offsetY } = event;
			let action: SentUserAction;

			if (isDrawing.current && (pickedTool === "Pencil" || pickedTool === "Rubber")) {
				console.log("mousemove", event.offsetX, event.offsetY);

				if (pickedTool === "Pencil") {
					ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a > 1 ? color.a / 255 : color.a})`;
					ctx.lineWidth = thickness;
					ctx.lineTo(offsetX, offsetY);
					ctx.stroke();
				} else if (pickedTool === "Rubber") {
					ctx.clearRect(offsetX - 17.5, offsetY - 17.5, 35, 35);
				}

				action = {
					x: offsetX,
					y: offsetY,
					tool: pickedTool as 'Pencil' | 'Rubber',
					brushSize: pickedTool === 'Pencil' ? thickness : 35,
					r: color.r, g: color.g, b: color.b, a: color.a,
				};
			} else {
				action = {
					x: offsetX,
					y: offsetY,
					tool: null,
					brushSize: null,
					r: null, g: null, b: null, a: null,
				};
			}
			throttledSendAction(action);
		};

		const mouseUpHandler = (event: MouseEvent) => {
			console.log("⚫ mouseup");
			if (isDrawing.current) {
				console.log("mouseup");
				isDrawing.current = false;
				ctx.closePath();

				const stopAction: SentUserAction = {
					x: event.offsetX,
					y: event.offsetY,
					tool: null,
					brushSize: null,
					r: null, g: null, b: null, a: null,
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
	//PRZECHWYTYWANIE DZIALAN UZYTKOWNIKOW
	useEffect(() => {
		if (!connection || !ctx) return;
		const handleRemoteAction = (actionData: ReceivedUserAction) => {
			const remoteUsername = actionData.username;
			const userState = remoteUsersState.current.get(remoteUsername);

			if (username != remoteUsername && actionData.tool === "Pencil" && actionData.r != null && actionData.g != null && actionData.b != null && actionData.a != null && actionData.brushSize != null) {
				ctx.beginPath();
				ctx.lineCap = "round";
				ctx.lineJoin = "round";
				ctx.lineWidth = actionData.brushSize;
				ctx.strokeStyle = `rgba(${actionData.r}, ${actionData.g}, ${actionData.b}, ${actionData.a > 1 ? actionData.a / 255 : 1})`;

				if (userState && userState.tool === 'Pencil') {
					ctx.moveTo(userState.x, userState.y);
					ctx.lineTo(actionData.x, actionData.y);
				} else {
					ctx.moveTo(actionData.x, actionData.y);
					ctx.lineTo(actionData.x, actionData.y);
				}
				ctx.stroke();
				ctx.closePath();

			} else if (actionData.tool === "Rubber") {
				ctx.clearRect(actionData.x - 17.5, actionData.y - 17.5, 35, 35);
			}

			remoteUsersState.current.set(remoteUsername, actionData);
		};

		connection.on("ReceiveUserAction", handleRemoteAction);

		return () => {
			connection.off("ReceiveUserAction", handleRemoteAction);
		};

	}, [connection, ctx, username]);
	//KURSOR
	useEffect(() => {
		if (!cursorCanvasRef.current || !username) return;

		const cursorCanvas = cursorCanvasRef.current;
		const cursorCtx = cursorCanvas.getContext('2d');
		if (!cursorCtx) return;

		cursorCanvas.width = window.innerWidth;
		cursorCanvas.height = window.innerHeight;

		let animationFrameId: number;

		const drawCursors = () => {
			cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

			remoteUsersState.current.forEach((userAction, uname) => {
				if (uname === username) return;

				const { x, y } = userAction;
				cursorCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
				cursorCtx.shadowBlur = 5;
				cursorCtx.fillStyle = 'blue';
				cursorCtx.beginPath();
				cursorCtx.moveTo(x, y);
				cursorCtx.lineTo(x + 12, y + 12);
				cursorCtx.lineTo(x, y + 17);
				cursorCtx.closePath();
				cursorCtx.fill();
				cursorCtx.shadowBlur = 0;
				cursorCtx.fillStyle = 'blue';
				cursorCtx.font = "12px Arial";
				cursorCtx.fillText(uname, x + 20, y + 34);
			});

			animationFrameId = requestAnimationFrame(drawCursors);
		};

		drawCursors();

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [username]);
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
