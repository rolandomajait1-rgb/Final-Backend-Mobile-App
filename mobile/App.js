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
import * as Font from 'expo-font';

// Siguraduhin nating naka-enable ang screens para sa performance
enableScreens();

// Pigilan muna ang auto-hide para hindi mag-flicker, pero i-hide agad sa useEffect
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

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
        
        // Load fonts
        await Font.loadAsync({
          'Montserrat-Regular': require('./assets/fonts/Montserrat-Regular.ttf'),
          'Montserrat-Medium': require('./assets/fonts/Montserrat-Medium.ttf'),
          'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
          'Montserrat-Bold': require('./assets/fonts/Montserrat-Bold.ttf'),
        });
        
        setFontsLoaded(true);
        
        // FIX: Reduced wait time - 500ms is enough for basic loading
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('[App] Init warning:', e);
        // Don't block on errors - proceed anyway
        setFontsLoaded(true); // Proceed even if fonts fail
      } finally {
        // FIX: Always call handleAppReady, even if there was an error
        handleAppReady();
      }
    };

    // FIX: Add a safety timeout to ensure we always proceed
    const safetyTimeout = setTimeout(() => {
      console.warn('[App] Safety timeout reached - proceeding anyway');
      setFontsLoaded(true);
      handleAppReady();
    }, 3000);

    prepare();

    return () => clearTimeout(safetyTimeout);
  }, [handleAppReady]);

  // FIX: Show loading UI if not ready or fonts not loaded, but don't block forever
  if (!isReady || !fontsLoaded) {
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
              <StatusBar style="dark" translucent={true} />
              <OfflineBanner />
              <AppNavigator />
              <ToastContainer />
            </>
          </ToastProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
