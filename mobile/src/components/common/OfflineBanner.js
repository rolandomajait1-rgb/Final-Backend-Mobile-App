import { View, Text, Animated, useEffect, useRef } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../../context/NetworkContext';

export default function OfflineBanner() {
  const { isOnline } = useNetwork();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    if (!isOnline) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  return (
    <Animated.View
      className="absolute top-0 left-0 right-0 z-50 bg-red-500 py-3 px-4 flex-row items-center"
      style={{
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Ionicons name="cloud-offline-outline" size={20} color="white" />
      <Text className="text-white font-semibold ml-2 flex-1">
        No Internet Connection
      </Text>
    </Animated.View>
  );
}
