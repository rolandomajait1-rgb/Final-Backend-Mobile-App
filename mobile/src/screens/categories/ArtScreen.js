import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from '../../utils/axiosConfig';
import { colors } from '../../styles';
import ArticleCard from '../../components/ArticleCard';
import { getAuthorName } from '../../utils/auth';

const logo = require('../../../assets/logo.png');

const RelatedCard = ({ article, onPress }) => (
  <TouchableOpacity
    className="bg-white rounded-lg border mb-4 overflow-hidden"
    style={{ borderColor: colors.border }}
    onPress={onPress}
  >
    <Image
      source={{ uri: article.imageUrl }}
      style={{ width: '100%', height: 180 }}
      resizeMode="cover"
    />
    <View className="p-3">
      <View className="flex-row justify-between items-start mb-2">
        <View
          className="px-2 py-1 rounded"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-xs font-bold text-white">{article.category}</Text>
        </View>
        <Text className="text-xs" style={{ color: colors.textSecondary }}>
          {article.date}
        </Text>
      </View>
      <Text
        className="text-base font-bold mb-2"
        style={{ color: colors.text }}
        numberOfLines={2}
      >
        {article.title}
      </Text>
      {article.excerpt && (
        <Text
          className="text-sm mb-2"
          style={{ color: colors.textSecondary }}
          numberOfLines={2}
        >
          {article.excerpt}
        </Text>
      )}
      <Text className="text-xs text-right" style={{ color: colors.textSecondary }}>
        {article.author}
      </Text>
    </View>
  </TouchableOpacity>
);

const MostViewedCard = ({ article, onPress }) => (
  <TouchableOpacity
    className="bg-white p-3 rounded-lg border mb-3"
    style={{ borderColor: colors.border }}
    onPress={onPress}
  >
    <View className="flex-row justify-between items-center mb-2">
      <Text className="text-xs" style={{ color: colors.textSecondary }}>
        {article.date}
      </Text>
      <View
        className="px-2 py-1 rounded"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-xs font-bold text-white">{article.category}</Text>
      </View>
    </View>
    <Text
      className="text-sm font-bold mb-2"
      style={{ color: colors.text }}
      numberOfLines={2}
    >
      {article.title}
    </Text>
    <Text
      className="text-xs mb-2"
      style={{ color: colors.textSecondary }}
      numberOfLines={2}
    >
      {article.excerpt}
    </Text>
    <Text className="text-xs text-right" style={{ color: colors.textSecondary }}>
      {article.author}
    </Text>
  </TouchableOpacity>
);

