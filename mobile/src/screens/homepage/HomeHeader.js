import { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles';
import SidebarMenu from '../../components/homeheaderpart/SidebarMenu';
import { isAdminOrModerator } from '../../utils/authUtils';
import client from '../../api/client';

const HomeHeader = ({
  onMenuPress = () => {},
  onGridPress = () => {},
  onSearch = () => {},
  categories = [],
  onCategorySelect = () => {},
  navigation = null,
  isSearchScreen = false, // New prop to indicate if we're in SearchScreen
  searchQuery: externalSearchQuery = '', // External search query from parent
  enableSearch = true, // New prop to enable/disable search icon
}) => {
  const [isSearchActive, setIsSearchActive] = useState(isSearchScreen);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAdminIcon, setShowAdminIcon] = useState(false);
  const [internalCategories, setInternalCategories] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkAdminStatus();
    if (!categories || categories.length === 0) {
      fetchCategories();
    }
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const res = await client.get('/api/categories');
      setInternalCategories(res.data || []);
    } catch (error) {
      console.error('Error fetching categories in header:', error);
    }
  };

  // Update search active state when isSearchScreen prop changes
  useEffect(() => {
    setIsSearchActive(isSearchScreen);
  }, [isSearchScreen]);

  // Update search query when external query changes
  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  const checkAdminStatus = async () => {
    const isAdminUser = await isAdminOrModerator();
    setShowAdminIcon(isAdminUser);
  };

  const handleSearchBlur = () => {
    if (!searchQuery.trim()) {
      setIsSearchActive(false);
    }
  };

  const handleSearchIconPress = () => {
    // Just activate inline search, don't navigate
    setIsSearchActive(true);
  };

  const handleSearch = (text) => {
    console.log('HomeHeader handleSearch called with:', text);
    setSearchQuery(text);
    onSearch(text);
  };

  const handleSearchClose = () => {
    setSearchQuery('');
    onSearch(''); // Clear search in parent component
    setIsSearchActive(false); // Always close the search bar
  };

  const handleMenuPress = () => {
    setIsSidebarOpen(true);
    onMenuPress();
  };

  const handleCategorySelect = (categoryId) => {
    onCategorySelect(categoryId);
  };

  const handleGridPress = () => {
    onGridPress();
  };

  const displayCategories = categories?.length > 0 ? categories : internalCategories;

  return (
    <>
      <SidebarMenu
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={displayCategories}
        onCategorySelect={handleCategorySelect}
        navigation={navigation}
      />
      <View className="bg-white" style={{ paddingTop: Math.max(insets.top, 0) }}>
        {isSearchActive ? (
          // Search Active - Full width search bar
          <View className="flex-row items-center px-4" style={{ height: 60 }}>
            {/* Menu Icon */}
            <View className="w-10">
              <TouchableOpacity onPress={handleMenuPress} className="py-2">
                <Ionicons name="menu" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-1 flex-row items-center px-3 bg-gray-100 rounded-full gap-2 h-11">
              <Ionicons name="search" size={20} color="#252424ff" />
              <TextInput
                className="flex-1 text-gray-800 text-base py-0"
                placeholder="Search..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                onBlur={handleSearchBlur}
                autoFocus
              />
              {/* Always show X button when search is active */}
              <TouchableOpacity onPress={handleSearchClose}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Right Side - Only show Grid icon for admin */}
            <View className="w-12 flex-row items-center justify-end">
              {showAdminIcon && (
                <TouchableOpacity onPress={handleGridPress} className="p-2">
                  <MaterialCommunityIcons name="view-grid" size={24} color={colors.icons} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          // Normal Header
          <View className="flex-row items-center px-4" style={{ height: 60 }}>
            {/* Left Side Container (Menu) */}
            <View className="w-20 items-start">
              <TouchableOpacity onPress={handleMenuPress} className="p-1">
                <Ionicons name="menu" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Logo Container (Center) */}
            <View className="flex-1 items-center justify-center">
              <Image
                source={require('../../../assets/logo.png')}
                style={{ width: 44, height: 44 }}
                resizeMode="contain"
              />
            </View>

            {/* Right Side Container (Action Icons) - Balanced width with Left */}
            <View className="w-20 flex-row items-center justify-end">
              {enableSearch && (
                <TouchableOpacity onPress={handleSearchIconPress} className="p-2">
                  <Ionicons name="search" size={24} color={colors.primary} />
                </TouchableOpacity>
              )}
              {showAdminIcon && (
                <TouchableOpacity onPress={handleGridPress} className="p-2">
                  <MaterialCommunityIcons name="view-grid" size={24} color={colors.icons} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        {/* Gray divider at the bottom */}
        <View className="h-0.5 bg-amber-400" />
      </View>
    </>
  );
};

export default HomeHeader;
