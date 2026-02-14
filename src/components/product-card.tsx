'use client';

import Image from 'next/image';
import { Plus, Layers } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { useCartAnimation } from '@/context/cart-animation-context';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCartAnimation();
  const isSoldOut = product.inventory <= 0;

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-white/10 transition-all duration-300",
      !isSoldOut && "hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/20",
      isSoldOut && "grayscale"
    )}>
      <div className="aspect-[4/3] overflow-hidden">
        <Image
          src={product.image.src}
          width={product.image.width}
          height={product.image.height}
          alt={product.image.alt}
          data-ai-hint={product.image.hint}
          className={cn(
            "object-cover w-full h-full transition-transform duration-500",
            !isSoldOut && "group-hover:scale-110"
          )}
        />
      </div>
      <div className="p-3 space-y-1">
        <h3 className="font-headline text-base leading-tight truncate text-foreground">{product.name}</h3>
        <p className="text-xs text-muted-foreground">{product.quantityUnit}</p>
        <div className="flex items-center justify-between pt-1">
          <p className="text-base font-bold font-headline text-primary">
            ₹{product.price.toFixed(2)}
          </p>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent-magenta text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
            onClick={(e) => addToCart(product, e)}
            disabled={isSoldOut}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
        </div>
      </div>
      
      {!isSoldOut && product.subCategory && (
        <Badge variant="secondary" className="absolute top-2 right-2 capitalize">{product.subCategory}</Badge>
      )}
      
      { product.variants && product.variants.length > 0 && !isSoldOut && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-2 left-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
                    <Layers className="h-4 w-4 text-white" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Multiple options available</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isSoldOut && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <Badge variant="destructive" className="text-base px-4 py-1">Sold Out</Badge>
        </div>
      )}
    </div>
  );
}
