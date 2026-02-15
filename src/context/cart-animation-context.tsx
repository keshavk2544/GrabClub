'use client';
import React, { createContext, useContext, useState } from 'react';

type CartAnimationContextType = {
  cartCount: number;
  triggerAnimation: () => void;
};

const CartAnimationContext = createContext<CartAnimationContextType>({
  cartCount: 0,
  triggerAnimation: () => {},
});

export const useCartAnimation = () => useContext(CartAnimationContext);

export const CartAnimationProvider = ({ children }: { children: React.ReactNode }) => {
  // This is a placeholder implementation.
  // The original likely had more complex state management.
  const [cartCount, setCartCount] = useState(0);

  const triggerAnimation = () => {
    // This function would likely trigger a CSS animation.
    console.log("Cart animation triggered!");
  };

  const value = { cartCount, triggerAnimation };

  return (
    <CartAnimationContext.Provider value={value}>
      {children}
    </CartAnimationContext.Provider>
  );
};
