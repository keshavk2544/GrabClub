'use client';
// Placeholder file. The original content was lost.
import { createContext } from 'react';

export const FruitCategoryContext = createContext({ categories: [] });

export function FruitCategoryProvider({ children }: { children: React.ReactNode }) {
  console.warn("FruitCategoryProvider is using placeholder data.");
  return (
    <FruitCategoryContext.Provider value={{ categories: [] }}>
      {children}
    </FruitCategoryContext.Provider>
  );
}
