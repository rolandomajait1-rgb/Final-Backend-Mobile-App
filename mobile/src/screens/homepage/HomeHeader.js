import { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
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
  onSearch = null,
  categories = [],
  onCategorySelect = () => {},
  navigation = null,
  isSearchScreen = false, // New prop to indicate if we're in SearchScreen
  searchQuery: externalSearchQuery = '', // External search query from parent
  enableSearch = true, // New prop to enable/disable search icon
}) => {
  const { width } = useWindowDimensions();
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
      // Silently fail - categories are not critical for header functionality
      // Set empty array to prevent infinite retry
      setInternalCategories([]);
      
      // Only log in development
      if (__DEV__) {
        console.error('Error fetching categories in header:', error.message || error);
      }
    }
  };

  // Update search active state when isSearchScreen prop changes
  useEffect(() => {
    setIsSearchActive(isSearchScreen);
  }, [isSearchScreen]);

  // Update search query when external query changes
  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery, isSearchScreen]);

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
    // Always navigate to dedicated Search screen if not already there
    if (!isSearchScreen && navigation) {
      navigation.navigate("Search");
    }
  };

  const handleSearch = (text) => {
    console.log('HomeHeader handleSearch called with:', text);
    setSearchQuery(text);
    // Only call onSearch if we're already in SearchScreen (inline search)
    if (onSearch && isSearchScreen) {
      onSearch(text);
    }
  };

  const handleSearchSubmit = () => {
    // When user submits search from HomeScreen, navigate to SearchScreen with query
    if (navigation && searchQuery.trim()) {
      navigation.navigate("Search", { initialQuery: searchQuery });
      setIsSearchActive(false);
    }
  };

  const handleSearchClose = () => {
    if (searchQuery.trim().length > 0) {
      setSearchQuery('');
      if (onSearch) onSearch('');
    } else {
      if (isSearchScreen && navigation) {
        navigation.goBack(); // If in search screen, closing it goes back
      } else {
        setIsSearchActive(false);
      }
    }
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
        {isSearchActive && enableSearch ? (
          // Search Active - Full width search bar
          <View className="flex-row items-center px-4" style={{ height: width < 375 ? 48 : 54 }}>
            {/* Menu Icon */}
            <View className="w-8">
              <TouchableOpacity onPress={handleMenuPress} className="py-2">
                <Ionicons name="menu" size={width < 375 ? 24 : 26} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="flex-1 flex-row items-center px-3 bg-gray-100 rounded-full gap-2" style={{ height: width < 375 ? 40 : 44 }}>
              <Ionicons name="search" size={width < 375 ? 18 : 20} color="#252424ff" />
              <TextInput
                className={`flex-1 text-gray-800 ${width < 375 ? 'text-sm' : 'text-base'} py-0`}
                placeholder="Search articles, #tags, authors..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
                onBlur={handleSearchBlur}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
                autoFocus
              />
              {/* Always show X button when search is active */}
              <TouchableOpacity onPress={handleSearchClose}>
                <Ionicons name="close-circle" size={width < 375 ? 18 : 20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Right Side - Only show Grid icon for admin */}
            {showAdminIcon ? (
              <View className="w-12 flex-row items-center justify-end">
                <TouchableOpacity onPress={handleGridPress} className="p-2">
                  <MaterialCommunityIcons name="view-grid" size={width < 375 ? 20 : 24} color={colors.icons} />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="w-2" />
            )}
          </View>
        ) : (
          // Normal Header
          <View className="flex-row items-center px-4" style={{ height: width < 375 ? 48 : 54 }}>
            {/* Left Side Container (Menu) */}
            <View className="w-20 items-start">
              <TouchableOpacity onPress={handleMenuPress} className="p-1">
                <Ionicons name="menu" size={width < 375 ? 24 : 28} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Logo Container (Center) */}
            <View className="flex-1 items-center justify-center" style={{ marginTop:120}}>
              <Image
                source={require('../../../assets/footertxt.png')}
                style={{ width: width < 300 ? 120 : 240, height: width < 300 ? 120 : 240 }}
                resizeMode="contain"
              />
            </View>

            {/* Right Side Container (Action Icons) - Balanced width with Left */}
            <View className="w-20 flex-row items-center justify-end gap-1">
              {enableSearch && (
                <TouchableOpacity onPress={handleSearchIconPress} className="p-1">
                  <Ionicons name="search" size={width < 375 ? 20 : 24} color={colors.primary} />
                </TouchableOpacity>
              )}
              {showAdminIcon && (
                <TouchableOpacity onPress={handleGridPress} className="p-1">
                  <MaterialCommunityIcons name="view-grid" size={width < 375 ? 20 : 24} color={colors.icons} />
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
