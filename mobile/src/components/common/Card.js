import React from 'react';
import { View, Platform, useWindowDimensions } from 'react-native';

export default function Card({ children, className }) {
  const { width } = useWindowDimensions();
  const shadowStyle = Platform.select({
    ios: 'shadow-sm',
    android: 'elevation-3',
  });

  return (
    <View className={`bg-white rounded-lg ${width < 375 ? 'p-3 my-1' : 'p-4 my-2'} ${shadowStyle} ${className || ''}`}>
      {children}
    </View>
  );
}
