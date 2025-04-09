
import { create } from "zustand";

interface ToolState {
  activeTool: "select" | "pencil" | "rectangle" | "circle" | "line" | "pan" | "text";
  activeColor: string;
  strokeWidth: number;
  fillColor: string;
  strokeDashArray?: [number],
  cornerRadius?: number,
  copyToggle: boolean,
  deleteToggle: boolean,
  setActiveTool: (tool: ToolState["activeTool"]) => void;
  setActiveColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFillColor: (color: string) => void;
  setStrokeDashArray: (array?: [number]) => void;
  setCornerRadius: (radius?: number) => void;
  toggleCopy: () => void;
  toggleDelete: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: "select",
  activeColor: "#1e1e1e",
  strokeWidth: 2,
  fillColor: "transparent",
  strokeDashArray: null,
  copyToggle: false,
  deleteToggle: false,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeDashArray: (array) => set({ strokeDashArray: array }),
  setCornerRadius: (radius?: number) => set({ cornerRadius: radius }),
  toggleCopy: () => set((state) => ({ copyToggle: !state.copyToggle })),
  toggleDelete: () => set((state) => ({ deleteToggle: !state.deleteToggle })),
}));
