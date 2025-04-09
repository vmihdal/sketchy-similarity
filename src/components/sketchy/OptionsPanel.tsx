
import { useState, useEffect } from "react";
import { useToolStore } from "@/store/tool-store";
import { useElementStore } from "@/store/element-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trash, AlignLeft, AlignCenter, AlignRight, AlignJustify, ArrowDown, ArrowUp, MoveDown, MoveUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FabricObject, InteractiveFabricObject } from "fabric";
import { toast } from "@/components/ui/use-toast";

interface ColorOption {
  color: string;
  label: string;
}

const STROKE_COLORS: ColorOption[] = [
  { color: "#1e1e1e", label: "Black" },
  { color: "#d0021b", label: "Red" },
  { color: "#7ed321", label: "Green" },
  { color: "#4a90e2", label: "Blue" },
  { color: "#f5a623", label: "Orange" },
  { color: "#000000", label: "Dark Black" },
];

const BACKGROUND_COLORS: ColorOption[] = [
  { color: "#ffffff", label: "White" },
  { color: "#ffdee2", label: "Pink" },
  { color: "#f2fce2", label: "Light Green" },
  { color: "#d3e4fd", label: "Light Blue" },
  { color: "#fef7cd", label: "Light Yellow" },
  { color: "transparent", label: "Transparent" },
];

const STROKE_WIDTHS = [2, 4, 6];

const STROKE_STYLES = [
  { label: "Solid", value: "solid" },
  { label: "Dashed", value: "dashed" },
  { label: "Dotted", value: "dotted" },
];

const SLOPPINESS_LEVELS = [
  { label: "None", value: 0 },
  { label: "Medium", value: 1 },
  { label: "High", value: 2 },
];

const EDGE_STYLES = [
  { label: "Sharp", value: "sharp" },
  { label: "Round", value: "round" },
];

const ALIGN_OPTIONS = [
  { label: "Left", icon: AlignLeft },
  { label: "Center", icon: AlignCenter },
  { label: "Right", icon: AlignRight },
  { label: "Top", icon: AlignJustify },
  { label: "Middle", icon: AlignJustify },
  { label: "Bottom", icon: AlignJustify },
];

