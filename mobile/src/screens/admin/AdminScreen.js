import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from '../homepage/HomeHeader';
import BottomNavigation from '../../components/common/BottomNavigation';
import EnhancedGrowthChart from '../../components/admin/EnhancedGrowthChart';
import CategoryPieChart from '../../components/admin/CategoryPieChart';
import client from '../../api/client';
import { debounce } from '../../utils/debounce';
import { searchArticles } from '../../api/services/articleService';
import ArticleMediumCard from '../../components/articles/ArticleMediumCard';
import { handleAuthorPress } from '../../utils/authorNavigation';
import { handleCategoryPress } from '../../utils/categoryNavigation';
import { showAuditToast } from '../../utils/toastNotification';
import { ArticleActionMenu } from '../../components/common';
import { formatArticleDate } from '../../utils/dateUtils';
import { colors } from '../../styles';
import { useArticles } from '../../context/ArticleContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND_BLUE       = '#2c6587';
const BRAND_BLUE_ACCENT = '#2f7cf6';
const BRAND_YELLOW     = '#f1a500';
const MODERATOR_YELLOW = '#fbbf24'; // Yellow for moderator gradient (left)
const MODERATOR_AMBER  = '#f59e0b'; // Amber for moderator gradient (right)
const ADMIN_BLUE_LIGHT = '#3b82f6'; // Light blue for admin gradient (left)
const ADMIN_BLUE_DARK  = '#1e40af'; // Dark blue for admin gradient (right)
const VALUE_DARK       = '#0f172a';
const SUCCESS_GREEN    = '#16a34a';
const DANGER_RED       = '#ef4444';
const BG_PAGE          = '#f4f7fb';
const CARD_BG          = '#ffffff';
const WHITE            = '#ffffff';
const CARD_BORDER      = '#e2eaf4';
const MUTED            = '#64748b';

const CARD_SHADOW = {
  elevation: 6,
  shadowColor: '#075985',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 20,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => Number(v ?? 0).toLocaleString();

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Two-column quick-stat card matching the screenshot */
const QuickStat = ({ label, value }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: CARD_BG,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: CARD_BORDER,
      paddingHorizontal: 16,
      paddingVertical: 18,
      justifyContent: 'space-between',
      elevation: 4,
      shadowColor: '#075985',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
    }}
  >
    <Text style={{ fontSize: 14, color: '#475569', fontWeight: '700', marginBottom: 14, lineHeight: 22 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 17, fontWeight: '800', color: value && value.includes('-') ? DANGER_RED : '#00b800' }}>
      {value || '100%'}
    </Text>
  </View>
);

/** Metric tile inside grouped card matching screenshot */
const MetricTile = ({ label, value }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: WHITE,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#edf2f7',
      paddingVertical: 18,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#075985',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
    }}
  >
    <Text 
      style={{ fontSize: 12, color: '#475569', fontWeight: '600', textAlign: 'center', marginBottom: 10 }}
      numberOfLines={2}
      adjustsFontSizeToFit
    >
      {label}
    </Text>
    <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>
      {value}
    </Text>
  </View>
);

/** Grouped container with colored border */
const StatGroup = ({ title, color, children }) => (
  <View
    style={{
      marginHorizontal: 16,
      marginBottom: 20,
      borderTopWidth: 4,
      borderColor: color,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderLeftColor: CARD_BORDER,
      borderRightColor: CARD_BORDER,
      borderBottomColor: CARD_BORDER,
      borderRadius: 18,
      padding: 16,
      backgroundColor: WHITE,
    }}
  >
    <Text style={{ fontSize: 20, fontWeight: '900', color: color, marginBottom: 16, letterSpacing: -0.5 }}>
      {title}
    </Text>
    {children}
  </View>
);

/** Icon row info card */
const InfoCard = ({ icon, label, value, accent = BRAND_BLUE }) => (
  <View
    style={[
      CARD_SHADOW,
      {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
      },
    ]}
  >
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: accent + '18',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
      }}
    >
      <Ionicons name={icon} size={22} color={accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: MUTED, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '800', color: VALUE_DARK, marginTop: 1 }}>
        {value}
      </Text>
    </View>
  </View>
);

