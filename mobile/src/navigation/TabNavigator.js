import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/Explore/index';
import PressHubNavigator from './PressHubNavigator';
import ProfileScreen from '../screens/AccountSettings/ProfileScreen';
import { colors } from '../styles';

const Tab = createBottomTabNavigator();

const exploreIcon = require('../../assets/search-outline 1.png');

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#f8b200',
        tabBarInactiveTintColor: '#b0bec5',
        tabBarStyle: { 
          borderTopColor: colors.border,
          backgroundColor: '#3d5a80',
          height: 100,
        },
        tabBarIcon: ({ focused, size }) => {
          switch(route.name) {
            case 'Home':
              return (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={size}
                  color={focused ? '#f8b200' : '#b0bec5'}
                />
              );
            case 'Explore':
              return (
                <Image
                  source={exploreIcon}
                  style={{
                    width: size,
                    height: size,
                    tintColor: focused ? '#f8b200' : '#b0bec5',
                  }}
                />
              );
            case 'Press Hub':
              return (
                <Ionicons
                  name={focused ? 'chatbubble' : 'chatbubble-outline'}
                  size={size}
                  color={focused ? '#f8b200' : '#b0bec5'}
                />
              );
            case 'You':
              return (
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={size}
                  color={focused ? '#f8b200' : '#b0bec5'}
                />
              );
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Press Hub" component={PressHubNavigator} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
