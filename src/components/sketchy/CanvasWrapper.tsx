
import React, { useEffect } from "react";
import { useCanvas } from "./hooks/useCanvas";
import { useToolStore } from "@/store/tool-store";
import { handleKeyboardShortcut } from "./utils";

export const CanvasWrapper: React.FC = () => {
  const { setActiveTool } = useToolStore();
  const { canvas } = useCanvas("canvas");

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyboardShortcut(event, setActiveTool);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setActiveTool]);

  return (
    <div className="canvas-container w-full h-full">
      <canvas id="canvas" />
    </div>
  );
};
