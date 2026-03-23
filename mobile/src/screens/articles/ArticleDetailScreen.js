import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView,
  TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Loader, ErrorMessage } from '../../components/common';
import { getArticleById } from '../../api/services/articleService';
import { colors } from '../../styles';

const FALLBACK = 'https://via.placeholder.com/800x400/e2e8f0/64748b?text=No+Image';

// Strip HTML tags for plain text rendering (Phase 2 — WebView in Phase 3)
const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') ?? '';

export default function ArticleDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getArticleById(id)
      .then(res => setArticle(res.data))
      .catch(() => setError('Failed to load article.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!article) return;
    await Share.share({ message: `${article.title}\n\nhttps://final-backend-mobile-app.onrender.com` });
  };

  if (loading) return <Loader />;
  if (error) return (
    <SafeAreaView className="flex-1 bg-white">
      <ErrorMessage message={error} style={{ margin: 16 }} />
    </SafeAreaView>
  );

  const category = article.categories?.[0]?.name ?? '';
  const author = article.author_name ?? article.author?.user?.name ?? '';
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} className="p-2">
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: article.featured_image || FALLBACK }} className="w-full h-56 bg-gray-300" resizeMode="cover" />

        <View className="p-4">
          {category ? <Text className="text-xs font-bold text-green-600 mb-2 tracking-widest uppercase">{category}</Text> : null}
          <Text className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{article.title}</Text>
          <View className="flex-row flex-wrap mb-3">
            <Text className="text-sm text-gray-600">{author}</Text>
            {date ? <Text className="text-sm text-gray-600"> · {date}</Text> : null}
            {article.view_count ? <Text className="text-sm text-gray-600"> · {article.view_count} views</Text> : null}
          </View>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {article.tags.map(tag => (
                <View key={tag.id} className="bg-gray-100 rounded px-3 py-1">
                  <Text className="text-xs text-gray-700">#{tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="h-px bg-gray-200 my-4" />
          <Text className="text-base text-gray-900 leading-relaxed">{stripHtml(article.content)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
