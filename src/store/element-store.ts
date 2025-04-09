
import { create } from "zustand";

// Type definitions for better type safety
export interface FabricObjectData {
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  opacity?: number;
  cornerRadius?: number,
  [key: string]: any; // For other Fabric.js properties
}

export interface Element {
  id: string;
  type: string;
  object: FabricObjectData;
  isModified: boolean;
  selected: boolean;
  strokeDashArray?: [number];
  cornerRadius?: number;
}

interface ElementState {
  elements: Element[];
  addElement: (element: Element) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  selectElement: (id: string | null) => void;
  deselectElements: () => void;
  clearElements: () => void;
  // Layer management
  // bringToFront: (id: string) => void;
  // sendToBack: (id: string) => void;
  // bringForward: (id: string) => void;
  // sendBackward: (id: string) => void;
}

export const useElementStore = create<ElementState>((set) => ({
  elements: [],
  
  // Basic CRUD operations
  addElement: (element) => 
    set((state) => ({ elements: [...state.elements, element] })),

  removeElement: (id) => set((state) => ({ 
    elements: state.elements.filter((el) => el.id !== id),
  })),
  
  updateElement: (id, updates) => 
    set((state) => ({
      elements: state.elements.map((el) => 
        el.id === id 
          ? { 
              ...el, 
              ...updates,
              isModified: true,
              // If updates contain object properties, merge them instead of replacing
              object: updates.object 
                ? { ...el.object, ...updates.object } 
                : el.object,
            } 
          : el
      )
    })),
  
  selectElement: (id) => set((state) => ({
    elements: state.elements.map((elem) => {

      if (elem.id == id ) {
        elem.selected = true;
        elem.isModified = true;
      } else if ( id == null ) {
        elem.selected = false;
        elem.isModified = true;
      }
      return elem
    })
  })),

  deselectElements: () => set((state) => ({
    elements: state.elements.map((elem) => {
      elem.selected = false;
      elem.isModified = true;
      return elem
    })
  })),
  
  clearElements: () => set({ elements: [] }),

  // // Layer management functions
  // bringToFront: (id) => 
  //   set((state) => {
  //     const elements = [...state.elements];
  //     const index = elements.findIndex(el => el.id === id);
  //     if (index === -1) return state;
      
  //     const element = elements[index];
  //     elements.splice(index, 1);
  //     elements.push(element);
      
  //     return { elements };
  //   }),
  
  // sendToBack: (id) => 
  //   set((state) => {
  //     const elements = [...state.elements];
  //     const index = elements.findIndex(el => el.id === id);
  //     if (index === -1) return state;
      
  //     const element = elements[index];
  //     elements.splice(index, 1);
  //     elements.unshift(element);
      
  //     return { elements };
  //   }),
  
  // bringForward: (id) => 
  //   set((state) => {
  //     const elements = [...state.elements];
  //     const index = elements.findIndex(el => el.id === id);
  //     if (index === -1 || index === elements.length - 1) return state;
      
  //     const element = elements[index];
  //     elements.splice(index, 1);
  //     elements.splice(index + 1, 0, element);
      
  //     return { elements };
  //   }),
  
  // sendBackward: (id) => 
  //   set((state) => {
  //     const elements = [...state.elements];
  //     const index = elements.findIndex(el => el.id === id);
  //     if (index <= 0) return state;
      
  //     const element = elements[index];
  //     elements.splice(index, 1);
  //     elements.splice(index - 1, 0, element);
      
  //     return { elements };
  //   }),
}));
