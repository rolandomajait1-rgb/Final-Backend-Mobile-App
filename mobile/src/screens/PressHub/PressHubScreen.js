import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
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
      <StatusBar style="dark" hidden={false} />

      {/* Header */}
      <HomeHeader
        categories={[]}
        onCategorySelect={() => {}}
        navigation={navigation}
        onGridPress={() => navigation.navigate("Management", { screen: "Admin" })}
      />

      {/* Content */}
      <ScrollView 
        className="flex-1 px-4 py-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
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
