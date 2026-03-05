import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { formatDate } from '../../utils/formatters';

const StatCard = ({ label, value, subtitle, color }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color && { color }]}>{value}</Text>
    {subtitle ? <Text style={styles.statSub}>{subtitle}</Text> : null}
  </View>
);

const CategoryBar = ({ item }) => {
  const pct = item.budget > 0 ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
  const barColor = pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : item.color || colors.primary;
  return (
    <View style={styles.catRow}>
      <Text style={styles.catEmoji}>{item.emoji || '📦'}</Text>
      <View style={styles.catInfo}>
        <View style={styles.catHeader}>
          <Text style={styles.catName}>{item.name}</Text>
          <Text style={styles.catAmounts}>${item.spent} / ${item.budget}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
};

const GoalChip = ({ goal }) => {
  const pct = goal.percentage || 0;
  return (
    <View style={styles.goalChip}>
      <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
      <Text style={styles.goalPct}>{pct}%</Text>
      <View style={styles.goalTrack}>
        <View style={[styles.goalFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
};

const DetailedDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await dashboardService.get('detailed');
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard');
    }
  }, []);

  useEffect(() => {
    fetchDashboard().finally(() => setLoading(false));
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchDashboard().finally(() => setLoading(false)); }}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalSpent = data?.summary?.totalSpent ?? 0;
  const totalBudget = data?.summary?.totalBudget ?? 0;
  const remaining = data?.summary?.remaining ?? 0;
  const overallPct = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  // Get current month income from trend data
  const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentTrend = data?.monthlyTrend?.find((t) => t.month === currentMonthKey);
  const totalIncome = currentTrend?.income ?? 0;
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalSpent) / totalIncome) * 100) : 0;

  // Category budgets (exclude overall)
  const categoryBudgets = (data?.budgets || [])
    .filter((b) => !b.isOverall && b.categoryName)
    .map((b) => ({
      id: b.id,
      emoji: b.categoryEmoji || '📦',
      name: b.categoryName,
      spent: b.spent,
      budget: b.amount,
      color: colors.primary,
    }));

  const recentTransactions = data?.recentTransactions || [];
  const goals = data?.goals || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
          <Text style={styles.month}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
          <Text style={styles.avatar}>{user?.fullName?.[0] || '?'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Spent" value={`$${totalSpent.toFixed(0)}`} subtitle={totalBudget > 0 ? `of $${totalBudget.toFixed(0)}` : undefined} color={colors.danger} />
        <StatCard label="Income" value={`$${totalIncome.toFixed(0)}`} color={colors.success} />
        <StatCard label="Saved" value={`${savingsRate}%`} color={colors.primary} />
      </View>

      {/* Overall Budget Bar */}
      {totalBudget > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Overview</Text>
            <Text style={styles.cardRight}>{overallPct}% used</Text>
          </View>
          <View style={styles.bigTrack}>
            <View style={[
              styles.bigFill,
              {
                width: `${overallPct}%`,
                backgroundColor: overallPct >= 100 ? colors.danger : overallPct >= 80 ? colors.warning : colors.success,
              },
            ]} />
          </View>
          <Text style={styles.remaining}>
            {remaining >= 0 ? `$${remaining.toFixed(0)} remaining` : `$${Math.abs(remaining).toFixed(0)} over budget`}
          </Text>
        </View>
      )}

      {/* Goals Strip */}
      {goals.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Goals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalsScroll}>
            {goals.map((g) => <GoalChip key={g.id} goal={g} />)}
          </ScrollView>
        </View>
      )}

      {/* Category Breakdown */}
      {categoryBudgets.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>By Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Budget')}>
              <Text style={styles.seeAll}>Manage →</Text>
            </TouchableOpacity>
          </View>
          {categoryBudgets.map((cat) => <CategoryBar key={cat.id} item={cat} />)}
        </View>
      )}

      {/* Analytics Teaser */}
      <TouchableOpacity style={styles.analyticsCard} onPress={() => navigation.navigate('Analytics')} activeOpacity={0.8}>
        <Text style={styles.analyticsTitle}>📊 View Analytics</Text>
        <Text style={styles.analyticsDesc}>Charts, trends, and spending insights</Text>
        <Text style={styles.analyticsArrow}>→</Text>
      </TouchableOpacity>

      {/* Recent Transactions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet this month</Text>
        ) : (
          recentTransactions.map((t, i) => (
            <View key={t.id} style={[styles.txRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={styles.txEmoji}>{t.categoryEmoji || '💳'}</Text>
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{t.merchantName || t.description || t.categoryName || 'Transaction'}</Text>
                <Text style={styles.txMeta}>{t.categoryName || 'Other'} · {formatDate(t.date)}</Text>
              </View>
              <Text style={[styles.txAmount, t.type === 'income' && { color: colors.success }]}>
                {t.type === 'income' ? '+' : '−'}${t.amount.toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.container },
  errorText: { fontSize: typography.sizes.md, color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  retryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryBtnText: { color: colors.textInverse, fontWeight: typography.weights.semibold },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  greeting: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  month: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatar: { color: colors.textInverse, fontWeight: typography.weights.bold, fontSize: typography.sizes.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, alignItems: 'center' },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontWeight: typography.weights.semibold, letterSpacing: 0.5, marginBottom: 4 },
  statValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  statSub: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.md, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  cardRight: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  seeAll: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.semibold },
  bigTrack: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.xs },
  bigFill: { height: '100%', borderRadius: 5 },
  remaining: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  goalsScroll: { marginHorizontal: -spacing.xs },
  goalChip: { width: 140, backgroundColor: colors.background, borderRadius: 14, padding: spacing.sm, marginRight: spacing.sm },
  goalTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: 4 },
  goalPct: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.bold, marginBottom: 4 },
  goalTrack: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  catEmoji: { fontSize: 22, marginRight: spacing.sm },
  catInfo: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  catAmounts: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  analyticsCard: {
    backgroundColor: colors.primary, borderRadius: 20, padding: spacing.lg,
    marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center',
  },
  analyticsTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textInverse, flex: 1 },
  analyticsDesc: { fontSize: typography.sizes.xs, color: 'rgba(255,255,255,0.8)', position: 'absolute', bottom: spacing.md, left: spacing.lg },
  analyticsArrow: { fontSize: typography.sizes.xl, color: colors.textInverse },
  emptyText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  txEmoji: { fontSize: 24, marginRight: spacing.md },
  txInfo: { flex: 1 },
  txName: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },
  txMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.danger },
});

export default DetailedDashboard;
