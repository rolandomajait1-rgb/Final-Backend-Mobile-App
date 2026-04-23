import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles';

export default function BottomNavigation({ navigation, activeTab = 'Home' }) {
  const insets = useSafeAreaInsets();
  
  const tabs = [
    { name: 'Home', icon: 'home', label: 'Home' },
    { name: 'Explore', icon: 'search-outline', label: 'Explore' },
    { name: 'PressHub', icon: 'chatbubble-ellipses', label: 'Press Hub' },
    { name: 'Profile', icon: 'person-circle-outline', label: 'You' },
  ];

  return (
    <View 
      className="flex-row justify-around items-center" 
      style={{ 
        backgroundColor: colors.primary,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 10
      }}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          onPress={() => navigation.navigate(tab.name)}
          className="flex-1 items-center mb-2"
        >
          <Ionicons
            name={tab.icon}
            size={28}
            color={activeTab === tab.name ? '#FFB800' : '#A0B8C8'}
          />
          <Text
            className={`text-xs font-semibold mt-1 ${
              activeTab === tab.name ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
