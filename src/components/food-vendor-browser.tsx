'use client';

import { useState, useMemo } from 'react';
import type { Vendor, Product } from '@/lib/types';
import VendorCard from '@/components/vendor-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type FoodVendorBrowserProps = {
  vendors: Vendor[];
  products: Product[];
};

export default function FoodVendorBrowser({ vendors, products }: FoodVendorBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVendors = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return vendors;
    }

    // Filter by vendor name
    const vendorsByName = vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(query)
    );

    // Find vendors by product name or keywords
    const matchingProductVendorIds = new Set(
        products
        .filter(product => 
            product.name.toLowerCase().includes(query) ||
            (product.keywords && product.keywords.toLowerCase().includes(query))
        )
        .map(product => product.vendorId)
    );

    const vendorsByProduct = vendors.filter(vendor =>
      matchingProductVendorIds.has(vendor.id)
    );
    
    // Combine and remove duplicates
    const allMatchingVendors = [...vendorsByName, ...vendorsByProduct];
    
    return Array.from(new Map(allMatchingVendors.map(v => [v.id, v])).values());

  }, [searchQuery, vendors, products]);

  return (
    <div>
        <div className="relative w-full md:w-1/2 lg:w-1/3 mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search restaurants or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
            />
        </div>

      {filteredVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map(vendor => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
            <h3 className="text-xl font-headline font-bold">No Restaurants Found</h3>
            <p className="mt-2 text-muted-foreground">
                Your search for "{searchQuery}" did not match any restaurants or dishes.
            </p>
        </div>
      )}
    </div>
  );
}
