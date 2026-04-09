import { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../styles';
import SidebarMenu from '../../components/homeheaderpart/SidebarMenu';
import { isAdminOrModerator } from '../../utils/authUtils';

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

  useEffect(() => {
    checkAdminStatus();
  }, []);

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

  return (
    <>
      <SidebarMenu
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        onCategorySelect={handleCategorySelect}
        navigation={navigation}
      />
      <View className="bg-white border-b border-gray-200 pt-">
      {isSearchActive ? (
        // Search Active - Full width search bar
        <View className="flex-row items-center px-4 py-2 ">
          {/* Menu Icon */}
          <TouchableOpacity onPress={handleMenuPress} className="p-2">
            <Ionicons name="menu" size={28} color={colors.primary} />
          </TouchableOpacity>

          {/* Search Input */}
          <View className="flex-1 flex-row items-center px-3 bg-gray-100 rounded-full gap-2">
            <Ionicons name="search" size={20} color="#252424ff" />
            <TextInput
              className="flex-1 text-gray-800 text-base py-3"
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={handleSearch}
              onBlur={handleSearchBlur}
              autoFocus
            />
            <TouchableOpacity onPress={handleSearchClose}>
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Grid Icon - Only show for admin/moderator */}
          {showAdminIcon && (
            <TouchableOpacity onPress={handleGridPress} className="p-2">
              <MaterialCommunityIcons name="view-grid" size={24} color={colors.icons} />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Normal Header
        <View className="flex-row items-center justify-between px-3 py-2">
          {/* Menu Icon */}
          <TouchableOpacity onPress={handleMenuPress} className="p-2">
            <Ionicons name="menu" size={28} color={colors.primary} />
          </TouchableOpacity>

          {/* Logo - Center */}
          <View className="flex-1 items-center justify-center ml-10">
            <Image
              source={require('../../../assets/logo.png')}
              className="w-12 h-12"
              resizeMode="contain"
            />
          </View>

          {/* Search and Grid Icons */}
          <View className="flex-row items-center gap-0">
            {enableSearch && (
              <TouchableOpacity onPress={handleSearchIconPress} className="p-2">
                <Ionicons name="search" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            {/* Grid Icon - Only show for admin/moderator */}
            {showAdminIcon && (
              <TouchableOpacity onPress={handleGridPress} className="p-2">
                <MaterialCommunityIcons name="view-grid" size={24} color={colors.icons} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
    </>
  );
};

export default HomeHeader;
