import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native';
import { subscriptionsService } from '../../services/subscriptionsService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const CYCLE_LABELS = { monthly: 'mo', yearly: 'yr', weekly: 'wk' };
const CYCLES = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'weekly', label: 'Weekly' },
];

const SubCard = ({ sub, onToggle, onDelete }) => {
  const nextDate = sub.nextBillingDate
    ? new Date(sub.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';
  const daysUntil = sub.nextBillingDate
    ? Math.ceil((new Date(sub.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isActive = sub.status === 'active';

  return (
    <View style={[styles.subCard, !isActive && styles.subCardInactive]}>
      <View style={styles.subLeft}>
        <Text style={styles.subEmoji}>{sub.categoryEmoji || '📦'}</Text>
        <View style={styles.subInfo}>
          <Text style={[styles.subName, !isActive && styles.inactiveText]}>{sub.name}</Text>
          <Text style={styles.subMeta}>
            {sub.categoryName || 'Other'} · {nextDate}
            {daysUntil !== null && daysUntil >= 0 && daysUntil <= 3 ? ` ⚠️ in ${daysUntil}d` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.subRight}>
        <Text style={[styles.subAmount, !isActive && styles.inactiveText]}>
          ${parseFloat(sub.amount).toFixed(2)}/{CYCLE_LABELS[sub.frequency] || 'mo'}
        </Text>
        <View style={styles.subActions}>
          <TouchableOpacity onPress={() => onToggle(sub)} style={styles.toggleBtn}>
            <Text style={[styles.toggleBtnText, { color: isActive ? colors.warning : colors.success }]}>
              {isActive ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(sub)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const SubscriptionsScreen = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addCycle, setAddCycle] = useState('monthly');
  const [addNextDate, setAddNextDate] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  const loadSubs = useCallback(async () => {
    try {
      const data = await subscriptionsService.getAll();
      setSubs(data);
    } catch {
      Alert.alert('Error', 'Failed to load subscriptions');
    }
  }, []);

  useEffect(() => {
    loadSubs().finally(() => setLoading(false));
  }, [loadSubs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubs();
    setRefreshing(false);
  };

  const activeSubs = subs.filter((s) => s.status === 'active');
  const pausedSubs = subs.filter((s) => s.status !== 'active');

  const monthlyTotal = activeSubs.reduce((sum, s) => {
    if (s.frequency === 'monthly') return sum + parseFloat(s.amount);
    if (s.frequency === 'yearly') return sum + parseFloat(s.amount) / 12;
    if (s.frequency === 'weekly') return sum + parseFloat(s.amount) * 4.33;
    return sum;
  }, 0);

  const upcomingThisWeek = activeSubs.filter((s) => {
    if (!s.nextBillingDate) return false;
    const days = Math.ceil((new Date(s.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 7;
  });

  const handleToggle = async (sub) => {
    const newStatus = sub.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await subscriptionsService.update(sub.id, { status: newStatus });
      setSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: updated.status } : s));
    } catch {
      Alert.alert('Error', 'Failed to update subscription');
    }
  };

  const handleDelete = (sub) => {
    Alert.alert('Delete Subscription', `Remove "${sub.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await subscriptionsService.delete(sub.id);
            setSubs((prev) => prev.filter((s) => s.id !== sub.id));
          } catch {
            Alert.alert('Error', 'Failed to delete subscription');
          }
        },
      },
    ]);
  };

  const handleAdd = async () => {
    if (!addName.trim() || !addAmount || parseFloat(addAmount) <= 0) {
      Alert.alert('Error', 'Name and amount are required');
      return;
    }
    setAddSaving(true);
    try {
      await subscriptionsService.create({
        name: addName.trim(),
        amount: parseFloat(addAmount),
        frequency: addCycle,
        nextBillingDate: addNextDate || undefined,
      });
      await loadSubs();
      setShowAddModal(false);
      setAddName('');
      setAddAmount('');
      setAddCycle('monthly');
      setAddNextDate('');
    } catch {
      Alert.alert('Error', 'Failed to add subscription');
    } finally {
      setAddSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Subscriptions</Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${monthlyTotal.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Monthly Cost</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{activeSubs.length}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${(monthlyTotal * 12).toFixed(0)}</Text>
              <Text style={styles.summaryLabel}>Per Year</Text>
            </View>
          </View>
        </View>

        {/* Upcoming This Week */}
        {upcomingThisWeek.length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertText}>
              {upcomingThisWeek.length} subscription{upcomingThisWeek.length > 1 ? 's' : ''} due this week:{' '}
              {upcomingThisWeek.map((s) => s.name).join(', ')}
            </Text>
          </View>
        )}

        {/* Active */}
        {activeSubs.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>ACTIVE ({activeSubs.length})</Text>
            {activeSubs.map((sub) => (
              <SubCard key={sub.id} sub={sub} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </>
        )}

        {/* Paused */}
        {pausedSubs.length > 0 && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>PAUSED</Text>
            {pausedSubs.map((sub) => (
              <SubCard key={sub.id} sub={sub} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </>
        )}

        {subs.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No subscriptions</Text>
            <Text style={styles.emptyText}>Track recurring bills and subscriptions here</Text>
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Track New Subscription</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Subscription Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Subscription</Text>

            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              value={addName}
              onChangeText={setAddName}
              placeholder="e.g. Netflix, Spotify..."
              placeholderTextColor={colors.textDisabled}
              autoFocus
            />

            <Text style={styles.label}>AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={addAmount}
                onChangeText={setAddAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textDisabled}
              />
            </View>

            <Text style={styles.label}>BILLING CYCLE</Text>
            <View style={styles.cycleRow}>
              {CYCLES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.cycleBtn, addCycle === c.id && styles.cycleBtnActive]}
                  onPress={() => setAddCycle(c.id)}
                >
                  <Text style={[styles.cycleBtnText, addCycle === c.id && styles.cycleBtnTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>NEXT BILLING DATE (optional, YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={addNextDate}
              onChangeText={setAddNextDate}
              placeholder="e.g. 2026-04-01"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numbers-and-punctuation"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAddModal(false); setAddName(''); setAddAmount(''); setAddCycle('monthly'); setAddNextDate(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleAdd} disabled={addSaving}>
                {addSaving
                  ? <ActivityIndicator color={colors.textInverse} size="small" />
                  : <Text style={styles.createBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md, marginBottom: spacing.lg },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
  summaryLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFBEB', borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  alertIcon: { fontSize: 18, marginRight: spacing.sm },
  alertText: { flex: 1, fontSize: typography.sizes.sm, color: '#92400E' },
  sectionHeader: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.sm },
  subCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  subCardInactive: { opacity: 0.6 },
  subLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  subEmoji: { fontSize: 26, marginRight: spacing.md },
  subInfo: { flex: 1 },
  subName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  inactiveText: { color: colors.textSecondary },
  subMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  subRight: { alignItems: 'flex-end' },
  subAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 4 },
  subActions: { flexDirection: 'row', gap: spacing.sm },
  toggleBtn: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  toggleBtnText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  deleteBtn: { paddingHorizontal: spacing.xs, paddingVertical: 2 },
  deleteBtnText: { fontSize: typography.sizes.sm, color: colors.textDisabled },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' },
  addBtn: {
    marginTop: spacing.sm, borderRadius: 16, borderWidth: 2,
    borderColor: colors.border, borderStyle: 'dashed',
    paddingVertical: spacing.md, alignItems: 'center',
  },
  addBtnText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: spacing.xxl },
  modalTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.sizes.md, color: colors.text, marginBottom: spacing.md,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  currency: { fontSize: 20, color: colors.textSecondary, fontWeight: typography.weights.bold, marginRight: spacing.xs },
  amountInput: { flex: 1, fontSize: 24, fontWeight: typography.weights.bold, color: colors.text, borderBottomWidth: 2, borderColor: colors.primary },
  cycleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  cycleBtn: { flex: 1, paddingVertical: spacing.xs, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.background },
  cycleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cycleBtnText: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.semibold },
  cycleBtnTextActive: { color: colors.textInverse },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.sm, alignItems: 'center' },
  cancelBtnText: { color: colors.text, fontWeight: typography.weights.semibold },
  createBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.sm, alignItems: 'center' },
  createBtnText: { color: colors.textInverse, fontWeight: typography.weights.semibold, fontSize: typography.sizes.md },
});

export default SubscriptionsScreen;
