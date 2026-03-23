import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import * as Linking from 'expo-linking';
import { SearchProvider } from './src/context/SearchContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SearchProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <AppNavigator />
    </SearchProvider>
  );
}
