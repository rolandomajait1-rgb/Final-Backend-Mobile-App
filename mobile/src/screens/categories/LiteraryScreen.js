import React from 'react';
import CategoryScreen from './CategoryScreenTemplate';

export default function LiteraryScreen({ navigation }) {
  return (
    <CategoryScreen
      navigation={navigation}
      categoryName="Literary"
      categorySlug="literary"
    />
  );
}
