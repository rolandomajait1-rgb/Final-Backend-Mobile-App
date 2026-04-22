import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import SendFeedbackCard from './SendFeedbackCard';
import RequestCoverageCard from './RequestCoverageCard';
import JoinHeraldCard from './JoinHeraldCard';
import OfficeInformationCard from './OfficeInformationCard';

export default function PressHubScreen({ navigation }) {
  return (
    <View className="flex-1 bg-white">
      <StatusBar hidden={true} />

      {/* Header */}
      <HomeHeader
        categories={[]}
        onCategorySelect={() => {}}
        onMenuPress={() => {}}
        onSearchPress={() => {}}
        onGridPress={() => navigation.navigate('Main')}
        onSearch={() => {}}
        navigation={navigation}
      />

      {/* Title Bar */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View className="flex-1 items-center">
          <Text className="text-xl font-bold text-gray-900">Press Hub</Text>
        </View>

        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 py-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Welcome Section */}
        <View className="mb-6 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Press Hub
          </Text>
          <Text className="text-base text-gray-700 leading-6">
            Your central resource for La Verdad Student Publications. Send feedback, request coverage, join the team, and more.
          </Text>
        </View>

        {/* Cards */}
        <SendFeedbackCard />
        <RequestCoverageCard />
        <JoinHeraldCard />
        <OfficeInformationCard />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeTab="PressHub" />
    </View>
  );
}
