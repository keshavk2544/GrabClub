'use client';
// Placeholder file. The original content was lost.
import { createContext } from 'react';

export const GroceryCategoryContext = createContext({ categories: [] });

export function GroceryCategoryProvider({ children }: { children: React.ReactNode }) {
  console.warn("GroceryCategoryProvider is using placeholder data.");
  return (
    <GroceryCategoryContext.Provider value={{ categories: [] }}>
      {children}
    </GroceryCategoryContext.Provider>
  );
}
