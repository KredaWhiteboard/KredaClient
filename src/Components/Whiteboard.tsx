import { useRef, useEffect, useState } from "react";
import { drawDottedGrid, useDrawing} from "./useDrawing";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useUser } from "../UserContext";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useZoomPan } from "./useZoomPan";
import { usePanning } from "./usePanning";


type ColorObjectType = {r:number, g:number, b:number, a:number};

function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  const [pickedTool, pickTool] = useState("Pencil");
  const [color, pickColor] = useState({ r: 0, g: 0, b: 0, a: 1 });
  const [thickness, setThickness] = useState(1);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const {username} = useUser();
  const {whiteboardId} = useParams();
  const navigate = useNavigate();
  const pickHandler = (toolId: string) => {
    pickTool(toolId);
  };

  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

    const {scale,offset: zoomOffset}= useZoomPan({
      canvasRef
    });
    
    const { offset: panOffset } = usePanning({
      canvasRef,
      enabled: pickedTool === "Hand",
      scale
    });

    const transform = 
    `translate(${zoomOffset.x + panOffset.x}px, ${zoomOffset.y + panOffset.y}px) ` +
    `scale(${scale})`;

  useEffect(() =>{
    if(!username){
      navigate(`/?returnId=${whiteboardId}`);
    }
  },[])

  useEffect(() => {
      const canvas = canvasRef.current;
      const bgcanvas = backgroundCanvasRef.current;
      if (!canvas || !bgcanvas) return;
      
      if (!username)
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bgcanvas.width = window.innerWidth;
      bgcanvas.height = window.innerHeight;
      
      const ctx = canvas.getContext("2d");
      const bgctx = bgcanvas.getContext("2d");

      if (ctx && bgctx) {
          drawDottedGrid(bgctx, canvas.width, canvas.height);
          setCtx(ctx);
      }

      let connection: HubConnection;

      const connectToHub = async () => {
          if (username && whiteboardId) {
              const connectionString = `http://localhost:5000/whiteboards/${whiteboardId}?username=${username}`;
              
              connection = new HubConnectionBuilder()
                  .withUrl(connectionString)
                  .withAutomaticReconnect()
                  .build();
              
              setConnection(connection);

            connection.start();
          }
      };

      connectToHub();

      return () => {
          if (connection) {
              connection.stop();
          }
      };
  }, [username, whiteboardId]);


  useDrawing(pickedTool, canvasRef, cursorCanvasRef, ctx, color, thickness, connection, username);

  return (
    <div id="Board">
      <Header />
      <canvas 
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          zIndex: 1,
          transformOrigin: "0 0",
          transform: transform,
          cursor: pickedTool === "Pencil"
            ? "url(/pencil.svg) 0 16, crosshair"
            : pickedTool === "Hand"
            ? "grab"
            : "default",
        }}
      ></canvas>
      <canvas
        ref={cursorCanvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: 'none' }}
      />
      <canvas
        ref={backgroundCanvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 3, pointerEvents: 'none' }}
      />
      <Footer
        selectedTool={pickedTool}
        changeTool={pickHandler}
        changeColor={pickColor}
        setThickness={setThickness}
        />
    </div>
  );
}

type FooterProps = {
  selectedTool: string;
  changeTool: (toolId: string) => void;
  changeColor: (newColor: ColorObjectType) => void;
  setThickness: (thickness: number) => void;
};

function Header() {
  return (
    <div id="Header">
      <img src="/logo_1.svg" />
      <img src="/person-lines-fill.svg" />
    </div>
  );
}

function Footer({ selectedTool, changeTool, changeColor, setThickness }: FooterProps) {
  const [isPanelVisible, setPanelVisible] = useState(false);

  const tools = [
    { id: "Arrow", source: "/cursor.svg" },
    { id: "Hand", source: "/Hand.svg" },
    { id: "Pencil", source: "/pencil.svg" },
    { id: "Rubber", source: "/Rubber.svg" },
    { id: "Image", source: "/image.svg" },
    { id: "Text", source: "/Text.svg" },
  ];

  const zoom = [
    { id: "Plus", source: "/plus-lg.svg" },
    { id: "Minus", source: "/dash.svg" },
  ];

  const colors = [
    { id: "Black", r: 0, g: 0, b: 0, a: 1, thickness: 1},
    { id: "Red", r: 255, g: 0, b: 0, a: 1, thickness: 1 },
    { id: "Green", r: 0, g: 255, b: 0, a: 1, thickness: 1 },
    { id: "Blue", r: 0, g: 0, b: 255, a: 1, thickness: 1 },
    { id: "Orange", r: 255, g: 165, b: 0, a: 1, thickness: 1 },
    { id: "Purple", r: 128, g: 0, b: 128, a: 0.2, thickness: 6 },
  ];

  const clickHandler = (color: ColorObjectType , thickness:number ) => {
    changeColor(color);
    setThickness(thickness);
  };

  return (
    <div id="Footer">
      <div id="Scale">
        {zoom.map((sign) => (
          <img key={sign.id} src={sign.source} alt={sign.id} />
        ))}
      </div>
      <div id="PencilBox">
        {tools.map((tool) => {
          const isActive = tool.id === selectedTool;
          if (tool.id === "Pencil") {
            return (
              <div
                key={tool.id}
                className="pencil-container"
                onMouseLeave={() => setPanelVisible(false)}
              >
                <img
                  src={tool.source}
                  alt={tool.id}
                  className={isActive ? "active" : ""}
                  onClick={() => changeTool(tool.id)}
                  onMouseEnter={() => setPanelVisible(true)}
                />
                
                {isPanelVisible && selectedTool === "Pencil" && (
                  <div id="Panel">
                    <div id="Colors">
                      {colors.map((color) => {
                        const alpha = color.a > 1 ? color.a / 255 : color.a;
                        const rgbaColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                        const clr = {r: color.r, g: color.g, b: color.b, a: color.a};
                        return(
                        <div
                          key={color.id}
                          style={{ backgroundColor: rgbaColor}}
                          onClick={() => clickHandler(clr, color.thickness)}
                        />
                      )})}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return (
            <img
              key={tool.id}
              src={tool.source}
              alt={tool.id}
              className={isActive ? "active" : ""}
              onClick={() => changeTool(tool.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Whiteboard;
