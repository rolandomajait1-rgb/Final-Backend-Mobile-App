import { useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import * as SplashScreenNative from 'expo-splash-screen';

const { width } = Dimensions.get('window');

/**
 * SplashScreen - Professional animated splash screen with gold shimmer effect
 * Safe for APK builds - uses only React Native Animated API
 * @param {Function} onFinish - Callback when splash completes
 * @param {Function} onError - Callback when error occurs
 */
export default function SplashScreen({ onFinish, onError }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    console.log('[SplashScreen] Starting...');
    
    // Hide native splash screen immediately
    SplashScreenNative.hideAsync().catch(() => {});

    // Start main animations
    Animated.parallel([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale up
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Slide up text
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Gold shimmer animation - continuous loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing dots animation
    const createDotAnimation = (animValue, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createDotAnimation(dot1Anim, 0).start();
    createDotAnimation(dot2Anim, 200).start();
    createDotAnimation(dot3Anim, 400).start();

    // Finish after 2.5 seconds
    timeoutRef.current = setTimeout(() => {
      console.log('[SplashScreen] Timeout reached - calling onFinish');
      if (onFinish) {
        onFinish();
      }
    }, 2500);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onFinish, fadeAnim, scaleAnim, slideAnim, shimmerAnim, dot1Anim, dot2Anim, dot3Anim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {/* Animated Logo with Premium Gold Masked Slant Effect */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <MaskedView
          style={[styles.logoWrapper, { borderRadius: 100 }]}
          maskElement={
            <View style={[styles.logoWrapper, { backgroundColor: 'transparent', borderRadius: 100 }]}>
              <Image
                source={require('../../assets/logo.png')}
                style={[styles.logo, { borderRadius: 100 }]}
                resizeMode="contain"
              />
            </View>
          }
        >
          {/* Base logo */}
          <Image
            source={require('../../assets/logo.png')}
            style={[styles.logo, { borderRadius: 100 }]}
            resizeMode="contain"
          />
          
          {/* Premium gold slant overlay - contained within circle */}
          <Animated.View
            style={[
              styles.premiumSlantOverlay,
              {
                transform: [
                  { translateX: shimmerTranslate },
                  { skewX: '-20deg' },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255, 215, 0, 0.8)',
                'rgba(255, 184, 0, 0.6)',
                'rgba(255, 140, 0, 0.4)',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.slantGradient, { borderRadius: 100 }]}
            />
          </Animated.View>
        </MaskedView>
      </Animated.View>

      {/* Animated Text with Gold Shimmer */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>La Verdad Herald</Text>
          {/* Gold shimmer overlay for text */}
          <Animated.View
            style={[
              styles.textShimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslate }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 215, 0, 0.8)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.textShimmerGradient}
            />
          </Animated.View>
        </View>
        <Text style={styles.subtitle}>Truth in Every Story</Text>
      </Animated.View>

      {/* Pulsing loading dots */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.loadingDot,
            {
              opacity: dot1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  scale: dot1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.loadingDot,
            {
              opacity: dot2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  scale: dot2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.loadingDot,
            {
              opacity: dot3Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  scale: dot3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C5F7F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoWrapper: {
    position: 'relative',
    overflow: 'hidden',
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 200,
    maxHeight: 200,
    borderRadius: (width * 0.5) / 2,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 200,
    maxHeight: 200,
    borderRadius: (width * 0.5) / 2,
  },
  premiumSlantOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 200,
    maxHeight: 200,
    borderRadius: (width * 0.5) / 2,
  },
  slantGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width * 0.5,
    maxWidth: 200,
  },
  shimmerGradient: {
    flex: 1,
    width: width * 0.3,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleWrapper: {
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFB800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  textShimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    bottom: 0,
    width: width,
  },
  textShimmerGradient: {
    flex: 1,
    width: width * 0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB800',
    marginHorizontal: 4,
  },
});
