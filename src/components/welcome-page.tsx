'use client';

import React from 'react';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import AnimatedLogo from '@/components/layout/animated-logo';

const WelcomePage = ({ onEnter }: { onEnter: () => void }) => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(251, 146, 60, 0.1) 0%, transparent 40%)
          `
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        <div className="text-center mb-8">
            <div className="w-40 h-40 mx-auto flex items-center justify-center">
                <AnimatedLogo />
            </div>
          <h1 className="text-6xl font-black mb-3">
            Welcome to Grab<span className="text-orange-500">Club</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">Your one-stop solution for food, groceries, and services, delivered fast.</p>
        </div>
        
        <Button 
            onClick={onEnter} 
            className="group relative px-10 py-7 bg-orange-500 hover:bg-orange-600 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span className="relative flex items-center justify-center gap-3">
            Let's Order
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>
      </div>
    </div>
  );
};

export default WelcomePage;
