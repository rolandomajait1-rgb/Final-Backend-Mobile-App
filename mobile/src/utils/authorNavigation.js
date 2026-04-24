import { Alert } from 'react-native';

export const handleAuthorPress = (article, navigation) => {
  if (!article) return;
  const authorId = article.author?.id || article.author_id;
  const authorName = article.author_name || article.author?.name || article.author?.user?.name || "Unknown Author";
  
  if (authorId) {
    navigation.navigate("ArticleStack", {
      screen: "AuthorProfile",
      params: {
        authorId,
        authorName,
      }
    });
  } else {
    Alert.alert("Info", "Author information is not available.");
  }
};
