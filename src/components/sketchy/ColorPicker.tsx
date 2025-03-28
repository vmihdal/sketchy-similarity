
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#1e1e1e", "#d0021b", "#f5a623", "#f8e71c", 
  "#8b572a", "#7ed321", "#417505", "#bd10e0",
  "#9013fe", "#4a90e2", "#50e3c2", "#b8e986",
  "#000000", "#4d4d4d", "#9e9e9e", "#ffffff"
];

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  color,
  onChange,
  allowTransparent = false
}) => {
  return (
    <Popover>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "w-8 h-8 rounded border border-gray-300",
              color === "transparent" && "bg-gray-100"
            )} 
            style={color !== "transparent" ? { backgroundColor: color } : {}}
          >
            {color === "transparent" && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-0.5 bg-gray-400 rotate-45" />
              </div>
            )}
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-64 p-3" side="bottom" align="start">
        <div className="space-y-3">
          <Label>{label} color</Label>
          <div className="grid grid-cols-4 gap-2">
            {allowTransparent && (
              <button
                className="w-12 h-12 rounded border border-gray-300 flex items-center justify-center"
                onClick={() => onChange("transparent")}
              >
                <div className="w-8 h-0.5 bg-gray-400 rotate-45" />
              </button>
            )}
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                className={cn(
                  "w-12 h-12 rounded border border-gray-300 transition-transform",
                  color === presetColor && "scale-110 shadow-md"
                )}
                style={{ backgroundColor: presetColor }}
                onClick={() => onChange(presetColor)}
              />
            ))}
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Label htmlFor="custom-color">Custom:</Label>
            <input
              id="custom-color"
              type="color"
              value={color === "transparent" ? "#000000" : color}
              onChange={(e) => onChange(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
