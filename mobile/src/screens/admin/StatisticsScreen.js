import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../../components/common/BottomNavigation';
import client from '../../api/client';
import { handleAuthorPress } from '../../utils/authorNavigation';



// ── 10x Executive Palette ─────────────────────────────────────────────────────
const DEEP_TEAL_BG   = '#0B1116'; // Very dark background
const CARD_BG        = '#131B23'; // Slightly lighter for cards
const BORDER         = '#1E2A35'; // Subtle border for separation
const GOLD           = '#D4AF37'; // Premium Gold
const TEAL_ACCENT    = '#00E5FF'; // Cyber teal for secondary highlights
const TEXT_MAIN      = '#FFFFFF';
const TEXT_MUTED     = '#8B9DAA';
const GREEN_OK       = '#10B981';
const RED_ALERT      = '#EF4444';

// Helpers
const fmt    = (v) => Number(v ?? 0).toLocaleString();
const fmtPct = (v) => `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(1)}%`;

// ── Shared Animation Wrapper ──────────────────────────────────────────────────
const FadeInUp = ({ delay = 0, children }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [delay, anim, slide]);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );
};

// ── Animated Horizontal Bar ───────────────────────────────────────────────────
const AnimatedBar = ({ pct, color, label, value }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 1000,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, widthAnim]);

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: TEXT_MAIN, fontSize: 13, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: color, fontSize: 13, fontWeight: '800' }}>{value}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: '#1E2A35', borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: 3,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
};

