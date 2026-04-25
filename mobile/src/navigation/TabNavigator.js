import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import HomeScreen from '../screens/homepage/HomeScreen';
import ExploreScreen from '../screens/Explore';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfile from '../screens/Profile/EditProfile';
import PressHubNavigator from './PressHubNavigator';

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Explore: ['search', 'search-outline'],
  PressHub: ['chatbubble', 'chatbubble-outline'],
  Profile: ['person', 'person-outline'],
};

const TAB_LABELS = {
  Home: 'Home',
  Explore: 'Explore',
  PressHub: 'Press Hub',
  Profile: 'You',
};

// Move ProfileStackScreen OUTSIDE to prevent recreation
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfile} />
    </ProfileStack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide the default tab bar
        tabBarActiveTintColor: '#FFB800',
        tabBarInactiveTintColor: '#A0B8C8',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="PressHub" component={PressHubNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackScreen} />
    </Tab.Navigator>
  );
}
