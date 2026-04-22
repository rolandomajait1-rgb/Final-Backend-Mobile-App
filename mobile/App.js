import "react-native-gesture-handler";
import "./global.css";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { ToastProvider } from "./src/context/ToastContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { ToastContainer } from "./src/components/common";
import OfflineBanner from "./src/components/common/OfflineBanner";
import SplashScreen from "./src/screens/SplashScreen";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NetworkProvider>
      <ToastProvider>
        <>
          <OfflineBanner />
          <StatusBar
            style="dark"
            backgroundColor="transparent"
            translucent={true}
          />
          <AppNavigator />
          <ToastContainer />
        </>
      </ToastProvider>
    </NetworkProvider>
  );
}
