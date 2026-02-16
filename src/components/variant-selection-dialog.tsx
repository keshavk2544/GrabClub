'use client';

import type { Product, ProductVariant } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

type VariantSelectionDialogProps = {
  product: Product | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onAddToCart: (product: Product, event: React.MouseEvent<HTMLElement>, variant?: ProductVariant) => void;
  buttonRef: React.RefObject<HTMLElement | null>;
};

export function VariantSelectionDialog({ product, isOpen, setIsOpen, onAddToCart, buttonRef }: VariantSelectionDialogProps) {
  if (!product) {
    return null;
  }

  const allOptions = [{ name: product.quantityUnit, price: product.price }, ...(product.variants || [])];

  const handleAddToCartClick = (option: { name: string; price: number }, event: React.MouseEvent<HTMLElement>) => {
    // Determine if it's the main product or a variant
    const variant = allOptions.find(opt => opt.name === option.name && opt.price === option.price) === allOptions[0] ? undefined : { name: option.name, price: option.price };
    onAddToCart(product, event, variant);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select an Option</DialogTitle>
          <DialogDescription>Choose a size or variant for {product.name}.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-4">
            <Image src={product.image.src} alt={product.image.alt} width={80} height={80} className="rounded-md object-cover aspect-square" />
            <div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground">{product.vendorId}</p>
            </div>
          </div>
          <div className="space-y-2 pt-4">
            {allOptions.map((option, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-lg border bg-muted/50">
                <div className="font-medium">
                  <p>{option.name}</p>
                  <p className="text-primary font-bold">₹{option.price.toFixed(2)}</p>
                </div>
                <Button size="icon" className="h-8 w-8" onClick={(e) => handleAddToCartClick(option, e)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
