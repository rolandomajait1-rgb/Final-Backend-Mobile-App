import { useEffect, useRef } from 'react';
import { View, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreenNative from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreenNative.preventAutoHideAsync();

const logo = require('../../assets/logo.png');
const textLogo = require('../../assets/la verdad herald.png');

/**
 * SplashScreen - Shows animated logo with shine effect on app launch
 * @param {Function} onFinish - Callback when animation completes
 */
export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Hide native splash screen immediately when custom one is ready
    SplashScreenNative.hideAsync().catch(() => {});

    // Safety timeout - force finish after 5 seconds if animation fails
    const safetyTimeout = setTimeout(() => {
      console.log('Splash screen timeout - forcing finish');
      if (onFinish) {
        onFinish();
      }
    }, 5000);

    try {
    // Shine animation that loops
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    );

    // Start shine animation
    shineLoop.start();

    // Sequence of animations
    Animated.sequence([
      // Logo fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text logo fade in
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(800),
      // Fade out everything
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Stop shine animation
      shineLoop.stop();
      
      // Clear safety timeout
      clearTimeout(safetyTimeout);
      
      // Animation complete, call onFinish
      if (onFinish) {
        onFinish();
      }
    });
    } catch (error) {
      console.error('Splash screen animation error:', error);
      clearTimeout(safetyTimeout);
      // Force finish on error
      if (onFinish) {
        onFinish();
      }
    }

    // Cleanup
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [fadeAnim, scaleAnim, textFadeAnim, shineAnim, onFinish]);

  // Interpolate shine position
  const shineTranslateX = shineAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-300, 300],
  });

  return (
    <View className="flex-1 bg-[#2C5F7F] justify-center items-center">
      {/* Logo with scale, fade, and shine animation */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          overflow: 'hidden',
        }}
      >
        <View className="w-[150px] h-[150px] relative overflow-hidden rounded-full">
          <Image
            source={logo}
            className="w-[150px] h-[150px]"
            resizeMode="contain"
          />
          
          {/* Shine overlay - diagonal sweep */}
          <Animated.View
            className="absolute -top-[50px] -left-[50px] w-[80px] h-[300px]"
            style={{
              transform: [
                { translateX: shineTranslateX },
                { rotate: '-45deg' },
              ],
            }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 215, 0, 0.4)', 'rgba(255, 223, 0, 0.7)', 'rgba(255, 215, 0, 0.4)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="w-full h-full"
            />
          </Animated.View>
        </View>
      </Animated.View>

      {/* Text logo with fade animation */}
      <Animated.View
        className="mt-2.5"
        style={{
          opacity: textFadeAnim,
        }}
      >
        <Image
          source={textLogo}
          className="w-[200px] h-[60px]"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
