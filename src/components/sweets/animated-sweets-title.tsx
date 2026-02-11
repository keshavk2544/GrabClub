'use client';

import React from 'react';

const AnimatedSweetsTitle = () => {
  const letters = [
    { emoji: '🍰', letter: 'S' },
    { emoji: '🍫', letter: 'w' },
    { emoji: '🍬', letter: 'e' },
    { emoji: '🍭', letter: 'e' },
    { emoji: '🍯', letter: 't' },
    { emoji: '🥨', letter: 's' },
  ];

  return (
    <div className="grocery-container sweets-title mb-8">
      {letters.map((item, index) => (
        <div key={index} className="letter-wrapper">
          <div className="emoji">{item.emoji}</div>
          <div className="letter">{item.letter}</div>
        </div>
      ))}
    </div>
  );
};

export default AnimatedSweetsTitle;
