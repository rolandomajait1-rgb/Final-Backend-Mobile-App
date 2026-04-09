import React from 'react';
import CategoryScreen from './CategoryScreenTemplate';

export default function NewsScreenRN({ navigation }) {
  return (
    <CategoryScreen
      navigation={navigation}
      categoryName="News"
      categorySlug="news"
    />
  );
}
