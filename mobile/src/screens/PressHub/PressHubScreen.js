import React from 'react';
import {
  View,
  ScrollView,
} from 'react-native';
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
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
    </View>
  );
};

export default PressHubScreen;
