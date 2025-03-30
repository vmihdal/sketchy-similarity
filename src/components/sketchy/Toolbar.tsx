
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToolStore } from "@/store/tool-store";
import { Circle, MousePointer, Pencil, Square, Slash, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useElementStore } from "@/store/element-store";

export const Toolbar = () => {
  const { activeTool, setActiveTool } = useToolStore();
  const { deselectElements } = useElementStore();
  
  const tools = [
    { name: "pan", icon: Hand, tooltip: "Pan (H)" },
    { name: "select", icon: MousePointer, tooltip: "Select (V)" },
    // { name: "pencil", icon: Pencil, tooltip: "Pencil (P)" },
    { name: "rectangle", icon: Square, tooltip: "Rectangle (R)" },
    { name: "circle", icon: Circle, tooltip: "Circle (C)" },
    { name: "line", icon: Slash, tooltip: "Line (L)" },
  ];

  return (
    <div className="fixed left-1/2 transform -translate-x-1/2 top-4 bg-white rounded-md shadow-toolbar flex items-center p-1 z-10">
      <div className="flex space-x-1">
        {tools.map((tool) => (
          <Tooltip key={tool.name}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  deselectElements()
                  setActiveTool(tool.name as any)
                }}
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
    </div>
  );
};
