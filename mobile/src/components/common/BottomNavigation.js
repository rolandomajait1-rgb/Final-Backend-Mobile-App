import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../styles';

export default function BottomNavigation({ navigation, activeTab = 'Home', hideProfile = false }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isAdminOrModerator, setIsAdminOrModerator] = useState(false);
  
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          setIsAdminOrModerator(user.role === 'admin' || user.role === 'moderator');
        }
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    };
    checkUserRole();
  }, []);
  
  const allTabs = [
    { name: 'Home', icon: 'home', label: 'Home' },
    { name: 'Explore', icon: 'search-outline', label: 'Explore' },
    { name: 'PressHub', icon: 'chatbubble-ellipses', label: 'Press Hub' },
    { name: 'Profile', icon: 'person-circle-outline', label: 'You' },
  ];

  const tabs = hideProfile ? allTabs.filter(tab => tab.name !== 'Profile') : allTabs;

  const handleTabPress = (tabName) => {
    // If admin/moderator clicks any tab, navigate to MainApp first, then to the tab
    if (isAdminOrModerator) {
      // Use navigate with animation instead of reset
      navigation.navigate('MainApp', { screen: tabName });
    } else {
      // Regular users navigate directly
      navigation.navigate(tabName);
    }
  };

  return (
    <View 
      className="flex-row justify-around items-center" 
      style={{ 
        backgroundColor: colors.primary,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: width < 370 ? 8 : 10
      }}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          onPress={() => handleTabPress(tab.name)}
          className={`flex-1 items-center ${width < 375 ? 'mb-1' : 'mb-1'}`}
        >
          <Ionicons
            name={tab.icon}
            size={width < 375 ? 24 : 25}
            color={activeTab === tab.name ? '#FFB800' : '#A0B8C8'}
          />
          <Text
            className={`${width < 375 ? 'text-xs' : 'text-xs'} font-semibold ${width < 375 ? 'mt-0.5' : 'mt-1'} ${
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
