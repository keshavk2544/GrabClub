'use client';

import React from 'react';

const AnimatedGroceryTitle = () => {
  const letters = [
    { emoji: '🥛', letter: 'G' },
    { emoji: '🧀', letter: 'r' },
    { emoji: '🍞', letter: 'o' },
    { emoji: '🍪', letter: 'c' },
    { emoji: '🥚', letter: 'e' },
    { emoji: '🍫', letter: 'r' },
    { emoji: '🥜', letter: 'y' },
  ];

  return (
    <div className="grocery-container mb-8">
      {letters.map((item, index) => (
        <div key={index} className="letter-wrapper">
          <div className="emoji">{item.emoji}</div>
          <div className="letter">{item.letter}</div>
        </div>
      ))}
    </div>
  );
};

export default AnimatedGroceryTitle;
