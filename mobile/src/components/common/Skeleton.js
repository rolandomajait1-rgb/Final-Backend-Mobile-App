import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Skeleton component for loading states
 * @param {number} width - Width of skeleton (default: '100%')
 * @param {number} height - Height of skeleton (default: 20)
 * @param {string} borderRadius - Border radius (default: 4)
 * @param {string} className - Additional Tailwind classes
 */
export default function Skeleton({ width = '100%', height = 20, borderRadius = 4, className }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-gray-200 ${className || ''}`}
      style={{
        width,
        height,
        borderRadius,
        opacity,
      }}
    />
  );
}
