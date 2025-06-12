import { useRef, useEffect, useState } from "react";
import { useDrawing } from "./useDrawing";
import { HubConnection, HubConnectionBuilder } from "@microsoft/signalr";
import { useUser } from "../UserContext";
import { useParams } from "react-router-dom";

function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pickedTool, pickTool] = useState("arrow");
  const [color, pickColor] = useState("black");
  const [thickness, setThickness] = useState(1);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const {username} = useUser();
  const {whiteboardId} = useParams();
  
  const pickHandler = (toolId: string) => {
    pickTool(toolId);
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    setCtx(ctx);
    if(username && whiteboardId){
    const connectionString =`http://localhost:5000/whiteboard/${whiteboardId}?${username}`;
    const newConnection = new HubConnectionBuilder()
      .withUrl(connectionString)
      .withAutomaticReconnect()
      .build();
    
    setConnection(newConnection);

     newConnection.start()
    .then(() => {
      console.log("Połączenie z SignalR Hub nawiązane pomyślnie!");
    })
    .catch(e => {
      console.error("Błąd podczas nawiązywania połączenia z SignalR: ", e);
    });
  return () => {
    newConnection.stop();
  };
}}, [username, whiteboardId]);

  useDrawing(pickedTool, canvasRef, ctx, color, thickness, connection, username);

  return (
    <div id="Board">
      <Header />
      <canvas ref={canvasRef}></canvas>
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
  changeColor: (newColor: string) => void;
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
    { id: "arrow", source: "/cursor.svg" },
    { id: "hand", source: "/Hand.svg" },
    { id: "pencil", source: "/pencil.svg" },
    { id: "rubber", source: "/Rubber.svg" },
    { id: "image", source: "/image.svg" },
    { id: "text", source: "/Text.svg" },
  ];

  const magnification = [
    { id: "plus", source: "/plus-lg.svg" },
    { id: "minus", source: "/dash.svg" },
  ];

  const colors = [
    { id: "black", r: 0, g: 0, b: 0, a: 1, thickness: 1},
    { id: "red", r: 255, g: 0, b: 0, a: 1, thickness: 1 },
    { id: "green", r: 0, g: 255, b: 0, a: 1, thickness: 1 },
    { id: "blue", r: 0, g: 0, b: 255, a: 1, thickness: 1 },
    { id: "orange", r: 255, g: 165, b: 0, a: 1, thickness: 1 },
    { id: "purple", r: 128, g: 0, b: 128, a: 10, thickness: 6 },
  ];

  const clickHandler = (color:string , thickness:number ) => {
    changeColor(color);
    setThickness(thickness);
  };

  return (
    <div id="Footer">
      <div id="Scale">
        {magnification.map((sign) => (
          <img key={sign.id} src={sign.source} alt={sign.id} />
        ))}
      </div>
      <div id="PencilBox">
        {tools.map((tool) => {
          const isActive = tool.id === selectedTool;
          if (tool.id === "pencil") {
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
                
                {isPanelVisible && selectedTool === "pencil" && (
                  <div id="Panel">
                    <div id="colors">
                      {colors.map((color) => {
                        const alpha = color.a > 1 ? color.a / 255 : color.a;
                        const rgbaColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`
                        return(
                        <div
                          key={color.id}
                          style={{ backgroundColor: rgbaColor}}
                          onClick={() => clickHandler(rgbaColor, color.thickness)}
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
