import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import { getCategories } from '../../api/services/categoryService';

export default function AdminScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data ?? []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const menuItems = [
    {
      id: 1,
      title: 'Statistics',
      icon: 'chart-box',
      screen: 'Statistics',
    },
    {
      id: 2,
      title: 'Draft Articles',
      icon: 'file-document-outline',
      screen: 'DraftArticles',
    },
    {
      id: 3,
      title: 'Audit Trail',
      icon: 'clipboard-list-outline',
      screen: 'AuditTrail',
    },
    {
      id: 4,
      title: 'Manage Moderators',
      icon: 'account-multiple-check',
      screen: 'ManageModerators',
    },
  ];

  return (
    <View className="flex-1 bg-white mt-10">
      {/* Fixed Header */}
      <View className="flex-shrink-0">
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onMenuPress={() => {}}
          onSearchPress={() => {}}
          onGridPress={() => navigation.navigate('Main')}
          onSearch={() => {}}
          navigation={navigation}
        />
      </View>

      {/* Blue Header */}
      <View className="bg-blue-600 px-6 py-4">
        <Text className="text-2xl font-bold text-white text-center">Admin Dashboard</Text>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate(item.screen)}
              className="bg-white rounded-3xl px-6 py-8 items-center border border-gray-200 shadow-sm"
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={40}
                color="#FFB800"
                style={{ marginBottom: 12 }}
              />
              <Text className="text-gray-600 font-semibold text-center text-base">
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* BottomNavigation - Fixed */}
      <BottomNavigation navigation={navigation} activeTab={activeTab} />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateArticle')}
        className="absolute bottom-40 right-6 bg-yellow-500 rounded-full w-20 h-20 items-center justify-center shadow-lg"
      >
        <MaterialCommunityIcons name="plus" size={34} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
