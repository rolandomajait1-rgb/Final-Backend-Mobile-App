import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import TabNavigator from './TabNavigator';
import ArticleDetailScreen from '../screens/articles/ArticleDetailScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyRegistrationOTPScreen from '../screens/auth/VerifyRegistrationOTPScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import { SendFeedbackScreen, RequestCoverageScreen, JoinHeraldScreen } from '../screens/PressHub';
import { ArticleProvider } from '../context/ArticleContext';

const Stack = createStackNavigator();

const linking = {
  prefixes: [Linking.createURL('/'), 'laverdadherald://', 'exp://'],
  config: {
    screens: {
      VerifyEmail: {
        path: 'verify-email',
        parse: {
          token: (token) => token,
        },
      },
      ResetPassword: {
        path: 'reset-password',
        parse: {
          token: (token) => token,
          email: (email) => decodeURIComponent(email),
        },
        stringify: {
          token: (token) => token,
          email: (email) => encodeURIComponent(email),
        },
      },
      Welcome: '',
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      VerifyOTP: 'verify-otp',
      Main: 'main',
      ArticleDetail: 'article/:id',
    },
  },
  async getInitialURL() {
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL();
    if (url != null) {
      console.log('🔗 Deep link detected on cold start:', url);
      return url;
    }
    // Default to Welcome screen
    return undefined;
  },
  subscribe(listener) {
    // Listen to incoming links from deep linking
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep link received while app is open:', url);
      listener(url);
    });
    return () => {
      linkingSubscription.remove();
    };
  },
};

export default function AppNavigator() {
  return (
    <ArticleProvider>
      <NavigationContainer linking={linking} fallback={<WelcomeScreen />}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyRegistrationOTP" component={VerifyRegistrationOTPScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
          <Stack.Screen name="SendFeedback" component={SendFeedbackScreen} />
          <Stack.Screen name="RequestCoverage" component={RequestCoverageScreen} />
          <Stack.Screen name="JoinHerald" component={JoinHeraldScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ArticleProvider>
  );
}
