'use client';
import React, { useState, useEffect } from 'react';

export default function GrabClubBackground() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="absolute inset-0 min-h-screen bg-black overflow-hidden pointer-events-none">
      {/* Floating food & grocery icons effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isClient && ['🍕', '🍔', '🍎', '🥕', '🥖', '🥛', '🍇', '🥗', '🍝', '🍳', '🥑', '🍊', '🥦', '🍞', '🧀', '🍅', '🥒', '🌽', '🍓', '🥩'].map((icon, i) => (
          <div
            key={i}
            className="absolute text-2xl md:text-3xl animate-float opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: '-10%',
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          >
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
}
