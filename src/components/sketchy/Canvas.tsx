
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Line, Rect, Circle, Object as FabricObject } from "fabric";
import { toast } from "@/components/ui/use-toast";
import { useToolStore } from "@/store/tool-store";
import { useElementStore } from "@/store/element-store";

// Define interface for objects with custom data
interface CustomFabricObject extends FabricObject {
  customData?: {
    isTemp?: boolean;
  };
}

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const { activeTool, activeColor, strokeWidth, fillColor, setActiveTool } = useToolStore();
  const { addElement } = useElementStore();
  const [isPanning, setIsPanning] = useState(false);
  const [lastPosX, setLastPosX] = useState(0);
  const [lastPosY, setLastPosY] = useState(0);
  const [tempObject, setTempObject] = useState<FabricObject | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize the canvas with infinite dimensions
    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#f8f9fa",
      selection: activeTool === "select",
    });
    
    // Enable canvas viewportTransform for panning
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    
    setFabricCanvas(canvas);
    
    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.renderAll();
    };
    
    window.addEventListener("resize", handleResize);
    
    // Add object modification event listeners to detect resizing
    canvas.on('object:scaling', () => {
      setIsResizing(true);
    });
    
    canvas.on('object:rotating', () => {
      setIsResizing(true);
    });
    
    canvas.on('object:modified', () => {
      setIsResizing(false);
    });
    
    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, []);
  
  // Update canvas properties when tools change
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Set drawing mode based on active tool
    fabricCanvas.isDrawingMode = activeTool === "pencil";
    fabricCanvas.selection = activeTool === "select";
    
    // Update drawing brush properties
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    // Add event listener for path creation to add pencil strokes to elements store
    const handlePathCreated = (e: any) => {
      if (activeTool === "pencil" && e.path) {
        addElement({
          id: Date.now().toString(),
          type: "pencil",
          object: e.path.toObject(),
        });
      }
    };
    
    fabricCanvas.on('path:created', handlePathCreated);
    
    return () => {
      if (fabricCanvas) {
        fabricCanvas.off('path:created', handlePathCreated);
      }
    };
    
  }, [activeTool, activeColor, strokeWidth, fabricCanvas, addElement]);
  
  // Setup panning and drawing tools
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Mouse down handler
    const handleMouseDown = (e: any) => {
      // If we're resizing, don't do anything else
      if (isResizing) return;
      
      // Handle panning if active tool is pan
      if (activeTool === "pan") {
        setIsPanning(true);
        fabricCanvas.selection = false;
        setLastPosX(e.e.clientX);
        setLastPosY(e.e.clientY);
        fabricCanvas.setCursor('grab');
      } 
      // Handle shape creation
      else if (activeTool !== "select" && activeTool !== "pencil") {
        // Store the starting point
        const pointer = fabricCanvas.getPointer(e.e);
        const startX = pointer.x;
        const startY = pointer.y;
        
        // Create a temporary shape at the start
        let tempShape;
        
        switch (activeTool) {
          case "rectangle":
            tempShape = new Rect({
              left: startX,
              top: startY,
              width: 0,
              height: 0,
              fill: fillColor === "transparent" ? "" : fillColor,
              stroke: activeColor,
              strokeWidth: strokeWidth,
              strokeUniform: true,
              selectable: false,
              evented: false,
            });
            break;
          case "circle":
            tempShape = new Circle({
              left: startX,
              top: startY,
              radius: 0,
              fill: fillColor === "transparent" ? "" : fillColor,
              stroke: activeColor,
              strokeWidth: strokeWidth,
              strokeUniform: true,
              selectable: false,
              evented: false,
            });
            break;
          case "line":
            tempShape = new Line([startX, startY, startX, startY], {
              stroke: activeColor,
              strokeWidth: strokeWidth,
              strokeUniform: true,
              selectable: false,
              evented: false,
            });
            break;
          default:
            break;
        }
        
        if (tempShape) {
          (tempShape as CustomFabricObject).customData = { isTemp: true };
          fabricCanvas.add(tempShape);
          setTempObject(tempShape);
          
          // Mouse move handler to update shape during drawing
          const handleMouseMove = (e: any) => {
            if (!tempShape) return;
            
            const pointer = fabricCanvas.getPointer(e.e);
            const endX = pointer.x;
            const endY = pointer.y;
            
            if (activeTool === "rectangle") {
              const width = Math.abs(endX - startX);
              const height = Math.abs(endY - startY);
              tempShape.set({
                left: Math.min(startX, endX),
                top: Math.min(startY, endY),
                width: width,
                height: height,
              });
            } else if (activeTool === "circle") {
              const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
              const centerX = (startX + endX) / 2;
              const centerY = (startY + endY) / 2;
              tempShape.set({
                left: centerX - radius,
                top: centerY - radius,
                radius: radius,
              });
            } else if (activeTool === "line") {
              (tempShape as Line).set({ x2: endX, y2: endY });
            }
            
            fabricCanvas.renderAll();
          };
          
          // Mouse up handler to finalize the shape
          const handleMouseUp = () => {
            if (!tempShape) return;
            
            // Remove event listeners
            fabricCanvas.off('mouse:move', handleMouseMove);
            fabricCanvas.off('mouse:up', handleMouseUp);
            
            // Convert the temporary shape to a permanent one with the same properties
            let finalObject;
            
            if (activeTool === "rectangle") {
              // Only create if the rectangle has some size
              if ((tempShape as Rect).width > 0 && (tempShape as Rect).height > 0) {
                finalObject = new Rect({
                  left: tempShape.left,
                  top: tempShape.top,
                  width: (tempShape as Rect).width,
                  height: (tempShape as Rect).height,
                  fill: fillColor === "transparent" ? "" : fillColor,
                  stroke: activeColor,
                  strokeWidth: strokeWidth,
                  strokeUniform: true,
                });
              }
            } else if (activeTool === "circle") {
              // Only create if the circle has some radius
              if ((tempShape as Circle).radius > 0) {
                finalObject = new Circle({
                  left: tempShape.left,
                  top: tempShape.top,
                  radius: (tempShape as Circle).radius,
                  fill: fillColor === "transparent" ? "" : fillColor,
                  stroke: activeColor,
                  strokeWidth: strokeWidth,
                  strokeUniform: true,
                });
              }
            } else if (activeTool === "line") {
              const line = tempShape as Line;
              // Get points which includes x1, y1, x2, y2
              const coords = [line.x1, line.y1, line.x2, line.y2];
              
              // Only create if it's a valid line (has start and end points that differ)
              if (
                coords[0] !== undefined && 
                coords[1] !== undefined && 
                coords[2] !== undefined && 
                coords[3] !== undefined &&
                (coords[0] !== coords[2] || coords[1] !== coords[3])
              ) {
                finalObject = new Line([coords[0], coords[1], coords[2], coords[3]], {
                  stroke: activeColor,
                  strokeWidth: strokeWidth,
                  strokeUniform: true,
                });
              }
            }
            
            // Remove the temporary shape
            fabricCanvas.remove(tempShape);
            
            if (finalObject) {
              // Add the finalized shape
              fabricCanvas.add(finalObject);
              fabricCanvas.setActiveObject(finalObject);
              
              addElement({
                id: Date.now().toString(),
                type: activeTool,
                object: finalObject.toObject(),
              });
              
              // Auto-switch to select tool after drawing
              setActiveTool("select");
            }
            
            // Reset the temporary object
            setTempObject(null);
          };
          
          fabricCanvas.on('mouse:move', handleMouseMove);
          fabricCanvas.on('mouse:up', handleMouseUp);
        }
      }
    };
    
    // Mouse move handler for panning
    const handleMouseMove = (e: any) => {
      if (!isPanning) return;
      
      const transform = fabricCanvas.viewportTransform;
      if (!transform) return;
      
      // Calculate pan amount
      const currentX = e.e.clientX;
      const currentY = e.e.clientY;
      const deltaX = currentX - lastPosX;
      const deltaY = currentY - lastPosY;
      
      // Update pan position
      transform[4] += deltaX;
      transform[5] += deltaY;
      
      // Update last position
      setLastPosX(currentX);
      setLastPosY(currentY);
      
      // Apply transform and render
      fabricCanvas.requestRenderAll();
    };
    
    // Mouse up handler for panning
    const handleMouseUp = () => {
      setIsPanning(false);
      fabricCanvas.setCursor('default');
      fabricCanvas.selection = activeTool === "select";
    };
    
    // Register event handlers
    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);
    
    // Cleanup handlers on unmount or tool change
    return () => {
      if (fabricCanvas) {
        fabricCanvas.off('mouse:down', handleMouseDown);
        fabricCanvas.off('mouse:move', handleMouseMove);
        fabricCanvas.off('mouse:up', handleMouseUp);
        
        // Clean up any temporary objects
        if (tempObject) {
          fabricCanvas.remove(tempObject);
          setTempObject(null);
        }
      }
    };
  }, [activeTool, fabricCanvas, activeColor, strokeWidth, fillColor, addElement, isPanning, lastPosX, lastPosY, tempObject, isResizing, setActiveTool]);
  
  return (
    <div className="w-full h-screen overflow-hidden bg-canvas-background">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
