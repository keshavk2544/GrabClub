'use client';

import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import { useVegetableCategories } from '@/context/vegetable-categories-context';
import ProductCard from './product-card';
import { cn, createRipple } from '@/lib/utils';

export default function VegetableBrowser() {
  const { products, isLoading: productsIsLoading } = useProducts();
  const { categories, isLoading: categoriesIsLoading } = useVegetableCategories();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (searchQuery) {
      setActiveCategory('all');
    }
  }, [searchQuery]);

  const isLoading = productsIsLoading || categoriesIsLoading;

  const vegetableProducts = useMemo(() => products.filter(p => p.category === 'vegetables'), [products]);
  
  const categoryTabs = useMemo(() => ['all', ...categories.sort()], [categories]);

  const filteredProducts = useMemo(() => {
    let prods = vegetableProducts;
    
    if (activeCategory !== 'all' && !searchQuery) {
      prods = prods.filter(p => p.subCategory?.toLowerCase() === activeCategory.toLowerCase());
    }
    
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      prods = vegetableProducts.filter(p => 
          p.name.toLowerCase().includes(lowercasedQuery) ||
          (p.keywords && p.keywords.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    return prods;
  }, [vegetableProducts, activeCategory, searchQuery]);

  if (isLoading) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/3] rounded-2xl" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            ))}
        </div>
    );
  }

  return (
    <div>
      <div className="relative z-10 mb-8 flex flex-col items-center gap-4">
        <div className="relative w-full md:max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Search all vegetables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base rounded-full"
            />
        </div>
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <div className="flex justify-center">
                <TabsList className="category-container h-auto justify-center">
                    {categoryTabs.map((cat) => (
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
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-16">
            <h3 className="text-xl font-headline font-bold">No Products Found</h3>
            <p className="mt-2 text-muted-foreground">
                No products match your current filters.
            </p>
        </div>
      )}
    </div>
  );
}
