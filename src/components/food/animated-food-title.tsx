'use client';

import React from 'react';

const AnimatedFoodTitle = () => {
  const letters = [
    { emoji: '🍕', letter: 'F' },
    { emoji: '🍔', letter: 'o' },
    { emoji: '🍟', letter: 'o' },
    { emoji: '🍗', letter: 'd' },
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

export default AnimatedFoodTitle;