export default function ArtScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    fetchArtArticles();
  }, []);

  const fetchArtArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/articles', {
        params: { category: 'art', page: 1 },
      });
      setArticles(response.data.data || []);

      // Fetch related articles
      const relatedResponse = await axios.get('/api/articles', {
        params: { category: 'art', limit: 12 },
      });
      const allRelated = relatedResponse.data.data || [];
      const displayedIds = response.data.data.map((article) => article.id);
      const filteredRelated = allRelated
        .filter((article) => !displayedIds.includes(article.id))
        .slice(0, 6);
      setRelatedArticles(filteredRelated);
    } catch (err) {
      console.error('Error fetching art articles:', err);
      setError('Failed to load art articles. Please try again later.');
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleArticlePress = (slug) => {
    navigation.navigate('ArticleDetail', { slug });
  };

  const renderLoadingState = () => (
    <View className="flex-1 justify-center items-center">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text className="mt-4" style={{ color: colors.textSecondary }}>
        Loading articles...
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-4">
      <Image
        source={logo}
        style={{ width: 60, height: 60 }}
        resizeMode="contain"
      />
      <Text className="text-2xl font-bold mt-6 text-center" style={{ color: colors.text }}>
        Nothing Published Yet
      </Text>
      <Text className="text-center mt-2" style={{ color: colors.textSecondary }}>
        Stay tuned, new stories will be up soon.
      </Text>
    </View>
  );

  const renderContent = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Featured Article */}
      {articles[0] && (
        <View className="mb-6">
          <ArticleCard
            articleId={articles[0].id}
            imageUrl={
              articles[0].featured_image_url ||
              'https://via.placeholder.com/300x200?text=No+Image'
            }
            title={articles[0].title}
            excerpt={articles[0].excerpt}
            category={
              articles[0].categories && articles[0].categories.length > 0
                ? articles[0].categories[0].name
                : 'Art'
            }
            author={getAuthorName(articles[0])}
            date={new Date(articles[0].published_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            slug={articles[0].slug}
            onPress={() => handleArticlePress(articles[0].slug)}
          />
        </View>
      )}

      {/* Sidebar Articles */}
      {articles.slice(1, 3).length > 0 && (
        <View className="mb-6">
          {articles.slice(1, 3).map((article) => (
            <ArticleCard
              key={article.id}
              articleId={article.id}
              imageUrl={
                article.featured_image_url ||
                'https://via.placeholder.com/300x200?text=No+Image'
              }
              title={article.title}
              excerpt={article.excerpt}
              category={
                article.categories && article.categories.length > 0
                  ? article.categories[0].name
                  : 'Art'
              }
              author={getAuthorName(article)}
              date={new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              slug={article.slug}
              onPress={() => handleArticlePress(article.slug)}
            />
          ))}
        </View>
      )}

      {/* Divider */}
      <View className="h-px bg-gray-300 my-6" />

      {/* Latest Articles */}
      {articles.slice(3, 6).length > 0 && (
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
            Latest
          </Text>
          {articles.slice(3, 6).map((article) => (
            <ArticleCard
              key={article.id}
              articleId={article.id}
              imageUrl={
                article.featured_image_url ||
                'https://via.placeholder.com/300x200?text=No+Image'
              }
              title={article.title}
              excerpt={article.excerpt}
              category={
                article.categories && article.categories.length > 0
                  ? article.categories[0].name
                  : 'Art'
              }
              author={getAuthorName(article)}
              date={new Date(article.published_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              slug={article.slug}
              onPress={() => handleArticlePress(article.slug)}
            />
          ))}
        </View>
      )}

      {/* Most Viewed Articles */}
      {articles.slice(6, 10).length > 0 && (
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
            Most Viewed
          </Text>
          {articles.slice(6, 10).map((article) => (
            <MostViewedCard
              key={article.id}
              article={{
                title: article.title,
                excerpt: article.excerpt,
                category:
                  article.categories && article.categories.length > 0
                    ? article.categories[0].name
                    : 'Art',
                author: getAuthorName(article),
                date: new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
              }}
              onPress={() => handleArticlePress(article.slug)}
            />
          ))}
        </View>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <View className="mb-6">
          <Text className="text-2xl font-bold mb-4" style={{ color: colors.text }}>
            More from this Category
          </Text>
          {relatedArticles.map((article) => (
            <RelatedCard
              key={article.id}
              article={{
                title: article.title,
                category:
                  article.categories && article.categories.length > 0
                    ? article.categories[0].name
                    : 'Art',
                date: new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                author: getAuthorName(article),
                imageUrl:
                  article.featured_image_url ||
                  'https://via.placeholder.com/300x200?text=No+Image',
                excerpt: article.excerpt,
              }}
              onPress={() => handleArticlePress(article.slug)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <View
        className="py-6 px-4"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-3xl font-bold text-white text-center">ART</Text>
      </View>

      {/* Content */}
      {loading ? renderLoadingState() : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text className="mt-4 text-center" style={{ color: colors.error }}>
            {error}
          </Text>
          <TouchableOpacity
            className="mt-6 px-6 py-3 rounded-lg"
            style={{ backgroundColor: colors.primary }}
            onPress={fetchArtArticles}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        renderEmptyState()
      ) : (
        <View className="flex-1 px-4 py-4">
          {renderContent()}
        </View>
      )}
    </SafeAreaView>
  );
}
