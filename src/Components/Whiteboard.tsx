import { useRef, useEffect, useState } from "react";
import { useDrawing } from "./useDrawing";

function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pickedTool, pickTool] = useState("arrow");
  const [color, pickColor] = useState("black");
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

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
  }, []);

  useDrawing(pickedTool, canvasRef, ctx, color);

  return (
    <div id="Board">
      <Header />
      <canvas ref={canvasRef}></canvas>
      <Footer
        selectedTool={pickedTool}
        changeTool={pickHandler}
        changeColor={pickColor}
      />
    </div>
  );
}

type FooterProps = {
  selectedTool: string;
  changeTool: (toolId: string) => void;
  changeColor: (newColor: string) => void;
};

function Header() {
  return (
    <div id="Header">
      <img src="/logo_1.svg" />
      <img src="/person-lines-fill.svg" />
    </div>
  );
}

function Footer({ selectedTool, changeTool, changeColor }: FooterProps) {
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
    { id: "black", r: 0, g: 0, b: 0, a: 1 },
    { id: "red", r: 255, g: 0, b: 0, a: 1 },
    { id: "green", r: 0, g: 255, b: 0, a: 1 },
    { id: "blue", r: 0, g: 0, b: 255, a: 1 },
    { id: "orange", r: 255, g: 165, b: 0, a: 1 },
    { id: "purple", r: 128, g: 0, b: 128, a: 64 },
  ];

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
                      {colors.map((color) => (
                        <div
                          key={color.id}
                          style={{ backgroundColor: color.id }}
                          onClick={() => changeColor(color.id)}
                        />
                      ))}
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
