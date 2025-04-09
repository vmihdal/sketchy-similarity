
/**
 * Sketchy App Utilities and Constants
 * This file contains helper functions and constants used throughout the sketchy app
 */

import { Object as FabricObject } from 'fabric';

/**
 * Creates a unique ID for elements
 */
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

/**
 * Converts Fabric.js object to a serializable format for storage
 * @param obj - The Fabric.js object to convert
 */
export const fabricObjectToData = (obj: FabricObject): any => {
  return {
    type: obj.type,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth,
    fill: obj.fill,
    opacity: obj.opacity,
    strokeDashArray: obj.strokeDashArray,
    // These properties are specific to different object types
    ...(obj.type === 'rect' && {
      width: (obj as any).width,
      height: (obj as any).height,
      rx: (obj as any).rx,
      ry: (obj as any).ry,
    }),
    ...(obj.type === 'circle' && {
      radius: (obj as any).radius,
    }),
    ...(obj.type === 'line' && {
      x1: (obj as any).x1,
      y1: (obj as any).y1,
      x2: (obj as any).x2,
      y2: (obj as any).y2,
    }),
    ...(obj.type === 'path' && {
      path: (obj as any).path,
    }),
  };
};

/**
 * Creates default object properties based on the current tool settings
 * @param activeColor - Current stroke color
 * @param strokeWidth - Current stroke width
 * @param fillColor - Current fill color
 */
export const getDefaultObjectProps = (
  activeColor: string,
  strokeWidth: number,
  fillColor: string,
  strokeDashArray?: [number],
  cornerRadius?: number
) => {
  return {
    stroke: activeColor,
    strokeWidth: strokeWidth,
    fill: fillColor,
    strokeDashArray: strokeDashArray,
    selectable: true,
    transparentCorners: false,
    cornerColor: '#0ea5e9',
    cornerSize: 8,
    cornerStyle: 'circle' as 'circle' | 'rect',
    lockUniScaling: false,
    cornerRadius
  };
};

/**
 * Handles keyboard shortcuts for the sketch app
 * @param event - The keyboard event
 * @param setActiveTool - Function to set the active tool
 */
export const handleKeyboardShortcut = (
  event: KeyboardEvent,
  setActiveTool: (tool: any) => void
) => {
  // Only apply shortcuts when not in an input field
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    return;
  }
  
  switch (event.key.toLowerCase()) {
    case 'v':
      setActiveTool('select');
      break;
    case 'h':
      setActiveTool('pan');
      break;
    case 'p':
      setActiveTool('pencil');
      break;
    case 'r':
      setActiveTool('rectangle');
      break;
    case 'c':
      setActiveTool('circle');
      break;
    case 'l':
      setActiveTool('line');
      break;
    default:
      break;
  }
};
