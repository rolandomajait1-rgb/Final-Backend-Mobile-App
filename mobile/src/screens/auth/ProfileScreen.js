import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Loader, Button, ErrorMessage } from '../../components/common';
import { getCurrentUser, logout } from '../../api/services/authService';
import { colors, typography, spacing } from '../../styles';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('auth_token').then(token => {
      if (!token) { setLoading(false); return; }
      getCurrentUser()
        .then(res => setUser(res.data))
        .catch(() => setError('Failed to load profile.'))
        .finally(() => setLoading(false));
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logout();
          setUser(null);
        },
      },
    ]);
  };

  if (loading) return <Loader />;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={80} color={colors.border} />
          <Text style={styles.guestTitle}>You're not signed in</Text>
          <Text style={styles.guestSub}>Sign in to access your profile and saved articles.</Text>
          <Button title="Sign In" onPress={() => navigation.navigate('Login')} style={styles.btn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.profileCard}>
        <Ionicons name="person-circle" size={72} color={colors.primary} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role ?? 'reader'}</Text>
        </View>
      </View>

      <ErrorMessage message={error} style={{ marginHorizontal: spacing.md }} />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
          <Text style={[styles.actionText, { color: colors.status.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  guestTitle: { fontFamily: typography.fontFamily.serif, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginTop: spacing.md },
  guestSub: { fontSize: typography.fontSize.sm, color: colors.text.muted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
  btn: { width: '100%' },
  profileCard: { alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { fontFamily: typography.fontFamily.serif, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginTop: spacing.sm },
  email: { fontSize: typography.fontSize.sm, color: colors.text.muted, marginTop: 2 },
  roleBadge: { marginTop: spacing.sm, backgroundColor: colors.primary + '20', paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: 12 },
  roleText: { fontSize: typography.fontSize.xs, color: colors.primary, fontWeight: typography.fontWeight.semibold, textTransform: 'capitalize' },
  actions: { padding: spacing.md },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm },
  actionText: { fontSize: typography.fontSize.base },
});
