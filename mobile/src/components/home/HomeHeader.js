import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategorySidebar from '../../screens/categories/CategorySidebar';
import { colors } from '../../styles';

const logo = require('../../../assets/logo.png');
const searchIcon = require('../../../assets/search-outline 1.png');

export default function HomeHeader({ categories, selectedCategory, onCategorySelect, error, ErrorMessage, showCategories = true }) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    // Auto-close search when input is cleared
    if (text === '') {
      setIsSearchActive(false);
    }
  };

  return (
    <View>
      <View className="flex-row justify-between items-center py-4 px-4 border-b" style={{ backgroundColor: colors.background }}>
        <CategorySidebar
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
          categories={categories}
        />
        
        {/* Logo or Search Input */}
        {!isSearchActive ? (
          <Image
            source={logo}
            style={{ width: 44, height: 44, marginLeft: 34 }}
            resizeMode="contain"
          />
        ) : (
          <View className="flex-1 flex-row items-center px-4 rounded-full mx-2" style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: '#e0e0e0' }}>
            <Image
              source={searchIcon}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
              tintColor="black"
            />
            <TextInput
              className="flex-1 ml-3 py-2 text-base"
              placeholder="Search"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSearchQuery('');
                  setIsSearchActive(false);
                }}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                className="ml-2"
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Icons */}
        <View className="flex-row items-center gap-1">
          {!isSearchActive && (
            <TouchableOpacity 
              className="pl-2"
              onPress={() => setIsSearchActive(true)}
              accessibilityLabel="Open search"
              accessibilityRole="button"
            >
              <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                <Image
                  source={searchIcon}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                  tintColor="black"
                />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity className="pl-2">
            <View className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#FFC107' }}>
              <Ionicons name="grid" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 12 }}>
        {showCategories && (
          <FlatList
            horizontal
            data={[{ id: null, name: 'All' }, ...categories]}
            keyExtractor={(item) => String(item.id ?? 'all')}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`px-4 py-1 rounded-full border ${selectedCategory === item.id ? 'border-0' : 'border-gray-300'}`}
                style={{ backgroundColor: selectedCategory === item.id ? colors.primary : colors.surface }}
                onPress={() => onCategorySelect(item.id)}
              >
                <Text className={`text-sm ${selectedCategory === item.id ? 'text-white font-semibold' : 'text-gray-600'}`}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          />
        )}
      </View>
      <ErrorMessage message={error} style={{ marginHorizontal: 12 }} />
    </View>
  );
}
