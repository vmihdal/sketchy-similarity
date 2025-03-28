
import { create } from "zustand";

interface ToolState {
  activeTool: "select" | "pencil" | "rectangle" | "circle" | "line";
  activeColor: string;
  strokeWidth: number;
  fillColor: string;
  setActiveTool: (tool: ToolState["activeTool"]) => void;
  setActiveColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFillColor: (color: string) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: "select",
  activeColor: "#1e1e1e",
  strokeWidth: 2,
  fillColor: "transparent",
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFillColor: (color) => set({ fillColor: color }),
}));
