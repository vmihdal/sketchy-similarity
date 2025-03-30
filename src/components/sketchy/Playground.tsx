
import React, { useEffect, useRef } from "react";
import { useCanvas } from "./hooks/useCanvas";
import { useToolStore } from "@/store/tool-store";
import { handleKeyboardShortcut } from "./utils";
import { 
  Canvas as FabricCanvas, 
  Object as FabricObject,
  Polyline,
  Circle
} from 'fabric';

// Add custom properties to FabricCanvas
interface ExtendedCanvas extends FabricCanvas {
  isDragging?: boolean;
  lastPosX?: number;
  lastPosY?: number;
}

export const Playground: React.FC = () => {
  const { setActiveTool } = useToolStore();
  const canvasRef = useRef<ExtendedCanvas | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = new FabricCanvas("canvas", {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 'white',
      selection: false,
      preserveObjectStacking: true,
    }) as ExtendedCanvas;

    canvasRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    let points = [
      { x: 100, y: 100 }, // Start point
      { x: 250, y: 200 }, // Midpoint
      { x: 400, y: 300 }  // End point
    ];
    
    // Create polyline
    let polyline = new Polyline(points, {
      stroke: "red",
      fill: "transparent",
      strokeWidth: 2,
      selectable: false,
      evented: false,
      objectCaching: false
    });

    // Add polyline to canvas
    canvas.add(polyline);

    function createControlPoint(x, y, index) {
      let control = new Circle({
        left: x,
        top: y,
        radius: 6,
        fill: "white",
        stroke: "blue",
        strokeWidth: 1,
        originX: "center",
        originY: "center",
        hasControls: false,
        hasBorders: false,
        selectable: true,
      });
    
      // Update polyline on dragging the control point
      control.on("moving", function () {
        points[index] = { x: control.left, y: control.top }; // Update the polyline's points
        polyline.set({ points: points, dirty: true});
        canvas.renderAll();
      });
    
      return control;
    }

    const controlPoints = points.map((p, index) => createControlPoint(p.x, p.y, index));

    canvas.add(...controlPoints);

    canvas.renderAll();

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="sketchy-app relative w-screen h-screen overflow-hidden">
      <div className="canvas-container w-full h-full">
        <canvas id="canvas" />
      </div>
    </div>
  );
};