export const OptionsPanel = () => {
  const { elements, updateElement, addElement } = useElementStore();
  const { setActiveColor, setStrokeWidth, setFillColor, setStrokeDashArray, setCornerRadius, toggleCopy, toggleDelete } = useToolStore();

  // Local state for currently selected object properties
  const [currentStrokeColor, setCurrentStrokeColor] = useState("#1e1e1e");
  const [currentFillColor, setCurrentFillColor] = useState("transparent");
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
  const [currentOpacity, setCurrentOpacity] = useState(100);
  const [currentStrokeStyle, setCurrentStrokeStyle] = useState("solid");
  const [currentSloppiness, setCurrentSloppiness] = useState(0);
  const [currentEdgeStyle, setCurrentEdgeStyle] = useState("sharp");

  // Update local state when a different object is selected
  useEffect(() => {

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      if (selectedElement.object) {
        // Get the properties from the selected object
        const stroke = selectedElement.object.stroke || "#1e1e1e";
        const width = selectedElement.object.strokeWidth || 2;
        const fill = selectedElement.object.fill || "transparent";
        const opacity = selectedElement.object.opacity ? selectedElement.object.opacity * 100 : 100;

        // Update local state
        setCurrentStrokeColor(stroke);
        setCurrentStrokeWidth(width);
        setCurrentFillColor(fill === "" ? "transparent" : fill);
        setCurrentOpacity(opacity);
      }
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process shortcuts when not in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.repeat) return;

      switch (e.key.toLowerCase()) {
        case "backspace":
          e.preventDefault();
          handleDelete();
          break;
        case "delete":
          e.preventDefault();
          handleDelete();
          break;
        case "d":
          if (e.ctrlKey) {
            e.preventDefault();
            handleCopy()
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [elements]);

  // Apply changes to the selected object
  const handleStrokeColorChange = (color: string) => {
    setCurrentStrokeColor(color);

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      updateElement(selectedElement.id, {
        object: { ...elements.find(el => el.id === selectedElement.id)?.object, stroke: color, dirty: true }
      });
    })

    setActiveColor(color);
  };

  const handleFillColorChange = (color: string) => {
    setCurrentFillColor(color);

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      updateElement(selectedElement.id, {
        object: {
          ...elements.find(el => el.id === selectedElement.id)?.object,
          fill: color, dirty: true
        }
      });
    })
    setFillColor(color);
  };

  const handleStrokeWidthChange = (width: number) => {
    setCurrentStrokeWidth(width);

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      updateElement(selectedElement.id, {
        object: { ...elements.find(el => el.id === selectedElement.id)?.object, strokeWidth: width }
      });
    });
    setStrokeWidth(width);
  };

  const handleOpacityChange = (value: number[]) => {
    const opacity = value[0];

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      updateElement(selectedElement.id, {
        object: { ...elements.find(el => el.id === selectedElement.id)?.object, opacity: opacity / 100 }
      });
    })

    setCurrentOpacity(opacity);
  };

  const handleStrokeStyleChange = (style: string) => {

    let strokeDashArray = null;

    switch (style) {
      case 'dotted':
        strokeDashArray = [3, 5]
        break
      case 'dashed':
        strokeDashArray = [5, 5]
        break
      default:
        strokeDashArray = null
        break
    }

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      updateElement(selectedElement.id, {
        object: { ...elements.find(el => el.id === selectedElement.id)?.object, strokeDashArray, dirty: true }
      });
    });

    setCurrentStrokeStyle(style);
    setStrokeDashArray(strokeDashArray);
  };

  const handleSlopinessChange = (level: number) => {
    setCurrentSloppiness(level);
    // Placeholder for future implementation
    console.log(`Sloppiness changed to ${level}`);
  };

  const handleEdgeStyleChange = (style: string) => {

    let cornerRadius = style == 'round' ? 20 : null;

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      updateElement(selectedElement.id, {
        cornerRadius
      });
    });

    setCurrentEdgeStyle(style);
    setCornerRadius(cornerRadius);
  };

  const handleAlign = (alignment: string) => {
    // Placeholder for future implementation
    console.log(`Aligning to ${alignment}`);
  };

  const handleLayerAction = (action: string) => {
    // Placeholder for future implementation
    console.log(`Layer action: ${action}`);
  };

  const handleDelete = () => {

    elements.filter((el) => el.selected).forEach((selectedElement) => {
      useElementStore.getState().removeElement(selectedElement.id);
    })

    toggleDelete()
  };

  const handleCopy = () => {
    toggleCopy()
  };



  return (
    <div className="fixed right-4 top-20 w-60 bg-white rounded-lg shadow-lg p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Stroke Color */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Stroke</h3>
        <div className="grid grid-cols-3 gap-2">
          {STROKE_COLORS.map((option) => (
            <button
              key={option.color}
              className={cn(
                "w-full h-8 rounded border border-gray-300",
                currentStrokeColor === option.color && "ring-2 ring-blue-500"
              )}
              style={{ backgroundColor: option.color }}
              onClick={() => handleStrokeColorChange(option.color)}
              aria-label={option.label}
            />
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Background</h3>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_COLORS.map((option) => (
            <button
              key={option.color}
              className={cn(
                "w-full h-8 rounded border border-gray-300",
                currentFillColor === option.color && "ring-2 ring-blue-500",
                option.color === "transparent" && "bg-gray-100"
              )}
              style={option.color !== "transparent" ? { backgroundColor: option.color } : {}}
              onClick={() => handleFillColorChange(option.color)}
              aria-label={option.label}
            >
              {option.color === "transparent" && (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-0.5 bg-gray-400 rotate-45" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Stroke width</h3>
        <div className="grid grid-cols-3 gap-2">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={width}
              className={cn(
                "w-full h-10 rounded bg-purple-50 flex items-center justify-center",
                currentStrokeWidth === width && "bg-purple-200"
              )}
              onClick={() => handleStrokeWidthChange(width)}
            >
              <div
                className="bg-black rounded-full"
                style={{
                  height: `${width}px`,
                  width: '24px'
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Style */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Stroke style</h3>
        <div className="grid grid-cols-3 gap-2">
          {STROKE_STYLES.map((style) => (
            <button
              key={style.value}
              className={cn(
                "w-full h-10 rounded bg-purple-50 flex items-center justify-center",
                currentStrokeStyle === style.value && "bg-purple-200"
              )}
              onClick={() => handleStrokeStyleChange(style.value)}
            >
              <div className="w-6">
                {style.value === "solid" && <div className="h-0.5 w-full bg-black" />}
                {style.value === "dashed" && (
                  <div className="flex space-x-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-0.5 w-1 bg-black" />
                    ))}
                  </div>
                )}
                {style.value === "dotted" && (
                  <div className="flex space-x-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-0.5 w-0.5 bg-black rounded-full" />
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sloppiness */}
      {/* <div className="space-y-2">
        <h3 className="text-sm font-medium">Sloppiness</h3>
        <div className="grid grid-cols-3 gap-2">
          {SLOPPINESS_LEVELS.map((level) => (
            <button
              key={level.value}
              className={cn(
                "w-full h-10 rounded bg-purple-50 flex items-center justify-center",
                currentSloppiness === level.value && "bg-purple-200"
              )}
              onClick={() => handleSlopinessChange(level.value)}
            >
              {level.value === 0 && <div className="h-0.5 w-6 bg-black" />}
              {level.value === 1 && (
                <svg width="24" height="8" viewBox="0 0 24 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4C5.66667 1.33333 18.3333 -0.666667 23 7" stroke="black" strokeWidth="1.5"/>
                </svg>
              )}
              {level.value === 2 && (
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 6C3.66667 2.33333 8.3 -1.7 15.5 2.5C22.7 6.7 23 3.66667 23 1" stroke="black" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div> */}

      {/* Edges */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Edges</h3>
        <div className="grid grid-cols-2 gap-2">
          {EDGE_STYLES.map((edge) => (
            <button
              key={edge.value}
              className={cn(
                "w-full h-10 rounded bg-purple-50 flex items-center justify-center",
                currentEdgeStyle === edge.value && "bg-purple-200"
              )}
              onClick={() => handleEdgeStyleChange(edge.value)}
            >
              {edge.value === "sharp" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H12V6H6V12H4V4Z" stroke="black" strokeWidth="2" />
                </svg>
              )}
              {edge.value === "round" && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 10C4 6.68629 6.68629 4 10 4H14" stroke="black" strokeWidth="2" fill="none" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity Slider */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Opacity</h3>
        <div className="px-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>0</span>
            <span>100</span>
          </div>
          <Slider
            value={[currentOpacity]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleOpacityChange}
          />
        </div>
      </div>

      {/* Layers */}
      {/* <div className="space-y-2">
        <h3 className="text-sm font-medium">Layers</h3>
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 hover:bg-purple-100"
            onClick={() => handleLayerAction("sendToBack")}
          >
            <MoveDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 hover:bg-purple-100"
            onClick={() => handleLayerAction("sendBackward")}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 hover:bg-purple-100"
            onClick={() => handleLayerAction("bringForward")}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 hover:bg-purple-100"
            onClick={() => handleLayerAction("bringToFront")}
          >
            <MoveUp className="h-4 w-4" />
          </Button>
        </div>
      </div> */}

      {/* Align */}
      {/* <div className="space-y-2">
        <h3 className="text-sm font-medium">Align</h3>
        <div className="grid grid-cols-3 gap-2">
          {ALIGN_OPTIONS.slice(0, 3).map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              size="icon"
              className="bg-purple-50 hover:bg-purple-100"
              onClick={() => handleAlign(option.label)}
            >
              <option.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {ALIGN_OPTIONS.slice(3).map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              size="icon"
              className="bg-purple-50 hover:bg-purple-100"
              onClick={() => handleAlign(option.label)}
            >
              <option.icon className={cn("h-4 w-4", option.label === "Top" && "rotate-90", option.label === "Bottom" && "-rotate-90")} />
            </Button>
          ))}
        </div>
      </div> */}

      {/* Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Actions</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 hover:bg-purple-100"
            onClick={handleCopy}
          >
            <svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><g strokeWidth="1.25"><path d="M14.375 6.458H8.958a2.5 2.5 0 0 0-2.5 2.5v5.417a2.5 2.5 0 0 0 2.5 2.5h5.417a2.5 2.5 0 0 0 2.5-2.5V8.958a2.5 2.5 0 0 0-2.5-2.5Z"></path><path clipRule="evenodd" d="M11.667 3.125c.517 0 .986.21 1.325.55.34.338.55.807.55 1.325v1.458H8.333c-.485 0-.927.185-1.26.487-.343.312-.57.75-.609 1.24l-.005 5.357H5a1.87 1.87 0 0 1-1.326-.55 1.87 1.87 0 0 1-.549-1.325V5c0-.518.21-.987.55-1.326.338-.34.807-.549 1.325-.549h6.667Z"></path></g></svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 hover:bg-purple-100"
            onClick={handleDelete}
          >
            <Trash className="h-4 w-4" />
          </Button>
          {/* <Button
            variant="ghost"
            size="icon"
            className="bg-purple-50 hover:bg-purple-100"
            onClick={() => console.log("Crop")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12H11V5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 12V14" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 12V14" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 4V2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 4H2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 5H11" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </Button> */}
        </div>
      </div>
    </div>
  );
};
