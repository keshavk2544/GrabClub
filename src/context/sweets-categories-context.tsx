'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { products as initialProducts } from '@/lib/data';

const CATEGORIES_STORAGE_KEY = 'grabclub-sweets-categories';

// Derive default categories from initial product data
const defaultSweetsSubCategories = Array.from(
  new Set(
    initialProducts
      .filter(p => p.category === 'sweets' && p.subCategory)
      .map(p => p.subCategory!.toLowerCase().trim())
  )
).sort();


interface SweetsCategoryContextType {
  categories: string[];
  addCategory: (category: string) => void;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (categoryName: string) => void;
  isLoading: boolean;
}

const SweetsCategoryContext = createContext<SweetsCategoryContextType | undefined>(undefined);

export function SweetsCategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCategories = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        setCategories(defaultSweetsSubCategories);
      }
    } catch (error) {
      console.error('Failed to load sweets categories from localStorage, using defaults.', error);
      setCategories(defaultSweetsSubCategories);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      } catch (error) {
        console.error('Failed to save sweets categories to localStorage.', error);
      }
    }
  }, [categories, isLoading]);

  const addCategory = useCallback((category: string) => {
    const lowerCaseCategory = category.toLowerCase().trim();
    if (lowerCaseCategory && !categories.map(c => c.toLowerCase()).includes(lowerCaseCategory)) {
      setCategories(currentCategories => [...currentCategories, lowerCaseCategory].sort());
    }
  }, [categories]);

  const renameCategory = useCallback((oldName: string, newName: string): boolean => {
    const lowerCaseOld = oldName.toLowerCase().trim();
    const lowerCaseNew = newName.toLowerCase().trim();
    if (!lowerCaseOld || !lowerCaseNew || lowerCaseOld === lowerCaseNew) return false;

    if (categories.map(c => c.toLowerCase()).includes(lowerCaseNew)) {
        return false; // indicates failure
    }

    setCategories(currentCategories => 
        currentCategories.map(c => 
            c.toLowerCase() === lowerCaseOld ? lowerCaseNew : c
        ).sort()
    );
    return true;
  }, [categories]);

  const deleteCategory = useCallback((categoryName: string) => {
    const lowerCaseCategory = categoryName.toLowerCase().trim();
    if (lowerCaseCategory) {
        setCategories(currentCategories => 
            currentCategories.filter(c => c.toLowerCase() !== lowerCaseCategory)
        );
    }
  }, []);

  const value = { categories, addCategory, renameCategory, deleteCategory, isLoading };

  return (
    <SweetsCategoryContext.Provider value={value}>
      {children}
    </SweetsCategoryContext.Provider>
  );
}

export function useSweetsCategories() {
  const context = useContext(SweetsCategoryContext);
  if (context === undefined) {
    throw new Error('useSweetsCategories must be used within a SweetsCategoryProvider');
  }
  return context;
}
