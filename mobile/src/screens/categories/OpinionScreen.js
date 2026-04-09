import React from 'react';
import CategoryScreen from './CategoryScreenTemplate';

export default function OpinionScreen({ navigation }) {
  return (
    <CategoryScreen
      navigation={navigation}
      categoryName="Opinion"
      categorySlug="opinion"
    />
  );
}
