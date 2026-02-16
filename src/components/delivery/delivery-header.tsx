'use client';
import { useEffect, useState } from 'react';

export default function DeliveryHeader() {
  const [deliveryPersonName, setDeliveryPersonName] = useState('');

  useEffect(() => {
    const deliveryPersonId = sessionStorage.getItem('deliveryPersonId');
    if (deliveryPersonId) {
        try {
            const deliveryPeople = JSON.parse(window.localStorage.getItem('grabclub-delivery-people') || '[]');
            const person = deliveryPeople.find((p: any) => p.id === deliveryPersonId);
            if(person) {
                setDeliveryPersonName(person.name);
            } else {
                setDeliveryPersonName('Delivery Team');
            }
        } catch(e) {
            setDeliveryPersonName('Delivery Team');
        }
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <h1 className="text-xl font-bold">{deliveryPersonName}'s Dashboard</h1>
      </div>
    </header>
  );
}
