
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToolStore } from "@/store/tool-store";
import { Circle, MousePointer, Pencil, Square, X, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "./ColorPicker";
import { useElementStore } from "@/store/element-store";
import { useEffect, useState } from "react";

export const Toolbar = () => {
  const { 
    activeTool, 
    setActiveTool, 
    activeColor, 
    setActiveColor,
    strokeWidth,
    setStrokeWidth,
    fillColor,
    setFillColor 
  } = useToolStore();
  
  const { selectedElementId, elements, updateElement } = useElementStore();
  
  // Local state for currently selected object properties
  const [currentStrokeColor, setCurrentStrokeColor] = useState(activeColor);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(strokeWidth);
  const [currentFillColor, setCurrentFillColor] = useState(fillColor);

  // Update local state when a different object is selected
  useEffect(() => {
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && selectedElement.object) {
        // Get the properties from the selected object
        const stroke = selectedElement.object.stroke || activeColor;
        const width = selectedElement.object.strokeWidth || strokeWidth;
        const fill = selectedElement.object.fill || fillColor;
        
        // Update local state
        setCurrentStrokeColor(stroke);
        setCurrentStrokeWidth(width); 
        setCurrentFillColor(fill === "" ? "transparent" : fill);
      }
    } else {
      // If no object is selected, use the global settings
      setCurrentStrokeColor(activeColor);
      setCurrentStrokeWidth(strokeWidth);
      setCurrentFillColor(fillColor);
    }
  }, [selectedElementId, elements, activeColor, strokeWidth, fillColor]);

  // Apply changes to the selected object
  const handleStrokeColorChange = (color: string) => {
    setCurrentStrokeColor(color);
    
    if (selectedElementId) {
      updateElement(selectedElementId, {
        object: { ...elements.find(el => el.id === selectedElementId)?.object, stroke: color }
      });
    } else {
      setActiveColor(color);
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    setCurrentStrokeWidth(width);
    
    if (selectedElementId) {
      updateElement(selectedElementId, {
        object: { ...elements.find(el => el.id === selectedElementId)?.object, strokeWidth: width }
      });
    } else {
      setStrokeWidth(width);
    }
  };

  const handleFillColorChange = (color: string) => {
    setCurrentFillColor(color);
    
    if (selectedElementId) {
      updateElement(selectedElementId, {
        object: { 
          ...elements.find(el => el.id === selectedElementId)?.object, 
          fill: color === "transparent" ? "" : color 
        }
      });
    } else {
      setFillColor(color);
    }
  };

  const tools = [
    { name: "select", icon: MousePointer, tooltip: "Select (V)" },
    { name: "pan", icon: Move, tooltip: "Pan (H)" },
    { name: "pencil", icon: Pencil, tooltip: "Pencil (P)" },
    { name: "rectangle", icon: Square, tooltip: "Rectangle (R)" },
    { name: "circle", icon: Circle, tooltip: "Circle (C)" },
    { name: "line", icon: X, tooltip: "Line (L)" },
  ];

  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 top-4 bg-white rounded-md shadow-toolbar flex items-center p-1 z-10">
      <div className="flex space-x-1 border-r border-gray-200 pr-2">
        {tools.map((tool) => (
          <Tooltip key={tool.name}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTool(tool.name as any)}
                className={cn(
                  "rounded-md hover:bg-gray-100",
                  activeTool === tool.name && "bg-gray-100"
                )}
              >
                <tool.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tool.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex items-center space-x-2 px-2 border-r border-gray-200">
        <ColorPicker 
          label="Stroke" 
          color={currentStrokeColor} 
          onChange={handleStrokeColorChange} 
        />
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Width</span>
          <input
            type="range"
            min="1"
            max="20"
            value={currentStrokeWidth}
            onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 px-2">
        <ColorPicker 
          label="Fill" 
          color={currentFillColor} 
          onChange={handleFillColorChange} 
          allowTransparent 
        />
      </div>
    </div>
  );
};
