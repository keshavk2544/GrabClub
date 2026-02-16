'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { products as initialProducts } from '@/lib/data';

const CATEGORIES_STORAGE_KEY = 'grabclub-vegetable-categories';

// Derive default categories from initial product data
const defaultVegetableSubCategories = Array.from(
  new Set(
    initialProducts
      .filter(p => p.category === 'vegetables' && p.subCategory)
      .map(p => p.subCategory!.toLowerCase().trim())
  )
).sort();


interface VegetableCategoryContextType {
  categories: string[];
  addCategory: (category: string) => void;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (categoryName: string) => void;
  isLoading: boolean;
}

const VegetableCategoryContext = createContext<VegetableCategoryContextType | undefined>(undefined);

export function VegetableCategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCategories = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        setCategories(defaultVegetableSubCategories);
      }
    } catch (error) {
      console.error('Failed to load vegetable categories from localStorage, using defaults.', error);
      setCategories(defaultVegetableSubCategories);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      } catch (error) {
        console.error('Failed to save vegetable categories to localStorage.', error);
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
    <VegetableCategoryContext.Provider value={value}>
      {children}
    </VegetableCategoryContext.Provider>
  );
}

export function useVegetableCategories() {
  const context = useContext(VegetableCategoryContext);
  if (context === undefined) {
    throw new Error('useVegetableCategories must be used within a VegetableCategoryProvider');
  }
  return context;
}
