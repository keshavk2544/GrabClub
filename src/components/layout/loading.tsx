'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

export default function GrabClubLoading() {
  const [progress, setProgress] = useState(0);
  const [currentEmoji, setCurrentEmoji] = useState(0);
  
  const foodEmojis = ['🍕', '🍔', '🥗', '🍜', '🌮', '🍱', '🥘', '🍣'];
  const loadingTexts = [
    'Preparing your order...',
    'Finding the best deals...',
    'Loading fresh items...',
    'Almost ready...'
  ];

  useEffect(() => {
    // This hook should only run on the client side
    if (typeof window === 'undefined') return;

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    // Emoji rotation
    const emojiInterval = setInterval(() => {
      setCurrentEmoji(prev => (prev + 1) % foodEmojis.length);
    }, 500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(emojiInterval);
    };
  }, [foodEmojis.length]);

  const currentTextIndex = Math.floor(progress / 25);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md w-full">
        
        {/* Logo with rotating food emojis */}
        <div className="mb-12 relative">
          {/* Rotating ring */}
          <div className="absolute -inset-8">
            <div className="w-full h-full border-2 border-dashed border-orange-500/30 rounded-full animate-spin-slow"></div>
          </div>

          {/* Logo circle */}
          <div className="relative bg-gray-900 border-2 border-orange-500/50 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl">
            {/* Rotating emojis */}
            <div className="relative w-full h-full flex items-center justify-center">
              {foodEmojis.map((emoji, i) => (
                <div
                  key={i}
                  className={`absolute text-6xl transition-all duration-300 ${
                    currentEmoji === i 
                      ? 'scale-100 opacity-100 rotate-0' 
                      : 'scale-0 opacity-0 rotate-180'
                  }`}
                >
                  {emoji}
                </div>
              ))}
            </div>

            {/* Pulsing rings */}
            <div className="absolute inset-0 border-2 border-orange-500/50 rounded-full animate-ping-slow"></div>
            <div className="absolute -inset-2 border-2 border-orange-500/30 rounded-full animate-ping-slow animation-delay-500"></div>
          </div>

          {/* Orbiting dots */}
          <div className="absolute -inset-12 animate-spin-reverse">
            <div className="relative w-full h-full">
              <div className="absolute top-0 left-1/2 w-3 h-3 bg-orange-500 rounded-full -ml-1.5"></div>
              <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-orange-500 rounded-full -ml-1.5"></div>
            </div>
          </div>
        </div>

        {/* Brand name */}
        <h1 className="text-4xl font-black mb-2">
          Grab<span className="text-orange-500">Club</span>
        </h1>

        {/* I-NAV badge */}
        <div className="mb-8 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-full">
          <p className="text-orange-500 font-bold text-xs">I-NAV</p>
        </div>

        {/* Loading text */}
        <div className="mb-8 h-6">
          <p className="text-gray-400 text-sm animate-fade-in">
            {loadingTexts[Math.min(currentTextIndex, loadingTexts.length - 1)]}
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>

      </div>
    </div>
  );
}
