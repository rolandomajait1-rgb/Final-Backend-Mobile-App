import React from 'react';
import CategoryScreen from './CategoryScreenTemplate';

export default function FeaturesScreen({ navigation }) {
  return (
    <CategoryScreen
      navigation={navigation}
      categoryName="Features"
      categorySlug="features"
    />
  );
}
