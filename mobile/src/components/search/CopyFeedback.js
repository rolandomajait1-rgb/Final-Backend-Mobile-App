import React from 'react';
import {
  View,
  Text,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';

export default function CopyFeedback({ visible, message, type = 'success' }) {
  const backgroundColor = type === 'success' ? colors.success : colors.error;
  const icon = type === 'success' ? 'checkmark-circle' : 'alert-circle';

  if (!visible) {
    return null;
  }

  return (
    <View
      className="absolute bottom-6 left-4 right-4 flex-row items-center px-4 py-3 rounded-lg"
      style={{ backgroundColor }}
      accessible={true}
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
    >
      <Ionicons name={icon} size={20} color="white" />
      <Text className="text-white font-semibold ml-3 flex-1">{message}</Text>
    </View>
  );
}
