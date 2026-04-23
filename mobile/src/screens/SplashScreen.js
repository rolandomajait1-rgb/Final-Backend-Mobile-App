import { useEffect, useRef, useState } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import * as SplashScreenNative from 'expo-splash-screen';

/**
 * SplashScreen - Simplified version without complex animations
 * Uses a simple text-based splash to avoid image loading issues
 * @param {Function} onFinish - Callback when splash completes
 * @param {Function} onError - Callback when error occurs
 */
export default function SplashScreen({ onFinish, onError }) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    console.log('[SplashScreen] Starting...');
    
    // Hide native splash screen immediately
    SplashScreenNative.hideAsync().catch(() => {});

    // AGGRESSIVE FIX: Just show for 2 seconds then finish
    timeoutRef.current = setTimeout(() => {
      console.log('[SplashScreen] Timeout reached - calling onFinish');
      if (onFinish) {
        onFinish();
      }
    }, 2000); // 2 seconds only

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      {/* Simple text-based logo to avoid image loading issues */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>LV</Text>
        <Text style={styles.logoSubtext}>Herald</Text>
      </View>
      <Text style={styles.loadingText}>Loading...</Text>
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
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFB800',
    letterSpacing: 4,
  },
  logoSubtext: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
