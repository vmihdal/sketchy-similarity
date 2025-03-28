
import { Canvas } from "./Canvas";
import { Toolbar } from "./Toolbar";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

export const SketchyApp = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Toolbar />
      <Canvas />
      <KeyboardShortcuts />
    </div>
  );
};
