import "react-native-gesture-handler";
import "./global.css";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { ToastProvider } from "./src/context/ToastContext";
import { ToastContainer } from "./src/components/common";
import SplashScreen from "./src/screens/SplashScreen";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ToastProvider>
      <>
        <StatusBar
          style="dark"
          backgroundColor="transparent"
          translucent={true}
        />
        <AppNavigator />
        <ToastContainer />
      </>
    </ToastProvider>
  );
}
