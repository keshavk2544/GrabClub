'use client';

import React from 'react';

const AnimatedBakeryTitle = () => {
  const letters = [
    { emoji: '🎂', letter: 'B' },
    { emoji: '🍞', letter: 'a' },
    { emoji: '🥐', letter: 'k' },
    { emoji: '🥯', letter: 'e' },
    { emoji: '🧁', letter: 'r' },
    { emoji: '🍩', letter: 'y' },
  ];

  return (
    <div className="grocery-container bakery-title mb-8">
      {letters.map((item, index) => (
        <div key={index} className="letter-wrapper">
          <div className="emoji">{item.emoji}</div>
          <div className="letter">{item.letter}</div>
        </div>
      ))}
    </div>
  );
};

export default AnimatedBakeryTitle;
