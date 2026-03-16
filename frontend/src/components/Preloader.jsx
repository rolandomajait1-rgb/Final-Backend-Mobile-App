import React, { useState, useEffect } from 'react';
import logo from '../assets/images/logo.svg';

const Preloader = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'La Verdad Herald..';
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <img
        src={logo}
        alt="Logo"
        className="w-40 h-40 mb-4"
        style={{
          animation: 'pop 0.5s ease-out forwards, shine 2s ease-in-out infinite alternate, pulse 2s ease-in-out infinite',
          filter: 'drop-shadow(0 0 10px #FFD700) brightness(1.2)'
        }}
      />
      <div className="text-4xl font-bold text-cyan-800" style={{ fontFamily: "'Courgette', cursive" }}>
        {displayText}
        <span className={`ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>|</span>
      </div>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Courgette&display=swap');
          @keyframes pop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes shine {
            0% { filter: drop-shadow(0 0 5px #FFD700) brightness(1); }
            100% { filter: drop-shadow(0 0 20px #FFD700) brightness(1.5); }
          }

        `}
      </style>
    </div>
  );
};

export default Preloader;
