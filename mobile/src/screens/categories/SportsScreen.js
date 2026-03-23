import React from 'react';
import CategoryScreen from './CategoryScreenTemplate';

export default function SportsScreen({ navigation }) {
  return (
    <CategoryScreen
      navigation={navigation}
      categoryName="Sports"
      categorySlug="sports"
    />
  );
}
