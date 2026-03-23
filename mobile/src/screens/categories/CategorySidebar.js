import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';

const defaultCategories = [
  { id: 'news', name: 'News' },
  { id: 'sports', name: 'Sports' },
  { id: 'opinion', name: 'Opinion' },
  { id: 'literary', name: 'Literary' },
  { id: 'specials', name: 'Specials' },
  { id: 'features', name: 'Features' },
  { id: 'art', name: 'Art' },
];

export default function CategorySidebar({ selectedCategory, onCategorySelect, categories = [] }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const categoryList = categories.length > 0 ? categories : defaultCategories;

  return (
    <>
      <TouchableOpacity
        className="pr-1"
        onPress={() => setShowSidebar(true)}
      >
        <Ionicons name="reorder-three" size={40} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={showSidebar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSidebar(false)}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="flex-1 bg-white rounded-r-1xl ml-0 mr-auto" style={{ width: '60%' }}>
            <View className="flex-row justify-center items-center p-4 border-b border-gray-200 relative">
              <Text className="text-2xl font-bold">Categories</Text>
              <TouchableOpacity 
                onPress={() => setShowSidebar(false)}
                style={{ position: 'absolute', right: 16 }}
              >
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categoryList}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 pl-10 border-b border-gray-100 flex-row justify-left items-center"
                  style={{
                    backgroundColor: hoveredItem === item.id 
                      ? (selectedCategory === item.id ? '#0f2a47' : '#E8D700')
                      : 'transparent',
                  }}
                  onPress={() => {
                    onCategorySelect(item.id);
                    setShowSidebar(false);
                  }}
                  onPressIn={() => setHoveredItem(item.id)}
                  onPressOut={() => setHoveredItem(null)}
                >
                  <Text
                    className="text-lg"
                    style={{
                      color: hoveredItem === item.id && selectedCategory === item.id 
                        ? colors.text.inverse 
                        : (selectedCategory === item.id ? colors.primary : colors.text.primary),
                      fontWeight: selectedCategory === item.id ? 'bold' : 'normal',
                    }}
                  >
                    {item.name}
                  </Text>
                  {selectedCategory === item.id && (
                    <Ionicons 
                      name="checkmark" 
                      size={24} 
                      color="#ffcc00ff" 
                      style={{ marginLeft: 8 }} 
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
          <TouchableOpacity
            className="flex-1"
            onPress={() => setShowSidebar(false)}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
