'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Package, Settings, LineChart } from 'lucide-react';
import FoodOrdersTab from '@/components/food/orders-tab';
import FoodProductsTab from '@/components/food/products-tab';
import FoodSettingsTab from '@/components/food/settings-tab';
import FoodAnalyticsTab from '@/components/food/analytics-tab';
import { cn } from '@/lib/utils';

export default function FoodDashboardPage() {
  const [activeTab, setActiveTab] = useState('orders');

  const navItems = [
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Menu', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="pb-16 md:pb-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden md:grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="orders"><ShoppingCart className="mr-2 h-4 w-4" /> Orders</TabsTrigger>
            <TabsTrigger value="products"><Package className="mr-2 h-4 w-4" /> Menu</TabsTrigger>
            <TabsTrigger value="analytics"><LineChart className="mr-2 h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
            <FoodOrdersTab />
        </TabsContent>
        <TabsContent value="products">
            <FoodProductsTab />
        </TabsContent>
        <TabsContent value="analytics">
            <FoodAnalyticsTab />
        </TabsContent>
        <TabsContent value="settings">
            <FoodSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Floating Nav for mobile */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-lg border-t border-border/40 md:hidden">
        <div className="grid h-full max-w-lg grid-cols-4 mx-auto font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                type="button"
                className={cn(
                  'inline-flex flex-col items-center justify-center px-5 hover:bg-accent/50 group'
                )}
              >
                <item.icon
                  className={cn(
                    'w-6 h-6 mb-1 text-muted-foreground group-hover:text-foreground',
                    isActive && 'text-primary'
                  )}
                />
                <span
                  className={cn(
                    'text-xs text-muted-foreground group-hover:text-foreground',
                    isActive && 'text-primary'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
