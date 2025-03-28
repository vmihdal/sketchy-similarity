
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, Circle, Object as FabricObject } from "fabric";
import { toast } from "@/components/ui/use-toast";
import { useToolStore } from "@/store/tool-store";
import { useElementStore } from "@/store/element-store";

// Define interface for objects with custom data
interface CustomFabricObject extends FabricObject {
  customData?: {
    isGrid?: boolean;
  };
}

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const { activeTool, activeColor, strokeWidth, fillColor } = useToolStore();
  const { addElement } = useElementStore();
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize the canvas
    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#f8f9fa",
      isDrawingMode: activeTool === "pencil",
    });
    
    // Create grid pattern
    createGrid(canvas);
    
    // Initialize the freeDrawingBrush properties
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }
    
    setFabricCanvas(canvas);
    
    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      createGrid(canvas);
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, [activeColor, strokeWidth, activeTool]);
  
  // Create grid pattern
  const createGrid = (canvas: FabricCanvas) => {
    const gridSize = 20;
    const canvasWidth = canvas.getWidth() || window.innerWidth;
    const canvasHeight = canvas.getHeight() || window.innerHeight;
    
    // Clear existing grid
    canvas.getObjects().forEach(obj => {
      const customObj = obj as CustomFabricObject;
      if (customObj.customData?.isGrid) {
        canvas.remove(obj);
      }
    });
    
    // Create grid
    for (let i = 0; i < canvasWidth / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, canvasHeight], {
        stroke: "#deddda",
        selectable: false,
        evented: false,
        strokeWidth: 0.5,
      });
      (line as CustomFabricObject).customData = { isGrid: true };
      canvas.add(line);
    }
    
    for (let i = 0; i < canvasHeight / gridSize; i++) {
      const line = new Line([0, i * gridSize, canvasWidth, i * gridSize], {
        stroke: "#deddda",
        selectable: false,
        evented: false,
        strokeWidth: 0.5,
      });
      (line as CustomFabricObject).customData = { isGrid: true };
      canvas.add(line);
    }
    
    // Send grid to back
    canvas.getObjects().forEach(obj => {
      const customObj = obj as CustomFabricObject;
      if (customObj.customData?.isGrid) {
        canvas.sendObjectToBack(obj);
      }
    });
    
    canvas.renderAll();
  };
  
  // Update canvas based on active tool
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Set drawing mode
    fabricCanvas.isDrawingMode = activeTool === "pencil";
    
    if (activeTool === "pencil" && fabricCanvas.freeDrawingBrush) {
      // Make sure freeDrawingBrush exists before setting properties
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    // Setup shape creation handlers
    const handleMouseDown = (e: any) => {
      if (activeTool !== "select" && activeTool !== "pencil") {
        // Store the starting point
        const pointer = fabricCanvas.getPointer(e.e);
        const startX = pointer.x;
        const startY = pointer.y;
        
        // Create shape on mouse up
        const handleMouseUp = (e: any) => {
          const pointer = fabricCanvas.getPointer(e.e);
          const endX = pointer.x;
          const endY = pointer.y;
          
          let object;
          
          switch (activeTool) {
            case "rectangle":
              object = new Rect({
                left: Math.min(startX, endX),
                top: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY),
                fill: fillColor === "transparent" ? "" : fillColor,
                stroke: activeColor,
                strokeWidth: strokeWidth,
                strokeUniform: true,
              });
              break;
            case "circle":
              const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
              const centerX = (startX + endX) / 2;
              const centerY = (startY + endY) / 2;
              object = new Circle({
                left: centerX - radius,
                top: centerY - radius,
                radius: radius,
                fill: fillColor === "transparent" ? "" : fillColor,
                stroke: activeColor,
                strokeWidth: strokeWidth,
                strokeUniform: true,
              });
              break;
            case "line":
              object = new Line([startX, startY, endX, endY], {
                stroke: activeColor,
                strokeWidth: strokeWidth,
                strokeUniform: true,
              });
              break;
            default:
              break;
          }
          
          if (object) {
            fabricCanvas.add(object);
            addElement({
              id: Date.now().toString(),
              type: activeTool,
              object: object.toObject(),
            });
          }
          
          // Cleanup events
          fabricCanvas.off("mouse:up", handleMouseUp);
        };
        
        fabricCanvas.once("mouse:up", handleMouseUp);
      }
    };
    
    if (activeTool !== "select" && activeTool !== "pencil") {
      fabricCanvas.on("mouse:down", handleMouseDown);
    } else {
      fabricCanvas.off("mouse:down", handleMouseDown);
    }
    
    // Cleanup
    return () => {
      if (fabricCanvas) {
        fabricCanvas.off("mouse:down", handleMouseDown);
      }
    };
  }, [activeTool, fabricCanvas, activeColor, strokeWidth, fillColor, addElement]);
  
  return (
    <div className="w-full h-screen overflow-hidden bg-canvas-background">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
