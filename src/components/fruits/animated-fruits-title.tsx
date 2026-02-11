'use client';

import React from 'react';

const AnimatedFruitsTitle = () => {
  const letters = [
    { emoji: '🍎', letter: 'F' },
    { emoji: '🍌', letter: 'r' },
    { emoji: '🍓', letter: 'u' },
    { emoji: '🍊', letter: 'i' },
    { emoji: '🥭', letter: 't' },
    { emoji: '🍒', letter: 's' },
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

export default AnimatedFruitsTitle;
