
import React from "react";
import { Toolbar } from "./Toolbar";
import { CanvasWrapper } from "./CanvasWrapper";

/**
 * Main application wrapper component
 * Includes the toolbar and canvas
 */
export const AppWrapper: React.FC = () => {
  return (
    <div className="sketchy-app relative w-screen h-screen overflow-hidden">
      <Toolbar />
      <CanvasWrapper />
    </div>
  );
};
