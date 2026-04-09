import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Animated,
} from 'react-native';
import { colors } from '../../styles';

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

  const allowedCategories = ['News', 'Literary', 'Opinion', 'Sports', 'Features', 'Specials', 'Art'];

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
      // Navigate to dedicated category screen
      navigation.navigate(screenName);
      onClose();
    } else {
      // Fallback to filtering in HomeScreen
      onCategorySelect(category.id);
      onClose();
    }
  };

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
            className="w-80 bg-white"
            style={{
              transform: [{ translateX: slideAnim }],
            }}
          >
            {/* Header */}
            <View className="px-6 items-center py-6 border-b border-gray-200">
              <Text className="text-3xl font-bold text-gray-800">Categories</Text>
            </View>

            {/* Categories List */}
            <ScrollView className="flex-1 px-10 py-4">
              {categories.length > 0 ? (
                categories
                  .filter((category) => allowedCategories.includes(category.name))
                  .map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => handleCategorySelect(category)}
                      className="py-4"
                    >
                      <Text className="text-xl text-gray-600 font-medium">
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
