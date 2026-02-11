'use client';

import React from 'react';

const AnimatedVegetableTitle = () => {
  const letters = [
    { emoji: '🥦', letter: 'V' },
    { emoji: '🥕', letter: 'e' },
    { emoji: '🍅', letter: 'g' },
    { emoji: '🥔', letter: 'e' },
    { emoji: '🌽', letter: 't' },
    { emoji: '🍆', letter: 'a' },
    { emoji: '🥒', letter: 'b' },
    { emoji: '🧄', letter: 'l' },
    { emoji: '🌶️', letter: 'e' },
    { emoji: '🍄', letter: 's' },
  ];

  return (
    <div className="grocery-container vegetable-title mb-8">
      {letters.map((item, index) => (
        <div key={index} className="letter-wrapper">
          <div className="emoji">{item.emoji}</div>
          <div className="letter">{item.letter}</div>
        </div>
      ))}
    </div>
  );
};

export default AnimatedVegetableTitle;
