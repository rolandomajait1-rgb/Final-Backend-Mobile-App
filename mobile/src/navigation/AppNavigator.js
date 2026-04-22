import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import { ActivityIndicator, View, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function AppNavigator() {
  // Issue #1 Fix: Auto-login — check for existing auth session on app launch.
  // If a valid token exists, skip Welcome and go straight to Main.
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
          setInitialRoute('Welcome');
          return;
        }
        // If user didn't check "Remember Me", clear session on app restart
        const rememberMe = await AsyncStorage.getItem('remember_me');
        if (rememberMe === 'false') {
          await AsyncStorage.multiRemove([
            'auth_token', 'user_email', 'user_name',
            'user_role', 'user_data', 'remember_me',
          ]);
          setInitialRoute('Welcome');
        } else {
          setInitialRoute('Main');
        }
      } catch {
        setInitialRoute('Welcome');
      }
    };
    checkAuth();
  }, []);

  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('LOGOUT', () => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    });
    return () => subscription.remove();
  }, [navigationRef]);

  // Show a branded loading spinner while checking auth state
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
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyRegistrationOTP" component={VerifyRegistrationOTPScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{
              animationEnabled: false,
            }}
          />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="Statistics" component={StatisticsScreen} />
          <Stack.Screen name="DraftArticles" component={DraftArticlesScreen} />
          <Stack.Screen name="AuditTrail" component={AuditTrailScreen} />
          <Stack.Screen name="ManageModerators" component={ManageModeratorsScreen} />
          <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
          <Stack.Screen name="CreateArticle" component={CreateArticleScreen} />
          <Stack.Screen name="EditArticle" component={EditArticleScreen} />
          <Stack.Screen name="PublishArticle" component={PublishArticleScreen} />
          <Stack.Screen name="PublishEdit" component={PublishEditScreen} />
          <Stack.Screen name="SendFeedback" component={SendFeedbackScreen} />
          <Stack.Screen name="RequestCoverage" component={RequestCoverageScreen} />
          <Stack.Screen name="JoinHerald" component={JoinHeraldScreen} />
          <Stack.Screen name="NewsScreen" component={NewsScreenRN} />
          <Stack.Screen name="LiteraryScreen" component={LiteraryScreen} />
          <Stack.Screen name="OpinionScreen" component={OpinionScreen} />
          <Stack.Screen name="SportsScreen" component={SportsScreen} />
          <Stack.Screen name="FeaturesScreen" component={FeaturesScreen} />
          <Stack.Screen name="SpecialsScreen" component={SpecialsScreen} />
          <Stack.Screen name="ArtScreen" component={ArtScreen} />
          <Stack.Screen name="TagArticles" component={TagArticlesScreen} />
          <Stack.Screen name="AuthorProfile" component={AuthorProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ArticleProvider>
  );
}
