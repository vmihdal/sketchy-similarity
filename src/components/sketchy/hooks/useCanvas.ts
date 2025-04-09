
import { useEffect, useRef, useState } from 'react';
import {
  Canvas as FabricCanvas,
  Object as FabricObject,
  Rect,
  Circle,
  Line,
  TPointerEventInfo,
  TPointerEvent,
  ModifiedEvent,
  ActiveSelection,
  Polyline,
  Image,
  Textbox
} from 'fabric';
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

class ControlPoint extends Circle {
}

class PolylineExtended extends Polyline {
  customControls: [ControlPoint]
}

/**
 * Custom hook to handle canvas interactions and state
 * @param canvasId - The ID of the canvas element
 */
export const useCanvas = (canvasId: string) => {
  const canvasRef = useRef<ExtendedCanvas | null>(null);
  const { activeTool, activeColor, strokeWidth, fillColor, strokeDashArray, cornerRadius, setActiveTool, copyToggle, toggleCopy, deleteToggle, toggleDelete } = useToolStore();
  const { addElement, selectElement, updateElement, elements } = useElementStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentObject, setCurrentObject] = useState<ExtendedFabricObject | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = new FabricCanvas(canvasId, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 'white',
      selection: false,
      preserveObjectStacking: true,
    }) as ExtendedCanvas;

    canvasRef.current = canvas;

    // Set up event handlers for object selection
    canvas.on('selection:created', (options) => {
      handleObjectSelection(options);

      canvas.getActiveObjects().forEach((obj) => {
        if (obj.type == 'textbox') {
          (obj as Textbox).enterEditing()
        }})
    });

    canvas.on('selection:updated', (options) => {
      handleObjectSelection(options);

      canvas.getActiveObjects().forEach((obj) => {
        if (obj.type == 'textbox') {
          (obj as Textbox).enterEditing()
        }})
    });

    canvas.on('selection:cleared', () => {
      selectElement(null);

      canvas.getObjects().forEach((obj) => {
        if (obj.type == 'textbox') {
          (obj as Textbox).exitEditing()
        }})
    });

    // Set up event handlers for object modifications
    canvas.on('object:modified', (options) => {
      if (options.target) {
        const obj = options.target as ExtendedFabricObject;
        const id = obj.data?.id;
        if (id) {
          updateElement(id, { object: fabricObjectToData(obj) });
        }
      }
      // if (options.target instanceof PolylineExtended) {
      //   let polyline = options.target as any as PolylineExtended;
      //   polyline.points.forEach((point, index) => {
      //     const control = polyline.customControls[index];
      //     if (control instanceof ControlPoint ) {
      //       console.log(control.left, control.top, point)
      //       control.set({ left: point.x, top: point.y, dirty: true });
      //     }
      //   })
      // }
    });

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const handlePaste = (event) => {
      if (!event.clipboardData) {
        return
      }

      const items = event.clipboardData.items;

      const defaultProps = getDefaultObjectProps(activeColor, strokeWidth, fillColor, strokeDashArray, cornerRadius);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Look for image item
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const reader = new FileReader();

          reader.onload = function (event) {
            Image.fromURL(event.target.result.toString()).then((img) => {
              img.set({
                left: 100,
                top: 100,
                ... defaultProps,
              });
              canvas.add(img);
              canvas.setActiveObject(img);
              canvas.renderAll();
              
              let current = img as ExtendedFabricObject;

              const id = generateUniqueId();
              current.data = { id };

              addElement({
                id,
                type: current.type || '',
                object: fabricObjectToData(current),
                isModified: false,
                selected: false,
              });
      
              setCurrentObject(null);
              canvas.setActiveObject(current);
              selectElement(id);
              setActiveTool('select');
              canvas.requestRenderAll()
            });
          };

          reader.readAsDataURL(blob);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('paste', handlePaste);

    return () => {
      canvas.dispose();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Handle object selection
  const handleObjectSelection = (options: any) => {
    if (options.selected && options.selected.length > 0) {
      const obj = options.selected[0] as ExtendedFabricObject;
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
    canvas.selection = false;

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
    canvas.on('path:created', (e: { path: FabricObject }) => {
      if (e.path) {
        const id = generateUniqueId();
        const pathObj = e.path as ExtendedFabricObject;
        pathObj.data = { id };
        addElement({
          id,
          type: 'path',
          object: fabricObjectToData(pathObj),
          isModified: false,
          selected: false,
          cornerRadius
        });
      }
    });

    // Mouse down handler
    canvas.on('mouse:down', (options: TPointerEventInfo<TPointerEvent>) => {
      if (activeTool === 'pan') {
        canvas.defaultCursor = 'grabbing';
        canvas.hoverCursor = 'grabbing';
        canvas.isDragging = true;

        if (options.e) {
          const e = options.e;
          canvas.lastPosX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
          canvas.lastPosY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
        }
        return;
      }

      if (activeTool !== 'select' && activeTool !== 'pencil') {
        setIsDrawing(true);
        const pointer = canvas.getPointer(options.e);
        setStartPoint({ x: pointer.x, y: pointer.y });

        // Default properties for all objects
        const defaultProps = getDefaultObjectProps(activeColor, strokeWidth, fillColor, strokeDashArray, cornerRadius);

        // Create initial object based on tool
        let obj: ExtendedFabricObject | null = null;

        switch (activeTool) {
          case 'text':
          case 'rectangle': {
            const rect = new Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              ...defaultProps,
              cornerStyle: 'circle' as 'circle' | 'rect',
              selectable: false, // Prevent selection while drawing
              rx: defaultProps.cornerRadius,
              ry: defaultProps.cornerRadius,
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
              cornerStyle: 'circle' as 'circle' | 'rect',
              selectable: false, // Prevent selection while drawing
            });
            obj = circle as unknown as ExtendedFabricObject;
            break;
          }
          case 'line': {
            const line = new PolylineExtended([{ x: pointer.x, y: pointer.y }], {
              ...defaultProps,
              selectable: false,
              evented: false,
              objectCaching: false,
              hasControls: false,
              hasBorders: false
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
    canvas.on('mouse:move', (options: TPointerEventInfo<TPointerEvent>) => {
      if (activeTool === 'pan' && canvas.isDragging) {
        if (!options.e) return;

        const e = options.e;
        const vpt = canvas.viewportTransform;
        if (vpt && canvas.lastPosX !== undefined && canvas.lastPosY !== undefined) {
          const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
          const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

          vpt[4] += clientX - canvas.lastPosX;
          vpt[5] += clientY - canvas.lastPosY;
          canvas.requestRenderAll();
          canvas.lastPosX = clientX;
          canvas.lastPosY = clientY;
        }
        return;
      }

      if (isDrawing && startPoint && currentObject) {
        const pointer = canvas.getPointer(options.e);

        switch (activeTool) {
          case 'text':
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
            const line = currentObject as unknown as PolylineExtended;
            line.points[1] = { x: pointer.x, y: pointer.y };
            line.set({
              points: line.points,
              dirty: true
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

        if (activeTool == 'line') {
          const line = currentObject as unknown as PolylineExtended;
          line.points.push(line.points[1]);
          line.points[1] = getMidpoint(line.points[0], line.points[2]);
          // line.setDimensions()
          line.set({ points: line.points, dirty: true });
          createControls(canvasRef, line)
        } if (activeTool == 'text' ) {
          const bounds = currentObject.getBoundingRect();
          canvas.remove(currentObject);

          const defaultProps = getDefaultObjectProps(activeColor, strokeWidth, fillColor, strokeDashArray, cornerRadius);

          const textbox = new Textbox("Sample text", {
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            editable: true,
            selectable: true
          });
          textbox.setCoords();
          textbox.enterEditing();
          canvas.add(textbox);
          setCurrentObject(textbox);
        }

        if (activeTool != 'line')
        {
          currentObject.set({ selectable: true });
        }
        
        setIsDrawing(false);
        const id = generateUniqueId();
        currentObject.data = { id };

        let element = {
          id,
          type: currentObject.type || '',
          object: fabricObjectToData(currentObject),
          isModified: false,
          selected: false,
        } as Element;

        if (activeTool != 'text') {
          element.cornerRadius = cornerRadius;
        }

        // Add to store
        addElement(element);
        setCurrentObject(null);
        setStartPoint(null);
        canvas.setActiveObject(currentObject);
        selectElement(id);
        setActiveTool('select');
        canvas.requestRenderAll()
      }
    });

    canvas.on("mouse:over", (options: TPointerEventInfo<TPointerEvent>) => {
      if (options.target) {
        options.target.evented = activeTool === 'pencil' || options.target instanceof ControlPoint || options.target instanceof PolylineExtended;
      }
    });

    return () => {
      // Clean up event listeners
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      canvas.off('path:created');
    };
  }, [activeTool, isDrawing, startPoint, currentObject, activeColor, strokeWidth, fillColor, strokeDashArray, cornerRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const modified = new Map<string, Element>(
      elements.filter((element) => element.isModified )
              .map((el) => [el.id, el])
    );

    const selectedMap = new Map<string, Element>(
      elements.filter((element) => element.selected )
              .map((el) => [el.id, el])
    );

    if (modified.size == 0 ) {
      return;
    }

    let selected = [];

    canvas.getObjects().forEach((obj) => {

      let extended = (obj as ExtendedFabricObject);
      let id = extended.data?.id;

      if (selectedMap.has(id) ) {
        selected.push(obj);
        obj.set({ dirty: true });
      }

      if (modified.has(id)) {
        let elem = modified.get(id);
        obj.set({
          fill: elem.object.fill || obj.fill,
          stroke: elem.object.stroke || obj.stroke,
          strokeWidth: elem.object.strokeWidth || obj.strokeWidth,
          strokeDashArray: elem.object.strokeDashArray,
          rx: elem.cornerRadius,
          ry: elem.cornerRadius,
          opacity: elem.object.opacity
        });

        obj.set({ dirty: true });
        elem.isModified = false;
      }
    });

    //Dirty hack to avoid crash due to delay in object update?
    // if (selected.length == 1 ) {
    //   const selection = new ActiveSelection(selected, { canvas });
    //   canvas.setActiveObject(selection);
    // }

    canvas.renderAll();  // Re-render the modified objects

  }, [elements] );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (activeTool !== "select") {
      canvas.discardActiveObject();
      canvas.renderAll();
    }

  }, [activeTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!copyToggle) {
      return;
    }

    toggleCopy();

    const selectedMap = new Map<string, Element>(
      elements.filter((element) => element.selected )
              .map((el) => [el.id, el])
    );
    const defaultProps = getDefaultObjectProps(activeColor, strokeWidth, fillColor, strokeDashArray, cornerRadius);

      canvas.getActiveObjects().forEach((obj) => {

        if (selectedMap.has((obj as ExtendedFabricObject).data?.id)) {
          obj.clone().then( clone => {
            clone.set({
              left: obj.left + 50,
              top: obj.top + 50,
            });
  
            Object.keys(defaultProps).forEach((propName) => {
              clone.set({ [propName]: obj[propName] })
            })
  
            clone.set({
              dirty: true
            });
            canvas.add(clone);

            let current = clone as ExtendedFabricObject;

            const id = generateUniqueId();
            current.data = { id };

            addElement({
              id,
              type: current.type || '',
              object: fabricObjectToData(current),
              isModified: false,
              selected: false,
            });
    
            setCurrentObject(null);
            canvas.setActiveObject(current);
            selectElement(id);
            setActiveTool('select');
          });
        }
    });

    canvas.renderAll;

  }, [elements, copyToggle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!deleteToggle) {
      return;
    }

    toggleDelete();

    const elementsMap = new Map<string, Element>(
      elements
              .map((el) => [el.id, el])
    );
    
      canvas.getActiveObjects().forEach((obj) => {
        if (!elementsMap.has((obj as ExtendedFabricObject).data?.id)) {
          canvas.remove(obj);
        }
    });

    setCurrentObject(null);
    setActiveTool('select');

    canvas.renderAll;

  }, [elements, deleteToggle]);

  return {
    canvas: canvasRef.current,
  };
};

function createControls(canvasRef, polyline) {

  const canvas = canvasRef.current;
  if (!canvas) return;
  const line = polyline as unknown as PolylineExtended;
  const controlPoints = line.points.map((p, index) => createControlPoint(canvasRef, line, p.x, p.y, index));
  polyline.customControls = controlPoints;
  canvas.add(...controlPoints);
}

function createControlPoint(canvasRef, polyline, x, y, index) {
  
  let control = new ControlPoint({
    left: x,
    top: y,
    radius: 6,
    fill: "white",
    stroke: "blue",
    strokeWidth: 1,
    originX: "center",
    originY: "center",
    hasControls: false,
    hasBorders: false,
    selectable: true,
  });

  // Update polyline on dragging the control point
  control.on("moving", function () {
    const canvas = canvasRef.current;
    if (!canvas) return;

    polyline.points[index] = { x: control.left, y: control.top }; // Update the polyline's points
    polyline.set({ points: polyline.points, dirty: true });
    canvas.renderAll();
  });

  return control;
}

function getMidpoint(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}