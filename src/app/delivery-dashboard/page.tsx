'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, CheckCircle, User } from 'lucide-react';
import AvailableOrdersTab from '@/components/delivery/available-orders-tab';
import MyDeliveriesTab from '@/components/delivery/my-deliveries-tab';
import DeliverySettingsTab from '@/components/delivery/settings-tab';
import { cn } from '@/lib/utils';

export default function DeliveryDashboardPage() {
  const [activeTab, setActiveTab] = useState('available');

  const navItems = [
    { id: 'available', label: 'Available', icon: List },
    { id: 'deliveries', label: 'My Deliveries', icon: CheckCircle },
    { id: 'settings', label: 'Settings', icon: User },
  ];

  return (
    <div className="pb-16 md:pb-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden md:grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="available"><List className="mr-2 h-4 w-4" /> Available Orders</TabsTrigger>
            <TabsTrigger value="deliveries"><CheckCircle className="mr-2 h-4 w-4" /> My Deliveries</TabsTrigger>
            <TabsTrigger value="settings"><User className="mr-2 h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="available">
            <AvailableOrdersTab />
        </TabsContent>
        <TabsContent value="deliveries">
            <MyDeliveriesTab />
        </TabsContent>
        <TabsContent value="settings">
            <DeliverySettingsTab />
        </TabsContent>
      </Tabs>

      {/* Floating Nav for mobile */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-lg border-t border-border/40 md:hidden">
        <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                type="button"
                className={cn('inline-flex flex-col items-center justify-center px-5 hover:bg-accent/50 group')}>
                <item.icon className={cn('w-6 h-6 mb-1 text-muted-foreground group-hover:text-foreground', isActive && 'text-primary')} />
                <span className={cn('text-xs text-muted-foreground group-hover:text-foreground', isActive && 'text-primary')}>
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
