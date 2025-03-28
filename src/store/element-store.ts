
import { create } from "zustand";

interface Element {
  id: string;
  type: string;
  object: any; // Fabric.js object data
}

interface ElementState {
  elements: Element[];
  selectedElementId: string | null;
  addElement: (element: Element) => void;
  removeElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<Element>) => void;
  selectElement: (id: string | null) => void;
  clearElements: () => void;
}

export const useElementStore = create<ElementState>((set) => ({
  elements: [],
  selectedElementId: null,
  addElement: (element) => 
    set((state) => ({ elements: [...state.elements, element] })),
  removeElement: (id) => 
    set((state) => ({ 
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
    })),
  updateElement: (id, updates) => 
    set((state) => ({
      elements: state.elements.map((el) => 
        el.id === id ? { ...el, ...updates } : el
      )
    })),
  selectElement: (id) => set({ selectedElementId: id }),
  clearElements: () => set({ elements: [], selectedElementId: null }),
}));
