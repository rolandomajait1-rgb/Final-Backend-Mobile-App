import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles';
import HomeHeader from '../homepage/HomeHeader';
import { ErrorMessage } from '../../components/common';
import BottomNavigation from '../../components/common/BottomNavigation';
import JoinHeraldCard from './JoinHeraldCard';
import RequestCoverageCard from './RequestCoverageCard';
import SendFeedbackCard from './SendFeedbackCard';
import OfficeInformationCard from './OfficeInformationCard';






const PressHubScreen = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <HomeHeader
        categories={[]}
        selectedCategory={null}
        onCategorySelect={() => {}}
        error={null}
        ErrorMessage={ErrorMessage}
        showCategories={false}
        navigation={navigation}
      />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120, gap: 16 }}>
       <RequestCoverageCard/>
       <SendFeedbackCard/>
       <JoinHeraldCard/>
       <OfficeInformationCard/>
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation navigation={navigation} activeTab="PressHub" />
      </View>
    </SafeAreaView>
  );
};

export default PressHubScreen;