/** Section header */
const SectionHeader = ({ title, icon }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
    <Ionicons name={icon} size={17} color={BRAND_BLUE} style={{ marginRight: 7 }} />
    <Text style={{ fontSize: 13, fontWeight: '700', color: BRAND_BLUE, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {title}
    </Text>
  </View>
);

/** Horizontal divider */
const Divider = () => (
  <View style={{ height: 1, backgroundColor: CARD_BORDER, marginHorizontal: 16, marginVertical: 22 }} />
);

/** Centered icon + label action card — matches screenshot style */
const ActionCard = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      CARD_SHADOW,
      {
        backgroundColor: CARD_BG,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: CARD_BORDER,
        paddingVertical: 26,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
      },
    ]}
  >
    <Ionicons name={icon} size={32} color={BRAND_YELLOW} />
    <Text
      style={{
        marginTop: 12,
        fontSize: 15,
        fontWeight: '700',
        color: VALUE_DARK,
        textAlign: 'center',
        lineHeight: 21,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminScreen({ navigation }) {
  const { removeArticleLocally } = useArticles();
  const [categories, setCategories]   = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState(null);

  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserModerator, setIsUserModerator] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [menuArticle, setMenuArticle] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuX, setMenuX] = useState(0);
  const [menuY, setMenuY] = useState(0);

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await searchArticles(query.trim());
      setSearchResults(res.data?.data ?? []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const debouncedSearch = useMemo(() => debounce(handleSearch, 100), [handleSearch]);

  const handleMenuPress = (article, pos) => {
    setMenuArticle(article);
    setMenuX(pos.px);
    setMenuY(pos.py);
    setShowMenu(true);
  };

  const handleEditArticle = () => {
    setShowMenu(false);
    navigation.navigate("Management", { screen: "EditArticle", params: { articleId: menuArticle.id } });
  };

  const handleDeleteArticle = async () => {
    setShowMenu(false);
    try {
      const { deleteArticle } = await import("../../api/services/articleService");
      await deleteArticle(menuArticle.id);
      setSearchResults(prev => prev.filter(a => a.id !== menuArticle.id));
      removeArticleLocally(menuArticle.id);
      DeviceEventEmitter.emit('ARTICLE_DELETED', menuArticle.id);
      showAuditToast("success", "Article deleted successfully");
    } catch (err) {
      console.error("Error deleting article:", err);
      showAuditToast("error", "Failed to delete article");
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await client.get('/api/categories');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      const withCounts = await Promise.all(
        list.map(async (cat) => {
          try {
            const r = await client.get(`/api/categories/${cat.slug}/articles`, { params: { per_page: 1 } });
            return { ...cat, article_count: r.data?.total || 0 };
          } catch {
            return { ...cat, article_count: 0 };
          }
        })
      );
      setCategories(withCounts);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await client.get('/api/admin/stats');
    setStats(res.data ?? null);
  }, []);

  const loadDashboard = useCallback(async (mode = 'initial') => {
    try {
      if (mode === 'refresh') { setRefreshing(true); } else if (mode === 'initial') { setLoading(true); }
      setError(null);
      
      // Check roles
      const userJson = await AsyncStorage.getItem('user_data');
      if (userJson) {
        const user = JSON.parse(userJson);
        setIsUserAdmin(user.role === 'admin');
        setIsUserModerator(user.role === 'moderator');
        
        // Block unauthorized access
        if (user.role !== 'admin' && user.role !== 'moderator') {
          navigation.replace('MainApp');
          return;
        }
      } else {
        navigation.replace('Login');
        return;
      }

      await Promise.all([fetchCategories(), fetchStats()]);
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError('Failed to load dashboard data. Pull down to retry.');
    } finally {
      if (mode === 'refresh') { setRefreshing(false); } else if (mode === 'initial') { setLoading(false); }
    }
  }, [fetchCategories, fetchStats, navigation]);

  useEffect(() => {
    loadDashboard('initial');
    const interval = setInterval(() => loadDashboard('silent'), 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Listen for article events for real-time dashboard updates
  useEffect(() => {
    const handlePublish = () => {
      console.log('[AdminScreen] Article published - refreshing dashboard...');
      loadDashboard('refresh');
    };

    const handleDelete = (deletedId) => {
      console.log('[AdminScreen] Article deleted - refreshing dashboard...', deletedId);
      // Remove from search results if present
      if (deletedId) {
        setSearchResults(prev => prev.filter(a => String(a.id) !== String(deletedId)));
      }
      loadDashboard('refresh');
    };

    const handleDrafted = () => {
      console.log('[AdminScreen] Article drafted - refreshing dashboard...');
      loadDashboard('refresh');
    };

    const publishListener = DeviceEventEmitter.addListener('ARTICLE_PUBLISHED', handlePublish);
    const deleteListener = DeviceEventEmitter.addListener('ARTICLE_DELETED', handleDelete);
    const draftedListener = DeviceEventEmitter.addListener('ARTICLE_DRAFTED', handleDrafted);

    return () => {
      publishListener.remove();
      deleteListener.remove();
      draftedListener.remove();
    };
  }, [loadDashboard]);

  const growthPct   = Number(stats?.growthPct ?? 0);
  const platformUsage = (stats?.totalViews ?? 0) + (stats?.totalLikes ?? 0) + (stats?.totalShares ?? 0);

  // Determine dashboard title and gradient colors based on role
  const dashboardTitle = isUserModerator ? 'Moderator Dashboard' : 'Admin Dashboard';
  const gradientColors = isUserModerator 
    ? [MODERATOR_YELLOW, MODERATOR_AMBER]  // Yellow to Amber for moderator
    : [ADMIN_BLUE_LIGHT, ADMIN_BLUE_DARK]; // Light blue to dark blue for admin

  return (
    <View style={{ flex: 1, backgroundColor: BG_PAGE }}>
      <StatusBar style="dark" hidden={false} />

      {/* Header */}
      <View style={{ backgroundColor: '#fff' }}>
        <HomeHeader
          categories={categories}
          onCategorySelect={() => {}}
          onMenuPress={() => {}}
          onGridPress={() => {}} // Disabled - already in Admin dashboard
          onSearch={debouncedSearch}
          navigation={navigation}
          enableSearch={true}
          searchQuery={searchQuery}
        />
      </View>

      {/* Dashboard title bar with gradient */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 13,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.2 }}>
            {dashboardTitle}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard('refresh')}
            tintColor={BRAND_BLUE}
          />
        }
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 20 }}
      >
        {searchQuery.trim() !== '' ? (
          <View style={{ paddingHorizontal: 16 }}>
            {searching ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 12, color: MUTED, fontSize: 14 }}>Searching...</Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text style={{ marginTop: 12, color: MUTED, fontSize: 14, textAlign: 'center' }}>No articles found for &quot;{searchQuery}&quot;</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {searchResults.map((article) => (
                  <ArticleMediumCard
                    key={article.id}
                    title={article.title}
                    category={article.categories?.[0]?.name || 'Uncategorized'}
                    author={article.author_name || article.author?.name || 'Unknown Author'}
                    date={formatArticleDate(article.created_at || article.published_at)}
                    image={article.featured_image_url || article.featured_image}
                    hashtags={article.tags?.map((t) => t.name) || []}
                    onPress={() => navigation.navigate('ArticleStack', { screen: 'ArticleDetail', params: { slug: article.slug, article } })}
                    onMenuPress={isUserAdmin ? (pos) => handleMenuPress(article, pos) : undefined}
                    onTagPress={(tagName) => navigation.navigate('ArticleStack', { screen: 'TagArticles', params: { tagName } })}
                    onAuthorPress={() => handleAuthorPress(article, navigation)}
                    onCategoryPress={(category) => handleCategoryPress(category, navigation)}
                    navigation={navigation}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
        {/* ── Loading ── */}
        {loading && !stats ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color={BRAND_BLUE} />
            <Text style={{ marginTop: 12, color: MUTED, fontSize: 14 }}>Loading dashboard…</Text>
          </View>

        /* ── Error ── */
        ) : error && !stats ? (
          <View
            style={[
              CARD_SHADOW,
              {
                margin: 20,
                backgroundColor: CARD_BG,
                borderRadius: 18,
                padding: 28,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#fee2e2',
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={44} color={DANGER_RED} />
            <Text style={{ marginTop: 10, color: DANGER_RED, fontSize: 14, textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => loadDashboard()}
              style={{
                marginTop: 16,
                backgroundColor: BRAND_BLUE,
                borderRadius: 24,
                paddingHorizontal: 28,
                paddingVertical: 11,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>

        ) : (
          <>
            {/* ── System Health ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
              <SectionHeader title="System Health" icon="pulse-outline" />
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <QuickStat label="Website Uptime" value={stats?.uptime ?? "99.9%"} />
                <QuickStat label={`Article Page Load\nSuccess Rate`} value={stats?.loadSuccessRate ?? "100%"} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <QuickStat label={`Form Submission\nSuccess Rate`} value={stats?.formSuccessRate ?? "100%"} />
                <QuickStat label={`Email Delivery\nSuccess Rate`} value={stats?.emailSuccessRate ?? "99.8%"} />
              </View>
            </View>

            <Divider />

            {/* ── Article Metrics ── */}
            <StatGroup title="Article" color={BRAND_BLUE}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <MetricTile label="Article Views" value={fmt(stats?.totalViews)} />
                <MetricTile label="Article Likes" value={fmt(stats?.totalLikes)} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <MetricTile label="Article shares" value={fmt(stats?.totalShares)} />
                <MetricTile label="Articles published" value={fmt(stats?.publishedCount ?? stats?.totalArticles)} />
              </View>
            </StatGroup>

            {/* ── Press Hub ── */}
            <StatGroup title="Press Hub" color={BRAND_YELLOW}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
            <MetricTile label={`Feedback\nForms`} value={fmt(stats?.feedbackForms)} />
            <MetricTile label={`Coverage\nRequests`} value={fmt(stats?.coverageRequests)} />
            <MetricTile label={`Membership\nApps`} value={fmt(stats?.membershipApps)} />
              </View>
            </StatGroup>

            <Divider />

            {/* ── Reach ── */}
            <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 6 }}>
              <SectionHeader title="Platform Reach" icon="globe-outline" />
              <InfoCard
                icon="phone-portrait-outline"
                label="Platform Usage (Views + Likes + Shares)"
                value={fmt(platformUsage)}
                accent={BRAND_BLUE_ACCENT}
              />
              <InfoCard
                icon="people-outline"
                label="Registered Users"
                value={fmt(stats?.totalUsers)}
                accent={BRAND_BLUE}
              />
              <InfoCard
                icon="trending-up-outline"
                label="Readership Growth (MoM)"
                value={`${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`}
                accent={growthPct >= 0 ? SUCCESS_GREEN : DANGER_RED}
              />
            </View>

            <Divider />

            {/* ── Growth Chart ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
              <SectionHeader title="Readership Growth Chart" icon="bar-chart-outline" />
              <View
                style={[
                  CARD_SHADOW,
                  {
                    backgroundColor: CARD_BG,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    padding: 16,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <View>
                    <Text style={{ fontSize: 13, color: MUTED, fontWeight: '600' }}>This Month</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: VALUE_DARK, marginTop: 2 }}>
                      {fmt(stats?.currentReaders)}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: (growthPct >= 0 ? SUCCESS_GREEN : DANGER_RED) + '18',
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: growthPct >= 0 ? SUCCESS_GREEN : DANGER_RED,
                      }}
                    >
                      {`${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`}
                    </Text>
                  </View>
                </View>
                <EnhancedGrowthChart chart={stats?.chart} />
              </View>
            </View>

            <Divider />

            {/* ── Category Pie ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
              <SectionHeader title="Category Distribution" icon="pie-chart-outline" />
              <View
                style={[
                  CARD_SHADOW,
                  {
                    backgroundColor: CARD_BG,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: CARD_BORDER,
                    padding: 16,
                  },
                ]}
              >
                <CategoryPieChart categories={categories} />
              </View>
            </View>

            <Divider />

            {/* ── Quick Actions ── */}
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              <SectionHeader title="Quick Actions" icon="flash-outline" />
              <ActionCard
                icon="reader-outline"
                label="Draft Articles"
                onPress={() => navigation.navigate('DraftArticles')}
              />
              <ActionCard
                icon="code-working-outline"
                label="Audit Trail"
                onPress={() => navigation.navigate('AuditTrail')}
              />
              {isUserAdmin && (
                <ActionCard
                  icon="people-outline"
                  label={`Manage\nModerators`}
                  onPress={() => navigation.navigate('ManageModerators')}
                />
              )}
            </View>
          </>
        )}
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={{ flexShrink: 0 }}>
        <BottomNavigation navigation={navigation} activeTab="Admin" />
      </View>

      {/* Floating Action Button (Create Article) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('CreateArticle')}
        style={{
          position: 'absolute',
          right: 18,
          bottom: 112,
          width: 72,
          height: 72,
          borderRadius: 999,
          backgroundColor: BRAND_YELLOW,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={40} color="#fff" />
      </TouchableOpacity>

      {/* Article Action Menu */}
      <ArticleActionMenu
        visible={showMenu}
        x={menuX}
        y={menuY}
        onClose={() => setShowMenu(false)}
        actions={[
          {
            label: "Edit",
            icon: "create-outline",
            color: "#0284c7",
            onPress: handleEditArticle,
          },
          {
            label: "Delete",
            icon: "trash-outline",
            color: "#ef4444",
            onPress: handleDeleteArticle,
          },
        ]}
      />
    </View>
  );
}
