import React from 'react';
import CategoryScreen from './CategoryScreenTemplate';

export default function SpecialsScreen({ navigation }) {
  return (
    <CategoryScreen
      navigation={navigation}
      categoryName="Specials"
      categorySlug="specials"
    />
  );
}
