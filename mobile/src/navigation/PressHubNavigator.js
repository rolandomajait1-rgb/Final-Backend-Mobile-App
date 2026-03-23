import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PressHubScreen from '../screens/PressHub/PressHubScreen';
import SendFeedbackScreen from '../screens/PressHub/SendFeedbackScreen';
import RequestCoverageScreen from '../screens/PressHub/RequestCoverageScreen';
import JoinHeraldScreen from '../screens/PressHub/JoinHeraldScreen';

const Stack = createStackNavigator();

export default function PressHubNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PressHubMain" component={PressHubScreen} />
      <Stack.Screen name="SendFeedback" component={SendFeedbackScreen} />
      <Stack.Screen name="RequestCoverage" component={RequestCoverageScreen} />
      <Stack.Screen name="JoinHerald" component={JoinHeraldScreen} />
    </Stack.Navigator>
  );
}
