import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useMode } from '../../hooks/useMode';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const Row = ({ label, value, onPress, danger }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.6 : 1}
  >
    <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
    {value ? <Text style={styles.rowValue}>{value}</Text> : null}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const { mode, switchMode } = useMode();

  const handleModeSwitch = () => {
    const next = mode === 'simple' ? 'detailed' : 'simple';
    Alert.alert(
      `Switch to ${next === 'simple' ? 'Simple' : 'Detailed'} Mode?`,
      next === 'detailed'
        ? 'You\'ll see more features and analytics.'
        : 'You\'ll see only the essentials — your data is safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => switchMode(next) },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.sectionHeader}>ACCOUNT</Text>
      <View style={styles.section}>
        <Row label="Name" value={user?.fullName || '—'} />
        <Row label="Email" value={user?.email || '—'} />
      </View>

      <Text style={styles.sectionHeader}>APP</Text>
      <View style={styles.section}>
        <Row
          label="Mode"
          value={mode === 'simple' ? '📱 Simple →' : '📊 Detailed →'}
          onPress={handleModeSwitch}
        />
        <Row label="Language" value="English →" onPress={() => {}} />
        <Row label="Notifications" value="On →" onPress={() => {}} />
      </View>

      <Text style={styles.sectionHeader}>DATA</Text>
      <View style={styles.section}>
        <Row label="Export Data" value="→" onPress={() => {}} />
        <Row label="Delete Account" danger onPress={() => {}} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>MoneyFlows v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  section: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLabel: { fontSize: typography.sizes.md, color: colors.text },
  rowLabelDanger: { color: colors.danger },
  rowValue: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  logoutBtn: {
    marginTop: spacing.xl,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { color: colors.danger, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  version: {
    textAlign: 'center',
    color: colors.textDisabled,
    fontSize: typography.sizes.xs,
    marginTop: spacing.lg,
  },
});

export default SettingsScreen;
