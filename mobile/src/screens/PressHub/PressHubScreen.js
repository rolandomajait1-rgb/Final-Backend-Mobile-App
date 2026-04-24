import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import SendFeedbackCard from './SendFeedbackCard';
import RequestCoverageCard from './RequestCoverageCard';
import JoinHeraldCard from './JoinHeraldCard';
import OfficeInformationCard from './OfficeInformationCard';
import { colors } from '../../styles';

export default function PressHubScreen({ navigation }) {
  return (
    <View className="flex-1 bg-white">
      <StatusBar hidden={false} />

      {/* Header */}
      <HomeHeader
        categories={[]}
        onCategorySelect={() => {}}
        onMenuPress={() => {}}
        onSearchPress={() => {}}
        onGridPress={() => navigation.navigate('Management', { screen: 'Admin' })}
        onSearch={() => {}}
        navigation={navigation}
        enableSearch={false}
      />

      {/* Title Bar */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold" style={{ color: colors.text.primary }}>Press Hub</Text>
        </View>

        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 py-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Cards */}
        <View className="gap-4">
          <SendFeedbackCard />
          <RequestCoverageCard />
          <JoinHeraldCard />
          <OfficeInformationCard />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="PressHub" />
    </View>
  );
}
