import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { insightsService } from '../../services/insightsService';

const TYPE_STYLE = {
  warning:  { color: colors.warning,  bg: '#FFFBEB', border: '#FDE68A', icon: '⚠️' },
  success:  { color: colors.success,  bg: '#F0FDF4', border: '#BBF7D0', icon: '🎉' },
  tip:      { color: colors.primary,  bg: colors.primaryBg, border: '#BFDBFE', icon: '💡' },
  goal:     { color: '#06B6D4',       bg: '#ECFEFF', border: '#A5F3FC', icon: '🎯' },
  budget:   { color: colors.danger,   bg: '#FEF2F2', border: '#FECACA', icon: '📊' },
  default:  { color: colors.primary,  bg: colors.primaryBg, border: '#BFDBFE', icon: '💡' },
};

const InsightCard = ({ insight, onAction }) => {
  const style = TYPE_STYLE[insight.type] || TYPE_STYLE.default;
  return (
    <View style={[styles.card, { backgroundColor: style.bg, borderColor: style.border }]}>
      <View style={styles.cardTop}>
        <Text style={styles.cardIcon}>{style.icon}</Text>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: style.color }]}>{insight.title}</Text>
          <Text style={styles.cardDesc}>{insight.description}</Text>
        </View>
      </View>
      {insight.action_label && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: style.color }]}
          onPress={() => onAction(insight.id)}
        >
          <Text style={[styles.actionBtnText, { color: style.color }]}>{insight.action_label} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const InsightsScreen = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      setError(null);
      const data = await insightsService.getAll();
      setInsights(data);
    } catch {
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const handleAction = async (id) => {
    try {
      await insightsService.markRead(id);
      setInsights((prev) => prev.map((i) => i.id === id ? { ...i, is_read: true } : i));
    } catch { /* silent */ }
  };

  const total = insights.length;
  const unread = insights.filter((i) => !i.is_read).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>Personalized tips for your finances</Text>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💡</Text>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Insights</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔔</Text>
          <Text style={styles.statValue}>{unread}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{total - unread}</Text>
          <Text style={styles.statLabel}>Read</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchInsights}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : insights.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No insights yet</Text>
          <Text style={styles.emptyHint}>Add some transactions to get personalized tips!</Text>
        </View>
      ) : (
        insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} onAction={handleAction} />
        ))
      )}

      {/* AI Feature Teaser */}
      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>🤖 AI-Powered Insights</Text>
        <Text style={styles.aiDesc}>
          Connect your bank accounts to get deeper analysis, anomaly detection, and predictive budgeting.
        </Text>
        <TouchableOpacity style={styles.aiBtn} activeOpacity={0.8}>
          <Text style={styles.aiBtnText}>Connect Bank Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, alignItems: 'center', gap: 2 },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, textAlign: 'center' },
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  errorText: { color: colors.danger, marginBottom: spacing.xs },
  retryText: { color: colors.primary, fontWeight: typography.weights.semibold },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: spacing.xs },
  emptyHint: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' },
  card: { borderRadius: 16, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  cardTop: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  cardIcon: { fontSize: 24, lineHeight: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginBottom: 4 },
  cardDesc: { fontSize: typography.sizes.sm, color: colors.text, lineHeight: 20 },
  actionBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginTop: spacing.xs },
  actionBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  aiCard: { backgroundColor: colors.primary, borderRadius: 20, padding: spacing.lg, marginTop: spacing.sm },
  aiTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textInverse, marginBottom: spacing.sm },
  aiDesc: { fontSize: typography.sizes.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: spacing.md },
  aiBtn: { backgroundColor: colors.textInverse, borderRadius: 12, paddingVertical: spacing.sm, alignItems: 'center' },
  aiBtnText: { color: colors.primary, fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
});

export default InsightsScreen;
