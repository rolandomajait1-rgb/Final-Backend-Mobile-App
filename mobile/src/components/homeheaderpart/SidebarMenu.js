import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ALLOWED_CATEGORIES } from '../../constants/categories';

const categoryIcons = {
  'Art': 'color-palette',
  'Features': 'star',
  'Literary': 'book',
  'News': 'newspaper-outline',
  'Opinion': 'chatbubble',
  'Specials': 'diamond-outline',
  'Sports': 'basketball-outline',
};

const SidebarMenu = ({ visible, onClose, categories = [], onCategorySelect, navigation }) => {
  const slideAnim = useRef(new Animated.Value(-300)).current;

  // Map category names to screen names (only 7 allowed categories)
  const categoryScreenMap = {
    'News': 'NewsScreen',
    'Literary': 'LiteraryScreen',
    'Opinion': 'OpinionScreen',
    'Sports': 'SportsScreen',
    'Features': 'FeaturesScreen',
    'Specials': 'SpecialsScreen',
    'Art': 'ArtScreen',
  };

  // allowedCategories removed in favor of ALLOWED_CATEGORIES from constants

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleCategorySelect = (category) => {
    const screenName = categoryScreenMap[category.name];
    
    if (screenName && navigation) {
      // Navigate to dedicated category screen via ArticleStack
      navigation.navigate('ArticleStack', { screen: screenName });
      onClose();
    } else {
      // Fallback to filtering in HomeScreen
      onCategorySelect(category.id);
      onClose();
    }
  };

  // Ensure consistent color
  const themeColor = "#075985"; // A deep sky blue / teal matching the reference

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1">
        <View className="flex-1 flex-row">
          {/* Sidebar */}
          
          <Animated.View
            className="w-[280px] bg-white"
            style={{
              transform: [{ translateX: slideAnim }],
            }}
          >
            {/* Header */}
            <View className="px-8 pt-8 pb-4">
              <Text style={{ color: themeColor }} className="text-[26px] font-bold">Categories</Text>
            </View>

            {/* Categories List */}
            <ScrollView className="flex-1 px-8 pt-4">
              {categories.length > 0 ? (
                // Sort categories to ensure a consistent list layout (fallback to allowed display config if needed, otherwise rely on backend order)
                // Filter first by allowedCategories.
                categories
                  .filter((category) => ALLOWED_CATEGORIES.includes(category.name))
                  .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically as seen in screenshot
                  .map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => handleCategorySelect(category)}
                      className="py-4 flex-row items-center gap-5"
                    >
                      <Ionicons
                        name={categoryIcons[category.name] || 'list'}
                        size={26}
                        color={themeColor}
                      />
                      <Text style={{ color: '#334155' }} className="text-[20px] font-normal">
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))
              ) : (
                <View className="flex-1 justify-center items-center py-8">
                  <Text className="text-gray-500">No categories available</Text>
                </View>
              )}
            </ScrollView>

            {/* Profile / Settings Link */}
            <TouchableOpacity
              onPress={() => {
                navigation?.navigate('Profile');
                onClose();
              }}
              className="flex-row items-center gap-5 px-8 py-5 border-t border-gray-100"
            >
              <Ionicons name="person-circle" size={28} color={themeColor} />
              <Text style={{ color: '#334155' }} className="text-[20px] font-normal">
                Profile
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Overlay */}
          <TouchableOpacity
            className="flex-1 bg-black/50"
            onPress={onClose}
            activeOpacity={1}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default SidebarMenu;
