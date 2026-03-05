import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Switch, Alert, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { budgetService } from '../../services/budgetService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const SimpleBudget = () => {
  const [overallBudget, setOverallBudget] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertEnabled, setAlertEnabled] = useState(true);

  const load = useCallback(async () => {
    try {
      const budgets = await budgetService.getAll();
      const overall = budgets.find((b) => b.isOverall);
      setOverallBudget(overall || null);
      if (overall) setBudgetInput(String(Math.round(overall.amount)));
    } catch (err) {
      console.warn('Budget load failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    const amount = parseFloat(budgetInput);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      if (overallBudget) {
        const updated = await budgetService.update(overallBudget.id, { amount });
        setOverallBudget(updated);
      } else {
        const created = await budgetService.create({ amount, isOverall: true, period: 'monthly' });
        setOverallBudget(created);
      }
      setEditing(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); load(); };

  const budgetNum = overallBudget?.amount || 0;
  const spent = overallBudget?.spent || 0;
  const remaining = budgetNum - spent;
  const percentage = budgetNum > 0 ? Math.min(Math.round((spent / budgetNum) * 100), 100) : 0;

  const statusColor =
    percentage >= 100 ? colors.danger :
    percentage >= 80  ? colors.warning :
    colors.success;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Your Budget</Text>
      <Text style={styles.subtitle}>
        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>

      {/* Budget Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>MONTHLY BUDGET</Text>

        {editing ? (
          <View style={styles.editRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.editInput}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color={colors.textInverse} />
                : <Text style={styles.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
            <Text style={styles.budgetDisplay}>
              {budgetNum > 0 ? `$${budgetNum}` : 'Tap to set'}{' '}
              <Text style={styles.editHint}>✏️</Text>
            </Text>
          </TouchableOpacity>
        )}

        {budgetNum > 0 && (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: statusColor }]} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.danger }]}>−${spent.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Spent</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: remaining >= 0 ? colors.success : colors.danger }]}>
                  {remaining >= 0 ? `$${remaining.toFixed(0)}` : `−$${Math.abs(remaining).toFixed(0)}`}
                </Text>
                <Text style={styles.statLabel}>{remaining >= 0 ? 'Left' : 'Over'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: statusColor }]}>{percentage}%</Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Alert Toggle */}
      <View style={styles.alertCard}>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>Budget Alerts</Text>
          <Text style={styles.alertDesc}>Notify me when I reach 80% of my budget</Text>
        </View>
        <Switch
          value={alertEnabled}
          onValueChange={setAlertEnabled}
          trackColor={{ true: colors.primary }}
          thumbColor={colors.textInverse}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  card: {
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
  cardLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  currencySymbol: { fontSize: 30, color: colors.textSecondary, fontWeight: typography.weights.bold },
  editInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.text,
    borderBottomWidth: 2,
    borderColor: colors.primary,
  },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, minWidth: 56, alignItems: 'center' },
  saveBtnText: { color: colors.textInverse, fontWeight: typography.weights.semibold },
  budgetDisplay: { fontSize: 38, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.md },
  editHint: { fontSize: 22 },
  track: { height: 12, backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden', marginBottom: spacing.md },
  fill: { height: '100%', borderRadius: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.border },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertInfo: { flex: 1, marginRight: spacing.md },
  alertTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  alertDesc: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
});

export default SimpleBudget;
