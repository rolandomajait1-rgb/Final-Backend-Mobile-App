import React, { useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Animated } from 'react-native';
import { colors } from '../../styles';

const CategoryFilter = ({ categories = [], selectedCategory, onCategorySelect }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [categories]);

  const CategoryButton = ({ category, isAll = false }) => {
    const isSelected = isAll
      ? selectedCategory === null
      : selectedCategory === category?.id;

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          onPress={() => onCategorySelect(isAll ? null : category.id)}
          className={`px-15 py-3 rounded-full min-w-24 ${
            isSelected ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <Text
            className={`font-bold text-base text-center ${
              isSelected ? 'text-white' : 'text-gray-800'
            }`}
          >
            {isAll ? 'All' : category.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View className="bg-white border-b border-gray-200">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerStyle={{ gap: 8 }}
      >
        <CategoryButton isAll />
        {categories.map((category) => (
          <CategoryButton key={category.id} category={category} />
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryFilter;
