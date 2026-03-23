import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/articles/SearchScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';
import { colors } from '../styles';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Search: ['search', 'search-outline'],
  Profile: ['person', 'person-outline'],
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarIcon: ({ focused, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
          return (
            <Ionicons
              name={focused ? active : inactive}
              size={size}
              color={focused ? colors.primary : colors.text.muted}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
