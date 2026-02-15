'use client';
// Placeholder file. The original content was lost.
import { createContext } from 'react';

export const VegetableCategoryContext = createContext({ categories: [] });

export function VegetableCategoryProvider({ children }: { children: React.ReactNode }) {
  console.warn("VegetableCategoryProvider is using placeholder data.");
  return (
    <VegetableCategoryContext.Provider value={{ categories: [] }}>
      {children}
    </VegetableCategoryContext.Provider>
  );
}
