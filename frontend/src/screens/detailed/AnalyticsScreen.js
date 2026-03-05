import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { analyticsService } from '../../services/analyticsService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const PERIOD_OPTIONS = ['3M', '6M', '1Y', 'All'];

const CATEGORY_COLORS = [
  '#EF4444', '#F59E0B', '#3B82F6', '#10B981',
  '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280',
];

const BarChart = ({ data }) => {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map((d) => d.expenses), 1);
  return (
    <View style={styles.barChart}>
      {data.map((item, idx) => {
        const height = Math.max(Math.round((item.expenses / maxVal) * 80), 4);
        const isLast = idx === data.length - 1;
        const label = item.month.slice(5); // MM from YYYY-MM
        const monthName = new Date(`${item.month}-01`).toLocaleDateString('en-US', { month: 'short' });
        return (
          <View key={item.month} style={styles.barItem}>
            <Text style={styles.barValue}>
              ${item.expenses > 999 ? `${(item.expenses / 1000).toFixed(1)}k` : item.expenses.toFixed(0)}
            </Text>
            <View style={[styles.bar, { height, backgroundColor: isLast ? colors.primary : colors.border }]} />
            <Text style={styles.barLabel}>{monthName}</Text>
          </View>
        );
      })}
    </View>
  );
};

const AnalyticsScreen = () => {
  const [period, setPeriod] = useState('6M');
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (selectedPeriod) => {
    try {
      const data = await analyticsService.getSpendingPatterns(selectedPeriod);
      setPatterns(data);
      setError(null);
    } catch {
      setError('Failed to load analytics');
    }
  }, []);

  useEffect(() => {
    fetchData(period).finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const handlePeriodChange = async (p) => {
    setPeriod(p);
    setLoading(true);
    await fetchData(p);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(period);
    setRefreshing(false);
  };

  // Aggregate flat rows into monthly totals
  const monthlyMap = {};
  patterns.forEach((row) => {
    if (!monthlyMap[row.month]) monthlyMap[row.month] = { month: row.month, expenses: 0 };
    monthlyMap[row.month].expenses += parseFloat(row.total || 0);
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  // Aggregate by category (latest month or all time)
  const latestMonth = monthlyData.length ? monthlyData[monthlyData.length - 1].month : null;
  const latestMonthRows = latestMonth ? patterns.filter((r) => r.month === latestMonth) : [];
  const totalLatest = latestMonthRows.reduce((s, r) => s + parseFloat(r.total || 0), 0);
  const categoryData = latestMonthRows
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
    .map((r, i) => ({
      id: r.category_id || String(i),
      emoji: r.emoji || '📦',
      name: r.category_name || 'Other',
      amount: parseFloat(r.total || 0),
      pct: totalLatest > 0 ? Math.round((parseFloat(r.total) / totalLatest) * 100) : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  const totalSpent = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const avgMonthly = monthlyData.length ? Math.round(totalSpent / monthlyData.length) : 0;
  const lastTwo = monthlyData.slice(-2);
  const trend = lastTwo.length === 2 ? lastTwo[1].expenses - lastTwo[0].expenses : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Analytics</Text>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {PERIOD_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => handlePeriodChange(p)}
            disabled={loading}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          {/* Key Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>${totalSpent.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Spent</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>${avgMonthly.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Monthly Avg</Text>
            </View>
            {lastTwo.length === 2 && (
              <View style={[styles.metricCard, { flex: 1.2 }]}>
                <Text style={[styles.metricVal, { color: trend > 0 ? colors.danger : colors.success }]}>
                  {trend > 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}
                </Text>
                <Text style={styles.metricLabel}>vs Last Month</Text>
              </View>
            )}
          </View>

          {/* Spending Trend */}
          {monthlyData.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Spending Trend</Text>
              <BarChart data={monthlyData} />
            </View>
          ) : null}

          {/* Category Breakdown */}
          {categoryData.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>By Category</Text>
              <Text style={styles.cardSub}>
                {latestMonth
                  ? new Date(`${latestMonth}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  : 'This month'}
              </Text>
              {categoryData.map((cat) => (
                <View key={cat.id} style={styles.catRow}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <View style={styles.catInfo}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <Text style={styles.catAmt}>${cat.amount.toFixed(0)} · {cat.pct}%</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${cat.pct}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Empty state */}
          {monthlyData.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptyText}>Add transactions to see spending analytics</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md, marginBottom: spacing.md },
  periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  periodBtn: {
    flex: 1, paddingVertical: spacing.xs, alignItems: 'center',
    borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  periodTextActive: { color: colors.textInverse },
  loadingBox: { paddingVertical: spacing.xxl, alignItems: 'center' },
  errorBox: { paddingVertical: spacing.lg, alignItems: 'center' },
  errorText: { color: colors.danger, fontSize: typography.sizes.sm },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  metricCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, alignItems: 'center' },
  metricVal: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  metricLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, paddingTop: spacing.md },
  barItem: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 9, color: colors.textSecondary, marginBottom: 4 },
  bar: { width: '60%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 6 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  catEmoji: { fontSize: 20, marginRight: spacing.sm },
  catInfo: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  catAmt: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  emptyBox: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' },
});

export default AnalyticsScreen;
