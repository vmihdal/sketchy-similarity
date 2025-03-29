
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToolStore } from "@/store/tool-store";
import { Circle, MousePointer, Pencil, Square, Trash2, Undo, X, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorPicker } from "./ColorPicker";
import { useElementStore } from "@/store/element-store";
import { toast } from "@/components/ui/use-toast";

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
  
  const { clearElements, removeSelectedElement } = useElementStore();

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
          color={activeColor} 
          onChange={setActiveColor} 
        />
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Width</span>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 px-2">
        <ColorPicker 
          label="Fill" 
          color={fillColor} 
          onChange={setFillColor} 
          allowTransparent 
        />
      </div>

      <div className="flex space-x-1 border-l border-gray-200 pl-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Handle undo (placeholder for future implementation)
                toast({
                  title: "Undo not implemented",
                  description: "Undo functionality will be added in a future update.",
                });
              }}
              className="rounded-md hover:bg-gray-100"
            >
              <Undo className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Undo (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                removeSelectedElement();
                toast({
                  title: "Object deleted",
                  description: "Selected object has been removed from the canvas.",
                });
              }}
              className="rounded-md hover:bg-gray-100"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Delete selected (Del)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                clearElements();
                toast({
                  title: "Canvas cleared",
                  description: "All elements have been removed from the canvas.",
                });
              }}
              className="rounded-md hover:bg-gray-100"
            >
              <Trash2 className="h-5 w-5 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Clear canvas</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
