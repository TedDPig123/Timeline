import { createContext, useContext } from "react";

// Save context for settings page
type SettingsContextType = {
  data: string[];
};
export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

// 0,1,2 -> week,month,year

export function useSettingsContext() {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error("Cannot use null context");
  }
  return context;
}

import { MemoryCard } from "../types";

/* 
export type MemModalType = {
   id: string,
   body: string,
   date: string,
   position: { x: number; y: number }
}; 
*/

//specifies what our context will look like
//in our case, it looks like:
// - an array of MemoryCard objects
// - setMemModal, a function to set the array of MemoryCards
// - updateMemModalPosition, a function to set the position of a specific memory card
type MemModalContextType = {
  memModals: MemoryCard[];
  setMemModals: (arg: MemoryCard[]) => void;
  updateMemModalPosition: (
    id: string,
    newPosition: { x: number; y: number },
  ) => void;
};

//call createContext to create a context with undefined as its default value
export const MemModalContext = createContext<MemModalContextType | undefined>(
  undefined,
);

//useContext reads the data from the MemModalContext
//returns the current value of the context if it exists
export function useMemModalContext() {
  const context = useContext(MemModalContext);
  if (context === undefined) {
    throw new Error("Cannot use null context");
  }
  return context;
}

//context for editing mode
type EditContextType = {
  isEditMode: boolean;
  changeMode: (arg: boolean) => void;
};

export const EditingContext = createContext<EditContextType | undefined>(
  undefined,
);

export function useEditingContext() {
  const context = useContext(EditingContext);

  if (context === undefined) {
    throw new Error("Cannot use null context");
  }
  return context;
}
