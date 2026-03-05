import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const MENU_ITEMS = [
  { label: 'Goals',          icon: '🎯', screen: 'Goals' },
  { label: 'Subscriptions',  icon: '🔄', screen: 'Subscriptions' },
  { label: 'Analytics',      icon: '📈', screen: 'Analytics' },
  { label: 'Group Expenses', icon: '👥', screen: 'GroupExpenses' },
  { label: 'Exports',        icon: '📤', screen: 'Exports' },
  { label: 'Insights',       icon: '💡', screen: 'Insights' },
];

const MoreMenuScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>More</Text>
      <Text style={styles.subtitle}>All features</Text>

      <View style={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.tile}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.75}
          >
            <Text style={styles.tileIcon}>{item.icon}</Text>
            <Text style={styles.tileLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIcon: { fontSize: 36, marginBottom: spacing.sm },
  tileLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text, textAlign: 'center' },
});

export default MoreMenuScreen;
