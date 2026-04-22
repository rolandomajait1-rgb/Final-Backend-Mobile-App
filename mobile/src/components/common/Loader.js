import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function Loader({ size = 'large', color = '#215878ff', className }) {
  return (
    <View className={`flex-1 items-center justify-center ${className || ''}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
