'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Store, ShoppingCart, Users, Settings, Truck, Landmark } from 'lucide-react';
import AdminHomeTab from '@/components/admin/home-tab';
import AdminVendorsTab from '@/components/admin/vendors-tab';
import AdminOrdersTab from '@/components/admin/orders-tab';
import AdminUsersTab from '@/components/admin/users-tab';
import AdminSettingsTab from '@/components/admin/settings-tab';
import AdminDeliveryTab from '@/components/admin/delivery-tab';
import AdminFinanceTab from '@/components/admin/finance-tab';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'finance', label: 'Finance', icon: Landmark },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="container py-8 pb-20 md:pb-8">
      <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-6">
        Admin Dashboard
      </h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden md:grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="home"><LayoutDashboard className="mr-2" /> Home</TabsTrigger>
          <TabsTrigger value="vendors"><Store className="mr-2" /> Vendors</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="mr-2" /> Orders</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2" /> Users</TabsTrigger>
          <TabsTrigger value="delivery"><Truck className="mr-2" /> Delivery</TabsTrigger>
          <TabsTrigger value="finance"><Landmark className="mr-2" /> Finance</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2" /> Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="home">
          <AdminHomeTab />
        </TabsContent>
        <TabsContent value="vendors">
          <AdminVendorsTab />
        </TabsContent>
        <TabsContent value="orders">
          <AdminOrdersTab />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersTab />
        </TabsContent>
        <TabsContent value="delivery">
            <AdminDeliveryTab />
        </TabsContent>
        <TabsContent value="finance">
            <AdminFinanceTab />
        </TabsContent>
        <TabsContent value="settings">
          <AdminSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Floating Nav for mobile */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-lg border-t border-border/40 md:hidden">
        <div className="grid h-full max-w-lg grid-cols-7 mx-auto font-medium">
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
