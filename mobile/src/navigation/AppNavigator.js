import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import { ActivityIndicator, View, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FIX: Add timeout utility for AsyncStorage operations
const asyncStorageWithTimeout = async (key, timeoutMs = 3000) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`AsyncStorage timeout for key: ${key}`));
    }, timeoutMs);

    AsyncStorage.getItem(key)
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};
import TabNavigator from './TabNavigator';
import ArticleDetailScreen from '../screens/articles/ArticleDetailScreen';
import SearchScreen from '../screens/articles/SearchScreen';
import AdminScreen from '../screens/admin/AdminScreen.js';
import CreateArticleScreen from '../screens/admin/CreateArticleScreen';
import EditArticleScreen from '../screens/admin/EditArticleScreen';
import PublishArticleScreen from '../screens/admin/PublishArticleScreen';
import PublishEditScreen from '../screens/admin/PublishEditScreen';
import AuditTrailScreen from '../screens/admin/AuditTrailScreen';
import DraftArticlesScreen from '../screens/admin/DraftArticlesScreen';
import StatisticsScreen from '../screens/admin/StatisticsScreen';
import ManageModeratorsScreen from '../screens/admin/ManageModeratorsScreen';
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
import NewsScreenRN from '../screens/categories/NewsScreenRN';
import LiteraryScreen from '../screens/categories/LiteraryScreen';
import OpinionScreen from '../screens/categories/OpinionScreen';
import SportsScreen from '../screens/categories/SportsScreen';
import FeaturesScreen from '../screens/categories/FeaturesScreen';
import SpecialsScreen from '../screens/categories/SpecialsScreen';
import ArtScreen from '../screens/categories/ArtScreen';
import TagArticlesScreen from '../screens/Tags/TagArticlesScreen';
import AuthorProfileScreen from '../screens/AuthorProfile/AuthorProfileScreen';

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

// 1. Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="VerifyRegistrationOTP" component={VerifyRegistrationOTPScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

// 2. Admin & PressHub Stack
const ManagementStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Admin" component={AdminScreen} />
    <Stack.Screen name="Statistics" component={StatisticsScreen} />
    <Stack.Screen name="DraftArticles" component={DraftArticlesScreen} />
    <Stack.Screen name="ManageModerators" component={ManageModeratorsScreen} />
    <Stack.Screen name="AuditTrail" component={AuditTrailScreen} />
    <Stack.Screen name="CreateArticle" component={CreateArticleScreen} />
    <Stack.Screen name="EditArticle" component={EditArticleScreen} />
    <Stack.Screen name="PublishArticle" component={PublishArticleScreen} />
    <Stack.Screen name="PublishEdit" component={PublishEditScreen} />
    <Stack.Screen name="SendFeedback" component={SendFeedbackScreen} />
    <Stack.Screen name="RequestCoverage" component={RequestCoverageScreen} />
    <Stack.Screen name="JoinHerald" component={JoinHeraldScreen} />
  </Stack.Navigator>
);

// 3. Article Detail Stack
const ArticleDetailStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    <Stack.Screen name="TagArticles" component={TagArticlesScreen} />
    <Stack.Screen name="AuthorProfile" component={AuthorProfileScreen} />
    <Stack.Screen name="NewsScreen" component={NewsScreenRN} />
    <Stack.Screen name="LiteraryScreen" component={LiteraryScreen} />
    <Stack.Screen name="OpinionScreen" component={OpinionScreen} />
    <Stack.Screen name="SportsScreen" component={SportsScreen} />
    <Stack.Screen name="FeaturesScreen" component={FeaturesScreen} />
    <Stack.Screen name="SpecialsScreen" component={SpecialsScreen} />
    <Stack.Screen name="ArtScreen" component={ArtScreen} />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const checkAuth = async () => {
      // FIX: Use timeout wrapper and handle errors gracefully
      // This prevents the app from hanging indefinitely on cold start
      try {
        // Check token with timeout - default to Auth if timeout
        const token = await asyncStorageWithTimeout('auth_token', 2000);
        if (!token) {
          setInitialRoute('Auth');
          return;
        }

        // Check rememberMe with timeout
        const rememberMe = await asyncStorageWithTimeout('remember_me', 1000);
        if (rememberMe === 'false') {
          // Use timeout for multiRemove as well
          const removePromise = AsyncStorage.multiRemove([
            'auth_token', 'user_email', 'user_name',
            'user_role', 'user_data', 'remember_me',
          ]);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('multiRemove timeout')), 2000)
          );
          await Promise.race([removePromise, timeoutPromise]).catch(() => {});
          setInitialRoute('Auth');
        } else {
          setInitialRoute('MainApp');
        }
      } catch (err) {
        console.warn('[AppNavigator] Auth check failed (timeout or error):', err.message);
        // FIX: Default to Auth on any error - user can always log in
        setInitialRoute('Auth');
      }
    };

    // FIX: Add a fallback timeout to ensure we always set initialRoute
    const fallbackTimeout = setTimeout(() => {
      console.warn('[AppNavigator] Auth check fallback timeout - defaulting to Auth');
      setInitialRoute((prev) => {
        if (prev === null) {
          return 'Auth';
        }
        return prev;
      });
    }, 5000);

    checkAuth().finally(() => clearTimeout(fallbackTimeout));
  }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('LOGOUT', () => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Auth', state: { routes: [{ name: 'Login' }] } }],
        });
      }
    });
    return () => subscription.remove();
  }, [navigationRef]);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2C5F7F' }}>
        <ActivityIndicator size="large" color="#f8b200" />
      </View>
    );
  }

  return (
    <ArticleProvider>
      <NavigationContainer ref={navigationRef} linking={linking} fallback={<WelcomeScreen />}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
          <Stack.Screen name="Auth" component={AuthStack} />
          <Stack.Screen name="MainApp" component={TabNavigator} />
          <Stack.Screen name="Management" component={ManagementStack} />
          <Stack.Screen name="ArticleStack" component={ArticleDetailStack} />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{
              animationEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ArticleProvider>
  );
}
