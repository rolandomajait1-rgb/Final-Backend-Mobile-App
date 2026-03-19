import 'react-native-gesture-handler';
import './global.css';
import React, { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return <AppNavigator />;
}
