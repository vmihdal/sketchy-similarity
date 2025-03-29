
import { create } from "zustand";

// Type definitions for better type safety
export interface FabricObjectData {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
  [key: string]: any; // For other Fabric.js properties
}

export interface Element {
  id: string;
  type: string;
  object: FabricObjectData;
}

interface ElementState {
  elements: Element[];
  selectedElementId: string | null;
  addElement: (element: Element) => void;
  removeElement: (id: string) => void;
  removeSelectedElement: () => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  selectElement: (id: string | null) => void;
  clearElements: () => void;
  // Layer management
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
}

export const useElementStore = create<ElementState>((set) => ({
  elements: [],
  selectedElementId: null,
  
  // Basic CRUD operations
  addElement: (element) => 
    set((state) => ({ elements: [...state.elements, element] })),
  
  removeElement: (id) => 
    set((state) => ({ 
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
    })),
  
  removeSelectedElement: () =>
    set((state) => {
      if (!state.selectedElementId) return state;
      return { 
        elements: state.elements.filter((el) => el.id !== state.selectedElementId),
        selectedElementId: null
      };
    }),
  
  updateElement: (id, updates) => 
    set((state) => ({
      elements: state.elements.map((el) => 
        el.id === id 
          ? { 
              ...el, 
              ...updates,
              // If updates contain object properties, merge them instead of replacing
              object: updates.object 
                ? { ...el.object, ...updates.object } 
                : el.object
            } 
          : el
      )
    })),
  
  selectElement: (id) => set({ selectedElementId: id }),
  
  clearElements: () => set({ elements: [], selectedElementId: null }),
  
  // Layer management functions
  bringToFront: (id) => 
    set((state) => {
      const elements = [...state.elements];
      const index = elements.findIndex(el => el.id === id);
      if (index === -1) return state;
      
      const element = elements[index];
      elements.splice(index, 1);
      elements.push(element);
      
      return { elements };
    }),
  
  sendToBack: (id) => 
    set((state) => {
      const elements = [...state.elements];
      const index = elements.findIndex(el => el.id === id);
      if (index === -1) return state;
      
      const element = elements[index];
      elements.splice(index, 1);
      elements.unshift(element);
      
      return { elements };
    }),
  
  bringForward: (id) => 
    set((state) => {
      const elements = [...state.elements];
      const index = elements.findIndex(el => el.id === id);
      if (index === -1 || index === elements.length - 1) return state;
      
      const element = elements[index];
      elements.splice(index, 1);
      elements.splice(index + 1, 0, element);
      
      return { elements };
    }),
  
  sendBackward: (id) => 
    set((state) => {
      const elements = [...state.elements];
      const index = elements.findIndex(el => el.id === id);
      if (index <= 0) return state;
      
      const element = elements[index];
      elements.splice(index, 1);
      elements.splice(index - 1, 0, element);
      
      return { elements };
    }),
}));
