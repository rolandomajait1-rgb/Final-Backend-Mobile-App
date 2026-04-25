// Category navigation helper
// Maps category names to their respective screen names

const CATEGORY_SCREEN_MAP = {
  'News': 'NewsScreen',
  'Literary': 'LiteraryScreen',
  'Opinion': 'OpinionScreen',
  'Sports': 'SportsScreen',
  'Features': 'FeaturesScreen',
  'Specials': 'SpecialsScreen',
  'Art': 'ArtScreen',
};

export const handleCategoryPress = (categoryName, navigation) => {
  if (!categoryName || !navigation) {
    console.warn('Category name or navigation is missing');
    return;
  }

  const screenName = CATEGORY_SCREEN_MAP[categoryName];
  
  if (screenName) {
    // Navigate to the specific category screen within ArticleStack
    navigation.navigate('ArticleStack', { 
      screen: screenName,
      params: { categoryName }
    });
  } else {
    console.warn(`No screen mapping found for category: ${categoryName}`);
  }
};
