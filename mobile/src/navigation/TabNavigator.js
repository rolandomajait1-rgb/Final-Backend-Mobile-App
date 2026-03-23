import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/Explore';
import ProfileScreen from '../screens/auth/ProfileScreen';
import { PressHubScreen } from '../screens/PressHub';

const Tab = createBottomTabNavigator();

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

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FFB800',
        tabBarInactiveTintColor: '#A0B8C8',
        tabBarStyle: {
          backgroundColor: '#2C5F7F',
          borderTopWidth: 0,
          height: 100,
          paddingBottom: 40,
          paddingTop: 15,
        },
        tabBarLabel: ({ focused }) => (
          <Text
            className={`text-xs font-semibold mt-1 ${
              focused ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            {TAB_LABELS[route.name]}
          </Text>
        ),
        tabBarIcon: ({ focused }) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <Ionicons
              name={focused ? active : inactive}
              size={28}
              color={focused ? '#FFB800' : '#A0B8C8'}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="PressHub" component={PressHubScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
