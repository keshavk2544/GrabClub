'use client';
// Placeholder file. The original content was lost.
import { createContext } from 'react';

export const SweetsCategoryContext = createContext({ categories: [] });

export function SweetsCategoryProvider({ children }: { children: React.ReactNode }) {
  console.warn("SweetsCategoryProvider is using placeholder data.");
  return (
    <SweetsCategoryContext.Provider value={{ categories: [] }}>
      {children}
    </SweetsCategoryContext.Provider>
  );
}
