import React from 'react';
import { Text as RNText } from 'react-native';

/**
 * Custom Text component that uses Montserrat font by default
 * This wraps React Native's Text component
 */
export default function Text({ style, ...props }) {
  return (
    <RNText
      {...props}
      style={[
        { fontFamily: 'Montserrat-Regular' },
        style,
      ]}
    />
  );
}
