import "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import * as SplashScreen from "expo-splash-screen";
import "./global.css";
import React, { useState, useEffect, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { ToastProvider } from "./src/context/ToastContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { ToastContainer } from "./src/components/common";
import OfflineBanner from "./src/components/common/OfflineBanner";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Siguraduhin nating naka-enable ang screens para sa performance
enableScreens();

// Pigilan muna ang auto-hide para hindi mag-flicker, pero i-hide agad sa useEffect
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState(null);

  // FIX: Use useCallback to prevent recreation on every render
  const handleAppReady = useCallback(() => {
    setIsReady(true);
    // Always hide splash screen, even if there was an error
    SplashScreen.hideAsync().catch(() => {});
    console.log('[App] Ready!');
  }, []);

  useEffect(() => {
    const prepare = async () => {
      try {
        console.log('[App] Initializing...');
        // FIX: Reduced wait time - 500ms is enough for basic loading
        // In production builds, this should be minimal
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('[App] Init warning:', e);
        // Don't block on errors - proceed anyway
      } finally {
        // FIX: Always call handleAppReady, even if there was an error
        handleAppReady();
      }
    };

    // FIX: Add a safety timeout to ensure we always proceed
    const safetyTimeout = setTimeout(() => {
      console.warn('[App] Safety timeout reached - proceeding anyway');
      handleAppReady();
    }, 3000);

    prepare();

    return () => clearTimeout(safetyTimeout);
  }, [handleAppReady]);

  // FIX: Show loading UI if not ready, but don't block forever
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#2C5F7F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFB800" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NetworkProvider>
          <ToastProvider>
            <>
              <OfflineBanner />
              <StatusBar style="dark" backgroundColor="transparent" translucent={true} />
              <AppNavigator />
              <ToastContainer />
            </>
          </ToastProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
