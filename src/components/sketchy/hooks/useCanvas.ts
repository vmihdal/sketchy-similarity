
import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, TEvent, Object as FabricObject, Rect, Circle, Line } from 'fabric';
import { useToolStore } from '@/store/tool-store';
import { useElementStore, Element, FabricObjectData } from '@/store/element-store';
import { generateUniqueId, fabricObjectToData, getDefaultObjectProps } from '../utils';

// Add custom properties to FabricCanvas
interface ExtendedCanvas extends FabricCanvas {
  isDragging?: boolean;
  lastPosX?: number;
  lastPosY?: number;
}

// Add custom properties to FabricObject
interface ExtendedFabricObject extends FabricObject {
  data?: { id: string };
}

/**
 * Custom hook to handle canvas interactions and state
 * @param canvasId - The ID of the canvas element
 */
export const useCanvas = (canvasId: string) => {
  const canvasRef = useRef<ExtendedCanvas | null>(null);
  const { activeTool, activeColor, strokeWidth, fillColor } = useToolStore();
  const { addElement, selectElement, updateElement } = useElementStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentObject, setCurrentObject] = useState<ExtendedFabricObject | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = new FabricCanvas(canvasId, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 'white',
      selection: true,
      preserveObjectStacking: true,
    }) as ExtendedCanvas;

    canvasRef.current = canvas;

    // Set up event handlers for object selection
    canvas.on('selection:created', (e: TEvent<'selection:created'>) => handleObjectSelection(e));
    canvas.on('selection:updated', (e: TEvent<'selection:updated'>) => handleObjectSelection(e));
    canvas.on('selection:cleared', () => selectElement(null));

    // Set up event handlers for object modifications
    canvas.on('object:modified', (e: TEvent<'object:modified'>) => {
      if (e.target) {
        const obj = e.target as ExtendedFabricObject;
        const id = obj.data?.id;
        if (id) {
          updateElement(id, { object: fabricObjectToData(obj) });
        }
      }
    });

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle object selection
  const handleObjectSelection = (e: TEvent<'selection:created' | 'selection:updated'>) => {
    const selectedObjects = e.selected;
    if (selectedObjects && selectedObjects.length > 0) {
      const obj = selectedObjects[0] as ExtendedFabricObject;
      if (obj && obj.data?.id) {
        selectElement(obj.data.id);
      }
    }
  };

  // Update the canvas tools based on active tool
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset canvas mode
    canvas.isDrawingMode = false;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';

    // Configure canvas based on active tool
    switch (activeTool) {
      case 'pencil':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = activeColor;
          canvas.freeDrawingBrush.width = strokeWidth;
        }
        break;
      case 'select':
        canvas.selection = true;
        break;
      case 'pan':
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        break;
      default:
        canvas.defaultCursor = 'crosshair';
        break;
    }

    // Ensure the free drawing brush is configured
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = activeColor;
      canvas.freeDrawingBrush.width = strokeWidth;
    }

    // Clean up any in-progress drawing when tool changes
    setIsDrawing(false);
    setStartPoint(null);
    if (currentObject && !currentObject.data?.id) {
      canvas.remove(currentObject);
    }
    setCurrentObject(null);
  }, [activeTool, activeColor, strokeWidth]);

  // Set up mouse event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Remove existing listeners
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    // For path creation (pencil)
    canvas.on('path:created', (e: any) => {
      if (e.path) {
        const id = generateUniqueId();
        const pathObj = e.path as ExtendedFabricObject;
        pathObj.data = { id };
        addElement({
          id,
          type: 'path',
          object: fabricObjectToData(pathObj),
        });
      }
    });

    // Mouse down handler
    canvas.on('mouse:down', (options: TEvent<'mouse:down'>) => {
      if (activeTool === 'pan') {
        canvas.defaultCursor = 'grabbing';
        canvas.hoverCursor = 'grabbing';
        canvas.isDragging = true;
        canvas.lastPosX = options.e.offsetX;
        canvas.lastPosY = options.e.offsetY;
        return;
      }

      if (activeTool !== 'select' && activeTool !== 'pencil') {
        setIsDrawing(true);
        const pointer = canvas.getPointer(options.e);
        setStartPoint({ x: pointer.x, y: pointer.y });

        // Default properties for all objects
        const defaultProps = getDefaultObjectProps(activeColor, strokeWidth, fillColor);

        // Create initial object based on tool
        let obj: ExtendedFabricObject | null = null;

        switch (activeTool) {
          case 'rectangle': {
            const rect = new Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              ...defaultProps,
            });
            obj = rect as unknown as ExtendedFabricObject;
            break;
          }
          case 'circle': {
            const circle = new Circle({
              left: pointer.x,
              top: pointer.y,
              radius: 0,
              ...defaultProps,
            });
            obj = circle as unknown as ExtendedFabricObject;
            break;
          }
          case 'line': {
            const line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              ...defaultProps,
            });
            obj = line as unknown as ExtendedFabricObject;
            break;
          }
          default:
            break;
        }

        if (obj) {
          canvas.add(obj);
          setCurrentObject(obj);
        }
      }
    });

    // Mouse move handler
    canvas.on('mouse:move', (options: TEvent<'mouse:move'>) => {
      if (activeTool === 'pan' && canvas.isDragging) {
        const e = options.e;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.offsetX - (canvas.lastPosX || 0);
          vpt[5] += e.offsetY - (canvas.lastPosY || 0);
          canvas.requestRenderAll();
          canvas.lastPosX = e.offsetX;
          canvas.lastPosY = e.offsetY;
        }
        return;
      }

      if (isDrawing && startPoint && currentObject) {
        const pointer = canvas.getPointer(options.e);

        switch (activeTool) {
          case 'rectangle': {
            const rect = currentObject as unknown as Rect;
            const width = Math.abs(pointer.x - startPoint.x);
            const height = Math.abs(pointer.y - startPoint.y);
            rect.set({
              left: Math.min(pointer.x, startPoint.x),
              top: Math.min(pointer.y, startPoint.y),
              width: width,
              height: height,
            });
            break;
          }
          case 'circle': {
            const circle = currentObject as unknown as Circle;
            const radius = Math.sqrt(
              Math.pow(pointer.x - startPoint.x, 2) +
              Math.pow(pointer.y - startPoint.y, 2)
            ) / 2;
            const centerX = (pointer.x + startPoint.x) / 2;
            const centerY = (pointer.y + startPoint.y) / 2;
            circle.set({
              left: centerX - radius,
              top: centerY - radius,
              radius: radius,
            });
            break;
          }
          case 'line': {
            const line = currentObject as unknown as Line;
            line.set({
              x2: pointer.x,
              y2: pointer.y,
            });
            break;
          }
          default:
            break;
        }

        canvas.renderAll();
      }
    });

    // Mouse up handler
    canvas.on('mouse:up', () => {
      if (activeTool === 'pan') {
        if (canvas.viewportTransform) {
          canvas.setViewportTransform(canvas.viewportTransform);
        }
        canvas.isDragging = false;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
        return;
      }

      if (isDrawing && currentObject) {
        setIsDrawing(false);
        const id = generateUniqueId();
        currentObject.data = { id };

        // Add to store
        addElement({
          id,
          type: currentObject.type || '',
          object: fabricObjectToData(currentObject),
        });

        setCurrentObject(null);
        setStartPoint(null);
        canvas.setActiveObject(currentObject);
        selectElement(id);
      }
    });

    return () => {
      // Clean up event listeners
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      canvas.off('path:created');
    };
  }, [activeTool, isDrawing, startPoint, currentObject, activeColor, strokeWidth, fillColor]);

  return {
    canvas: canvasRef.current,
  };
};
