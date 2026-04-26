import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, ImageBackground, Image,
  TouchableOpacity, StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive, getResponsiveDimensions } from '../../utils/responsiveUtils';

const bg = require('../../../assets/bg.jpg');
const logo = require('../../../assets/logo.png');
const textlogo = require('../../../assets/la verdad herald.png');

export default function WelcomeScreen({ navigation }) {
  const { width, isSmallPhone } = useResponsive();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Check for pending verification or password reset first
    const checkPendingActions = async () => {
      try {
        // Check for pending registration verification
        const pendingVerification = await AsyncStorage.getItem('pending_verification');
        if (pendingVerification) {
          const { email, timestamp } = JSON.parse(pendingVerification);
          const now = Date.now();
          const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes
          
          // Check if verification is still valid (within 10 minutes)
          if (now - timestamp < tenMinutesInMs) {
            // Still valid, navigate to OTP screen
            navigation.replace('VerifyRegistrationOTP', { email });
            return; // Exit early
          } else {
            // Expired, clear the pending verification
            await AsyncStorage.removeItem('pending_verification');
          }
        }

        // Check for pending password reset
        const pendingReset = await AsyncStorage.getItem('pending_password_reset');
        if (pendingReset) {
          const { email, timestamp } = JSON.parse(pendingReset);
          const now = Date.now();
          const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes
          
          // Check if reset is still valid (within 10 minutes)
          if (now - timestamp < tenMinutesInMs) {
            // Still valid, navigate to password reset OTP screen
            navigation.replace('VerifyOTP', { email });
            return; // Exit early
          } else {
            // Expired, clear the pending reset
            await AsyncStorage.removeItem('pending_password_reset');
          }
        }
      } catch (error) {
        console.error('Error checking pending actions:', error);
      }
    };
    
    checkPendingActions();
    
    // Smooth fade-in and slide-up animation when screen loads
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Dynamic scaling for both logos depending on the screen width
  const { width: logoWidth, height: logoHeight } = getResponsiveDimensions(260, 150, width);
  const { width: textLogoWidth, height: textLogoHeight } = getResponsiveDimensions(340, 51, width);

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      <ImageBackground source={bg} className="flex-1" resizeMode="cover" style={{ opacity: 0.9 }}>
        {/* Dark overlay */}
        <View className="absolute inset-0" style={{ backgroundColor: '#2C5F7F' }} />

        <SafeAreaView className={`flex-1 items-center justify-between px-4 ${isSmallPhone ? 'py-8' : 'py-16'}`}>

          {/* Logo + title block */}
          <Animated.View 
            className="flex-1 items-center justify-center"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Static logo without animation */}
            <Image
              source={logo}
              style={{ width: logoWidth, height: logoHeight, marginBottom: isSmallPhone ? 10 : 14 }}
              resizeMode="contain"
            />
            <Image
              source={textlogo}
              style={{ width: textLogoWidth, height: textLogoHeight }}
              resizeMode="contain"
            />
            <Text className={`text-gray-300 text-center px-2 mt-4 ${isSmallPhone ? 'text-sm' : 'text-base'}`}>
              The Official Higher Education Student Publication of{'\n'}
              La Verdad Christian College, Inc.
            </Text>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View 
            className="w-full items-center gap-4 mb-8"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, -1) }],
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              className={`${isSmallPhone ? 'w-4/5' : 'w-2/3'} rounded-full items-center`}
              style={{ backgroundColor: '#0686f6ff', paddingVertical: isSmallPhone ? 16 : 20 }}
              activeOpacity={0.85}
            >
              <Text className={`text-white font-bold ${isSmallPhone ? 'text-base' : 'text-lg'}`}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              className={`${isSmallPhone ? 'w-4/5' : 'w-2/3'} rounded-full items-center`}
              style={{ backgroundColor: '#f8b200', paddingVertical: isSmallPhone ? 16 : 20 }}
              activeOpacity={0.85}
            >
              <Text className={`text-white font-bold ${isSmallPhone ? 'text-base' : 'text-lg'}`}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>

        </SafeAreaView>
      </ImageBackground>
        <View className="h-28 bg-sky-800" />
    </View>
  );
}
