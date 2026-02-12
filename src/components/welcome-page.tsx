'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GrabClubWelcome() {
  const [showContent, setShowContent] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const router = useRouter();
  
  const foodEmojis = ['🍕', '🍔', '🥗', '🍜', '🌮', '🍱', '🥘', '🍣'];

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);

    // Emoji rotation
    const emojiInterval = setInterval(() => {
      setCurrentEmoji(prev => (prev + 1) % foodEmojis.length);
    }, 500);

    return () => {
      clearInterval(emojiInterval);
    };
  }, []);

  const handleGetStarted = () => {
    router.push('/login');
  };

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
        <div className={`mb-12 relative transition-all duration-1000 ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
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

        {/* Welcome Text */}
        <div className={`text-center mb-8 transition-all duration-1000 delay-300 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            WELCOME TO
          </h2>
          
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            Grab<span className="text-orange-500">Club</span>
          </h1>

          {/* I-NAV Section */}
          <div className="inline-block mb-4 px-6 py-3 bg-gray-900/50 border border-orange-500/30 rounded-full">
            <p className="text-orange-500 font-bold text-lg">I-NAV</p>
          </div>
          
          <div className="mb-2">
            <p className="text-gray-400 text-sm">
              <span className="text-orange-500 font-semibold">I</span>ntegrated{' '}
              <span className="text-orange-500 font-semibold">N</span>etwork for{' '}
              <span className="text-orange-500 font-semibold">A</span>dvanced{' '}
              <span className="text-orange-500 font-semibold">V</span>ision
            </p>
          </div>

          {/* Tagline */}
          <p className="text-gray-500 text-base mt-4">
            Your ultimate destination for food & groceries
          </p>
        </div>

        {/* CTA Button */}
        <div className={`transition-all duration-1000 delay-600 ${showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <button
            onClick={handleGetStarted}
            className="group relative px-12 py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full font-bold text-lg text-white shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {/* Button text */}
            <span className="relative z-10 flex items-center gap-2">
              Let's Order
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        {/* Loading dots */}
        <div className={`flex gap-2 mt-8 transition-all duration-1000 delay-800 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce animation-delay-400"></div>
        </div>

      </div>
    </div>
  );
}
