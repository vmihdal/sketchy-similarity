
import React from 'react';
import { useCanvas } from './hooks/useCanvas';

/**
 * Canvas component for the sketchy app
 * Renders a fabric.js canvas for drawing
 */
export const Canvas: React.FC = () => {
  const { canvas } = useCanvas('canvas');

  return (
    <div className="canvas-container w-full h-full">
      <canvas id="canvas" />
    </div>
  );
};
