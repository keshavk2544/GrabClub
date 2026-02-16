'use client';

import { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Edit, Settings, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AddProductDialog } from './add-product-dialog';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import { useVegetableCategories } from '@/context/vegetable-categories-context';
import { cn, createRipple } from '@/lib/utils';
import { ManageCategoriesDialog } from './manage-categories-dialog';
import { RestockDialog } from './restock-dialog';

export default function VegetableProductsTab() {
  const { products, deleteProduct, isLoading: productsIsLoading } = useProducts();
  const { categories, isLoading: categoriesIsLoading } = useVegetableCategories();
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);

  const isLoading = productsIsLoading || categoriesIsLoading;
  
  const categoryTabs = useMemo(() => ['all', ...categories.sort()], [categories]);

  const filteredProducts = useMemo(() => {
    let prods = products.filter(p => p.category === 'vegetables');
    
    if (activeCategory !== 'all') {
      prods = prods.filter(p => p.subCategory?.toLowerCase() === activeCategory.toLowerCase());
    }
    
    if (searchQuery) {
      prods = prods.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return prods;
  }, [products, activeCategory, searchQuery]);
  
  const handleAddClick = () => {
    setEditingProduct(null);
    setIsAddProductDialogOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductDialogOpen(true);
  };

  const handleRestockClick = (product: Product) => {
    setRestockingProduct(product);
    setIsRestockDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    deleteProduct(product.id, product.vendorId);
  }

  if (isLoading) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
    <div className="relative z-0">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                 <Button onClick={() => setIsManageCategoriesOpen(true)} variant="outline" className="w-full sm:w-auto">
                    <Settings className="mr-2 h-4 w-4" /> Manage Categories
                </Button>
                <Button onClick={handleAddClick} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>
        </div>
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value)}>
            <div className="flex justify-center">
                <TabsList className="category-container h-auto justify-center">
                    {categoryTabs.map((cat) => (
                        <TabsTrigger key={cat} value={cat} 
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="overflow-hidden flex flex-col">
            <CardHeader className="p-0 relative">
                <Image src={product.image.src} alt={product.image.alt} width={400} height={300} className="aspect-[4/3] object-cover" />
                <Badge variant="secondary" className="absolute top-2 left-2 capitalize">{product.subCategory || 'other'}</Badge>
                <Badge variant={product.inventory > 0 ? 'default' : 'destructive'} className={cn("absolute top-2 right-2", product.inventory > 5 ? 'bg-green-600' : product.inventory > 0 ? 'bg-amber-500' : '')}>
                    {product.inventory > 0 ? `${product.inventory} in stock` : 'Sold out'}
                </Badge>
            </CardHeader>
            <CardContent className="p-3 space-y-1 flex-grow">
                <h3 className="font-semibold leading-tight truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.quantityUnit}</p>
            </CardContent>
            <CardFooter className="p-3 flex justify-between items-center">
                <p className="font-bold text-base">₹{product.price.toFixed(2)}</p>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestockClick(product)}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(product)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product "{product.name}".
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardFooter>
          </Card>
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
      <AddProductDialog
        isOpen={isAddProductDialogOpen}
        setIsOpen={setIsAddProductDialogOpen}
        product={editingProduct}
      />
      <ManageCategoriesDialog
        isOpen={isManageCategoriesOpen}
        setIsOpen={setIsManageCategoriesOpen}
      />
      <RestockDialog
        isOpen={isRestockDialogOpen}
        setIsOpen={setIsRestockDialogOpen}
        product={restockingProduct}
       />
    </div>
  );
}
