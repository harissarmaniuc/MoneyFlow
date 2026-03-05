import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { goalsService } from '../../services/goalsService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const QUICK_EMOJIS = ['🎯', '🏖️', '🚗', '🏠', '✈️', '💍', '🎓', '💻'];

const GoalCard = ({ goal, onContribute, onDelete }) => {
  const pct = Math.min(goal.percentage || 0, 100);
  const remaining = goal.targetAmount - goal.currentAmount;
  const deadline = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{goal.emoji || '🎯'}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{goal.title}</Text>
          {deadline ? <Text style={styles.cardDeadline}>Target: {deadline}</Text> : null}
        </View>
        <View style={styles.cardActions}>
          <Text style={[styles.pct, { color: colors.primary }]}>{pct}%</Text>
          <TouchableOpacity onPress={() => onDelete(goal)} style={styles.deleteIconBtn}>
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
      </View>

      <View style={styles.cardStats}>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: colors.primary }]}>${goal.currentAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>${remaining.toLocaleString()}</Text>
          <Text style={styles.statLabel}>To go</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>${goal.targetAmount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Target</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.contributeBtn}
        onPress={() => onContribute(goal)}
        activeOpacity={0.8}
      >
        <Text style={styles.contributeBtnText}>+ Add Money</Text>
      </TouchableOpacity>
    </View>
  );
};

const GoalsScreen = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [adding, setAdding] = useState(false);
  // Contribute modal
  const [contributeGoal, setContributeGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributing, setContributing] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      const data = await goalsService.getAll();
      setGoals(data);
    } catch {
      Alert.alert('Error', 'Failed to load goals');
    }
  }, []);

  useEffect(() => {
    loadGoals().finally(() => setLoading(false));
  }, [loadGoals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const handleAddGoal = async () => {
    if (!goalName.trim() || !goalTarget || parseFloat(goalTarget) <= 0) {
      Alert.alert('Error', 'Please fill in name and target amount');
      return;
    }
    setAdding(true);
    try {
      await goalsService.create({
        title: goalName.trim(),
        type: 'savings',
        targetAmount: parseFloat(goalTarget),
        targetDate: goalDeadline || undefined,
      });
      await loadGoals();
      setShowAdd(false);
      setGoalName('');
      setGoalTarget('');
      setGoalEmoji('🎯');
      setGoalDeadline('');
    } catch {
      Alert.alert('Error', 'Failed to create goal');
    } finally {
      setAdding(false);
    }
  };

  const handleContribute = (goal) => {
    setContributeGoal(goal);
    setContributeAmount('');
  };

  const handleContributeSubmit = async () => {
    const addAmt = parseFloat(contributeAmount);
    if (!addAmt || addAmt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    setContributing(true);
    try {
      const newTotal = contributeGoal.currentAmount + addAmt;
      await goalsService.contribute(contributeGoal.id, newTotal);
      await loadGoals();
      setContributeGoal(null);
    } catch {
      Alert.alert('Error', 'Failed to update goal');
    } finally {
      setContributing(false);
    }
  };

  const handleDelete = (goal) => {
    Alert.alert('Delete Goal', `Remove "${goal.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await goalsService.delete(goal.id);
            setGoals((prev) => prev.filter((g) => g.id !== goal.id));
          } catch {
            Alert.alert('Error', 'Failed to delete goal');
          }
        },
      },
    ]);
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
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Goals</Text>
            <Text style={styles.subtitle}>{goals.length} active goal{goals.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowAdd((v) => !v)} activeOpacity={0.8}>
            <Text style={styles.newBtnText}>{showAdd ? '✕ Cancel' : '+ New Goal'}</Text>
          </TouchableOpacity>
        </View>

        {/* Add Goal Form */}
        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>New Savings Goal</Text>

            <Text style={styles.label}>ICON</Text>
            <View style={styles.emojiRow}>
              {QUICK_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, goalEmoji === e && styles.emojiBtnActive]}
                  onPress={() => setGoalEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>GOAL NAME</Text>
            <TextInput
              style={styles.input}
              value={goalName}
              onChangeText={setGoalName}
              placeholder="e.g. Beach Vacation"
              placeholderTextColor={colors.textDisabled}
            />

            <Text style={styles.label}>TARGET AMOUNT</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={goalTarget}
                onChangeText={setGoalTarget}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textDisabled}
              />
            </View>

            <Text style={styles.label}>TARGET DATE (optional, YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={goalDeadline}
              onChangeText={setGoalDeadline}
              placeholder="e.g. 2027-06-01"
              placeholderTextColor={colors.textDisabled}
              keyboardType="numbers-and-punctuation"
            />

            <TouchableOpacity style={styles.createBtn} onPress={handleAddGoal} disabled={adding} activeOpacity={0.8}>
              {adding
                ? <ActivityIndicator color={colors.textInverse} />
                : <Text style={styles.createBtnText}>Create Goal</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Goal Cards */}
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onContribute={handleContribute} onDelete={handleDelete} />
        ))}

        {goals.length === 0 && !showAdd && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyText}>Tap "+ New Goal" to start saving for something meaningful</Text>
          </View>
        )}
      </ScrollView>

      {/* Contribute Modal */}
      <Modal visible={!!contributeGoal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Money to {contributeGoal?.title}</Text>
            <Text style={styles.modalSub}>
              Current: ${contributeGoal?.currentAmount.toLocaleString()} / ${contributeGoal?.targetAmount.toLocaleString()}
            </Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={contributeAmount}
                onChangeText={setContributeAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textDisabled}
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setContributeGoal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleContributeSubmit} disabled={contributing}>
                {contributing
                  ? <ActivityIndicator color={colors.textInverse} />
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
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.md, marginBottom: spacing.lg },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  newBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2 },
  newBtnText: { color: colors.textInverse, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  addCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 2, borderColor: colors.primary },
  addTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.md },
  label: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs },
  emojiRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  emojiBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  emojiBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  emojiText: { fontSize: 20 },
  input: {
    backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: typography.sizes.md, color: colors.text, marginBottom: spacing.md,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  currency: { fontSize: 24, color: colors.textSecondary, fontWeight: typography.weights.bold, marginRight: spacing.xs },
  amountInput: { flex: 1, fontSize: 28, fontWeight: typography.weights.bold, color: colors.text, borderBottomWidth: 2, borderColor: colors.primary },
  createBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
  createBtnText: { color: colors.textInverse, fontWeight: typography.weights.semibold, fontSize: typography.sizes.md },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.sm, alignItems: 'center', marginRight: spacing.sm },
  cancelBtnText: { color: colors.text, fontWeight: typography.weights.semibold },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardEmoji: { fontSize: 32, marginRight: spacing.md },
  cardInfo: { flex: 1 },
  cardName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  cardDeadline: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  cardActions: { alignItems: 'flex-end' },
  pct: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  deleteIconBtn: { marginTop: 4, padding: 4 },
  deleteIcon: { fontSize: typography.sizes.sm, color: colors.textDisabled },
  track: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.md },
  fill: { height: '100%', borderRadius: 5 },
  cardStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.border },
  contributeBtn: { borderRadius: 12, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.primary },
  contributeBtnText: { color: colors.textInverse, fontWeight: typography.weights.semibold, fontSize: typography.sizes.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: spacing.xxl },
  modalTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.xs },
  modalSub: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  modalBtns: { flexDirection: 'row', marginTop: spacing.sm },
});

export default GoalsScreen;
