import React, { useEffect } from "react";
import { Animated, View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Toast({
  type = "success", // 'success', 'error', 'warning', 'info'
  message = "",
  duration = 3000,
  onDismiss = () => {},
}) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  // Bug #11 Fix: Store onDismiss in a ref to avoid stale closure in animation callback
  const onDismissRef = React.useRef(onDismiss);
  React.useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onDismissRef.current());
      }, duration);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colors = {
    success: {
      bg: "#DEF1D7",
      border: "#1F8722",
      text: "#1F8722",
    },
    error: {
      bg: "#F8D7DA",
      border: "#C0392B",
      text: "#C0392B",
    },
    warning: {
      bg: "#FFF3CD",
      border: "#856404",
      text: "#856404",
    },
    info: {
      bg: "#D1ECF1",
      border: "#0C5460",
      text: "#0C5460",
    },
  };

  const style = colors[type] || colors.success;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        alignItems: "flex-end", // Align to right side
        width: "100%",
      }}
    >
      <View
        style={{
          backgroundColor: style.bg,
          borderWidth: 1.5,
          borderColor: style.border,
          borderRadius: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
          marginRight: 16,
          marginTop: 45, // Increased top margin to avoid status bar
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontSize: 13, // Smaller font
            color: style.text,
            fontWeight: "500",
            letterSpacing: 0.3,
            marginRight: 8,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
        <TouchableOpacity 
          onPress={onDismiss} 
          activeOpacity={0.6}
          style={{ padding: 4 }}
        >
          <MaterialCommunityIcons name="close" size={16} color={style.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
