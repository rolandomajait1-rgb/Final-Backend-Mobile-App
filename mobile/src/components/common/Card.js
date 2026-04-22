import React from 'react';
import { View, Platform } from 'react-native';

export default function Card({ children, className }) {
  const shadowStyle = Platform.select({
    ios: 'shadow-sm',
    android: 'elevation-3',
  });

  return (
    <View className={`bg-white rounded-lg p-4 my-2 ${shadowStyle} ${className || ''}`}>
      {children}
    </View>
  );
}
