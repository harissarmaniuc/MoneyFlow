import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { formatDate } from '../../utils/formatters';

const SimpleDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await dashboardService.get('simple');
      setData(result);
    } catch (err) {
      console.warn('Dashboard load failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const spent = data?.spent ?? 0;
  const budget = data?.budget ?? 0;
  const remaining = data?.remaining ?? 0;
  const percentage = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const transactions = data?.recentTransactions ?? [];

  const statusColor =
    percentage >= 100 ? colors.danger :
    percentage >= 80  ? colors.warning :
    colors.success;

  const statusMessage =
    percentage >= 100 ? '⚠️ Over budget!' :
    percentage >= 80  ? '⚠️ Almost at your limit' :
    '✓ You\'re on track';

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.md }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Hi, {firstName}! 👋</Text>
        <Text style={styles.dateText}>{todayStr}</Text>
      </View>

      {/* Budget Card */}
      <View style={styles.budgetCard}>
        <Text style={styles.budgetCardLabel}>SPENT THIS MONTH</Text>
        <Text style={styles.budgetAmount}>${spent.toFixed(0)}</Text>
        {budget > 0 && <Text style={styles.budgetOf}>Budget: ${budget.toFixed(0)}</Text>}

        {budget > 0 && (
          <>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: statusColor }]} />
            </View>
            <View style={styles.budgetFooter}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusMessage}</Text>
              <Text style={styles.remainingText}>${remaining.toFixed(0)} left</Text>
            </View>
          </>
        )}

        {budget === 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Budget')} style={styles.setBudgetHint}>
            <Text style={styles.setBudgetText}>+ Set a monthly budget</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent</Text>
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet — add your first expense below!</Text>
        ) : (
          transactions.map((t, i) => (
            <View key={t.id} style={[styles.txRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={styles.txEmoji}>{t.categoryEmoji || '📌'}</Text>
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{t.categoryName || t.description || 'Transaction'}</Text>
                <Text style={styles.txDate}>{formatDate(t.date)}</Text>
              </View>
              <Text style={[styles.txAmount, t.type === 'income' && styles.txAmountIncome]}>
                {t.type === 'income' ? '+' : '−'}${parseFloat(t.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Add')}
        activeOpacity={0.85}
      >
        <Text style={styles.addButtonText}>➕  Add Transaction</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  greeting: { marginTop: spacing.md, marginBottom: spacing.lg },
  greetingText: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  dateText: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetCardLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  budgetAmount: { fontSize: 52, fontWeight: typography.weights.bold, color: colors.text },
  budgetOf: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.md },
  progressTrack: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
  progressFill: { height: '100%', borderRadius: 5 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  remainingText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  setBudgetHint: { marginTop: spacing.sm },
  setBudgetText: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  txEmoji: { fontSize: 26, marginRight: spacing.md },
  txInfo: { flex: 1 },
  txName: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },
  txDate: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.danger },
  txAmountIncome: { color: colors.success },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});

export default SimpleDashboard;
