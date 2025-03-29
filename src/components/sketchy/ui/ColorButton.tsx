
import React from "react";
import { cn } from "@/lib/utils";

interface ColorButtonProps {
  color: string;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}

/**
 * A reusable color button component
 */
export const ColorButton: React.FC<ColorButtonProps> = ({ 
  color, 
  isSelected, 
  label, 
  onClick 
}) => {
  const isTransparent = color === "transparent";

  return (
    <button
      className={cn(
        "w-full h-8 rounded border border-gray-300 transition-all",
        isSelected && "ring-2 ring-blue-500",
        isTransparent && "bg-gray-100"
      )}
      style={!isTransparent ? { backgroundColor: color } : {}}
      onClick={onClick}
      aria-label={label}
    >
      {isTransparent && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-6 h-0.5 bg-gray-400 rotate-45" />
        </div>
      )}
    </button>
  );
};
