import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';
import { Input, Button, ErrorMessage } from '../../components/common';
import { login } from '../../api/services/authService';
import { colors, typography, spacing } from '../../styles';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigation.replace('Main');
    } catch (e) {
      setError(e.response?.data?.message ?? 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.masthead}>La Verdad Herald</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <ErrorMessage message={error} />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={styles.btn} />

          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Continue without signing in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xxl },
  masthead: { fontFamily: typography.fontFamily.serif, fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: typography.fontSize.base, color: colors.text.muted, textAlign: 'center', marginBottom: spacing.xl },
  btn: { marginTop: spacing.sm },
  skipBtn: { marginTop: spacing.lg, alignItems: 'center' },
  skipText: { fontSize: typography.fontSize.sm, color: colors.text.muted, textDecorationLine: 'underline' },
});