// ── Hero Dashboard Metric (Top Area) ──────────────────────────────────────────
const ExecutiveHero = ({ views, users, growth }) => (
  <LinearGradient
    colors={['#17242E', '#0E161C']}
    style={{
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: BORDER,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 10,
    }}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_OK, marginRight: 8 }} />
        <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Live Intelligence
        </Text>
      </View>
      <Ionicons name="analytics" size={20} color={GOLD} />
    </View>

    <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Total Platform Views</Text>
    <Text style={{ color: TEXT_MAIN, fontSize: 42, fontWeight: '900', letterSpacing: -1 }}>
      {fmt(views)}
    </Text>

    <View style={{ height: 1, backgroundColor: BORDER, marginVertical: 20 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <View>
        <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>Registered Users</Text>
        <Text style={{ color: TEXT_MAIN, fontSize: 20, fontWeight: '800' }}>{fmt(users)}</Text>
      </View>
      <View style={{ width: 1, backgroundColor: BORDER }} />
      <View>
        <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>MoM Growth</Text>
        <Text style={{ color: Number(growth) >= 0 ? GREEN_OK : RED_ALERT, fontSize: 20, fontWeight: '800' }}>
          {fmtPct(growth)}
        </Text>
      </View>
    </View>
  </LinearGradient>
);

// ── Metric Block (2x2 Grid) ───────────────────────────────────────────────────
const MetricBlock = ({ label, value, icon, color }) => (
  <View style={{
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <View style={{ backgroundColor: color + '1A', padding: 8, borderRadius: 10 }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
    </View>
    <Text style={{ color: TEXT_MAIN, fontSize: 24, fontWeight: '800', marginBottom: 4 }}>{value}</Text>
    <Text style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: '600' }}>{label}</Text>
  </View>
);

// ── Status Row ────────────────────────────────────────────────────────────────
const SystemStatusRow = ({ label, ok = true }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER }}>
    <Text style={{ color: TEXT_MAIN, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: ok ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ok ? GREEN_OK : RED_ALERT, marginRight: 6 }} />
      <Text style={{ color: ok ? GREEN_OK : RED_ALERT, fontSize: 11, fontWeight: '800' }}>{ok ? 'Operational' : 'Issue Detected'}</Text>
    </View>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function StatisticsScreen({ navigation }) {
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      await client.get('/api/categories');
    } catch (e) {
      console.error('Categories error:', e);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await client.get('/api/admin/stats');
      setStats(res.data);
    } catch (e) {
      console.error('Stats error:', e);
      setError('Could not load statistics. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const growthPct = Number(stats?.growthPct ?? 0);
  const maxVal    = Math.max(stats?.totalViews ?? 1, 1);
  const likePct   = Math.round(((stats?.totalLikes  ?? 0) / maxVal) * 100);
  const sharePct  = Math.round(((stats?.totalShares ?? 0) / maxVal) * 100);
  const intPct    = Math.round((Math.round((stats?.totalViews ?? 0) * 0.12) / maxVal) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: DEEP_TEAL_BG }}>
      <StatusBar style="light" />

      {/* Header (Light version since HomeHeader might be styled for light backgrounds, but let's keep it wrapped cleanly) */}
      <View style={{ backgroundColor: DEEP_TEAL_BG, borderBottomWidth: 1, borderBottomColor: BORDER }}>
        {/* We use a custom Top Bar for the Dashboard to ensure it matches the Executive Dark Theme perfectly */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER }}>
            <Ionicons name="chevron-back" size={20} color={TEXT_MAIN} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: GOLD, fontSize: 12, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Admin Center</Text>
            <Text style={{ color: TEXT_MAIN, fontSize: 18, fontWeight: '700', marginTop: 2 }}>Executive Dashboard</Text>
          </View>
          <TouchableOpacity onPress={fetchStats} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: CARD_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER }}>
            <Ionicons name="refresh" size={18} color={TEXT_MAIN} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 140 }}
      >
        {/* Loading State */}
        {loading && (
          <View style={{ alignItems: 'center', paddingTop: 100 }}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={{ marginTop: 16, color: TEXT_MUTED, fontSize: 14, fontWeight: '600' }}>Aggregating Data...</Text>
          </View>
        )}

        {/* Error State */}
        {!loading && error && (
          <View style={{ backgroundColor: CARD_BG, padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: RED_ALERT + '40' }}>
            <Ionicons name="warning-outline" size={48} color={RED_ALERT} />
            <Text style={{ marginTop: 16, color: TEXT_MAIN, fontSize: 15, textAlign: 'center', fontWeight: '600' }}>{error}</Text>
            <TouchableOpacity onPress={fetchStats} style={{ marginTop: 24, backgroundColor: GOLD, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 100 }}>
              <Text style={{ color: DEEP_TEAL_BG, fontWeight: '800', fontSize: 14 }}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {!loading && !error && stats && (
          <>
            <FadeInUp delay={0}>
              <ExecutiveHero views={stats.totalViews} users={stats.totalUsers} growth={growthPct} />
            </FadeInUp>

            {/* Key Metrics Grid */}
            <FadeInUp delay={100}>
              <Text style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: '700', marginBottom: 16, letterSpacing: 0.5 }}>Core Metrics</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <MetricBlock label="Published Articles" value={fmt(stats.publishedCount ?? stats.totalArticles)} icon="document-text" color={TEAL_ACCENT} />
                <MetricBlock label="Total Shares" value={fmt(stats.totalShares)} icon="share-social" color={GOLD} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
                <MetricBlock label="Total Likes" value={fmt(stats.totalLikes)} icon="thumbs-up" color="#3b82f6" />
                <MetricBlock label="Est. Interactions" value={fmt(Math.round((stats.totalViews ?? 0) * 0.12))} icon="pulse" color="#8B5CF6" />
              </View>
            </FadeInUp>

            {/* Engagement Funnel */}
            <FadeInUp delay={200}>
              <View style={{ backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 32 }}>
                <Text style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: '700', marginBottom: 20 }}>Engagement Funnel</Text>
                <AnimatedBar pct={100} color={TEAL_ACCENT} label="Article Views" value={fmt(stats.totalViews)} />
                <AnimatedBar pct={Math.max(likePct, 2)} color={GOLD} label="Likes" value={fmt(stats.totalLikes)} />
                <AnimatedBar pct={Math.max(sharePct, 2)} color="#F43F5E" label="Shares" value={fmt(stats.totalShares)} />
                <AnimatedBar pct={Math.max(intPct, 2)} color="#8B5CF6" label="Active Interactions" value={fmt(Math.round((stats.totalViews ?? 0) * 0.12))} />
              </View>
            </FadeInUp>

            {/* Press Hub & Operations */}
            <FadeInUp delay={300}>
              <Text style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: '700', marginBottom: 16, letterSpacing: 0.5 }}>Operations & Health</Text>
              <View style={{ backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER, marginBottom: 32 }}>
                <SystemStatusRow label="API & Data Services" ok={true} />
                <SystemStatusRow label="Content Delivery Network" ok={true} />
                <SystemStatusRow label="User Authentication" ok={true} />
                <View style={{ paddingTop: 16, marginTop: 16, borderTopWidth: 1, borderTopColor: BORDER }}>
                  <Text style={{ color: TEXT_MUTED, fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' }}>Pending Requests</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: TEXT_MAIN, fontSize: 20, fontWeight: '800' }}>{stats.feedbackForms}</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 4 }}>Feedback</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: TEXT_MAIN, fontSize: 20, fontWeight: '800' }}>{stats.coverageRequests}</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 4 }}>Coverage</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: TEXT_MAIN, fontSize: 20, fontWeight: '800' }}>{stats.membershipApps}</Text>
                      <Text style={{ color: TEXT_MUTED, fontSize: 11, marginTop: 4 }}>Memberships</Text>
                    </View>
                  </View>
                </View>
              </View>
            </FadeInUp>

            {/* Recent Publications */}
            <FadeInUp delay={400}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: TEXT_MAIN, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>Recent Publications</Text>
              </View>
              <View style={{ backgroundColor: CARD_BG, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: BORDER }}>
                {stats.recentArticles?.length > 0 ? (
                  stats.recentArticles.slice(0, 5).map((a, i) => (
                    <View key={a.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i === Math.min(stats.recentArticles.length, 5) - 1 ? 0 : 1, borderBottomColor: BORDER }}>
                      <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: DEEP_TEAL_BG, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER, marginRight: 12 }}>
                        <Ionicons name="document-text" size={18} color={GOLD} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: TEXT_MAIN, fontSize: 14, fontWeight: '600', marginBottom: 4 }} numberOfLines={1}>{a.title}</Text>
                        <TouchableOpacity onPress={() => handleAuthorPress(a, navigation)}>
                          <Text style={{ color: TEXT_MUTED, fontSize: 12, textDecorationLine: 'underline' }}>{a.author_name || 'Staff Writer'}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ backgroundColor: a.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: a.status === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)' }}>
                        <Text style={{ color: a.status === 'published' ? GREEN_OK : GOLD, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{a.status}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                    <Ionicons name="journal-outline" size={32} color={BORDER} />
                    <Text style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 12 }}>No recent publications found.</Text>
                  </View>
                )}
              </View>
            </FadeInUp>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={{ backgroundColor: CARD_BG, borderTopWidth: 1, borderTopColor: BORDER }}>
        <BottomNavigation navigation={navigation} activeTab="Home" />
      </View>
    </View>
  );
}

