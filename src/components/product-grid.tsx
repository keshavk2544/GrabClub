'use client';

import { useState, useMemo, useEffect } from 'react';
import ProductCard from '@/components/product-card';
import type { Product } from '@/lib/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, createRipple } from '@/lib/utils';

type ProductGridProps = {
  title: string;
  products: Product[];
  className?: string;
};

export default function ProductGrid({ title, products, className }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (searchQuery) {
      setActiveCategory('all');
    }
  }, [searchQuery]);

  const subCategories = useMemo(() => {
    if (products.length === 0) return [];
    const categories = new Set(products.map(p => p.subCategory).filter(Boolean) as string[]);
    if (categories.size < 1) return []; // Do not show tabs if there are no sub-categories
    return ['all', ...Array.from(categories).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let prods = products;

    if (activeCategory !== 'all' && !searchQuery) {
      prods = prods.filter(p => p.subCategory?.toLowerCase() === activeCategory.toLowerCase());
    }
    
    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        prods = products.filter((product) =>
          product.name.toLowerCase().includes(lowercasedQuery) ||
          (product.keywords && product.keywords.toLowerCase().includes(lowercasedQuery))
        );
    }

    return prods;
  }, [searchQuery, products, activeCategory]);

  return (
    <section className={`py-8 sm:py-12 ${className}`}>
      <div className="container">
        <div className="relative z-10 mb-8 flex flex-col items-center gap-4">
            <div className="relative w-full md:max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                type="search"
                placeholder={`Search in ${title}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base rounded-full"
                />
            </div>

            {subCategories.length > 1 && (
                <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                    <div className="flex justify-center">
                        <TabsList className="category-container h-auto justify-center">
                            {subCategories.map((cat) => (
                                <TabsTrigger 
                                    key={cat} 
                                    value={cat} 
                                    className={cn(
                                        "category-btn capitalize",
                                        cat.toLowerCase()
                                    )}
                                    onClick={createRipple}
                                >
                                    {cat}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </Tabs>
            )}
        </div>
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-headline font-bold">No Products Found</h3>
            <p className="mt-2 text-muted-foreground">
                Your search for "{searchQuery}" did not match any products in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
