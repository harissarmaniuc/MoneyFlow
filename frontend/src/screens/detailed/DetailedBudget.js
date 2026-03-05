import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { budgetService } from '../../services/budgetService';
import { categoryService } from '../../services/categoryService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const CategoryBudgetRow = ({ item, onEdit }) => {
  const pct = item.budget > 0 ? Math.min(Math.round((item.spent / item.budget) * 100), 100) : 0;
  const remaining = item.budget - item.spent;
  const barColor = pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.success;

  return (
    <View style={styles.catCard}>
      <View style={styles.catHeader}>
        <Text style={styles.catEmoji}>{item.emoji || '📦'}</Text>
        <View style={styles.catMeta}>
          <Text style={styles.catName}>{item.label}</Text>
          <Text style={styles.catAmounts}>
            ${item.spent.toFixed(0)} spent · ${item.budget.toFixed(0)} budget
          </Text>
        </View>
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.catFooter}>
        <Text style={[styles.pctText, { color: barColor }]}>{pct}% used</Text>
        <Text style={[styles.remainText, { color: remaining < 0 ? colors.danger : colors.textSecondary }]}>
          {remaining >= 0 ? `$${remaining.toFixed(0)} left` : `$${Math.abs(remaining).toFixed(0)} over`}
        </Text>
      </View>
    </View>
  );
};

const DetailedBudget = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const [addingSaving, setAddingSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [budgetData, catData] = await Promise.all([
        budgetService.getAll(),
        categoryService.getAll(),
      ]);
      setBudgets(budgetData);
      setCategories(catData.filter((c) => !c.isIncome));
    } catch {
      Alert.alert('Error', 'Failed to load budget data');
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const overallBudget = budgets.find((b) => b.isOverall);
  const categoryBudgets = budgets.filter((b) => !b.isOverall && b.categoryId);

  const overallSpent = overallBudget?.spent ?? 0;
  const overallAmount = overallBudget?.amount ?? 0;
  const overallPct = overallAmount > 0 ? Math.min(Math.round((overallSpent / overallAmount) * 100), 100) : 0;

  const displayCategories = categoryBudgets.map((b) => ({
    id: b.id,
    categoryId: b.categoryId,
    emoji: b.categoryEmoji || '📦',
    label: b.categoryName || 'Category',
    budget: b.amount,
    spent: b.spent || 0,
  }));

  const handleEdit = (item) => {
    setEditItem(item);
    setEditValue(String(item.budget));
    setShowAddForm(false);
  };

  const handleSaveEdit = async () => {
    if (!editValue || parseFloat(editValue) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }
    setSaving(true);
    try {
      await budgetService.update(editItem.id, { amount: parseFloat(editValue) });
      await loadData();
      setEditItem(null);
    } catch {
      Alert.alert('Error', 'Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBudget = async () => {
    if (!newCategoryId || !newAmount || parseFloat(newAmount) <= 0) {
      Alert.alert('Error', 'Please select a category and enter an amount');
      return;
    }
    setAddingSaving(true);
    try {
      await budgetService.create({ categoryId: newCategoryId, amount: parseFloat(newAmount) });
      await loadData();
      setShowAddForm(false);
      setNewCategoryId(null);
      setNewAmount('');
    } catch {
      Alert.alert('Error', 'Failed to add budget');
    } finally {
      setAddingSaving(false);
    }
  };

  const budgetedCategoryIds = new Set(categoryBudgets.map((b) => b.categoryId));
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id));

  if (loading) {
    return (
      <View style={styles.centered}>
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
      <Text style={styles.title}>Budget</Text>
      <Text style={styles.subtitle}>
        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>

      {/* Overall Summary Card */}
      {overallBudget ? (
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>OVERALL BUDGET</Text>
          <Text style={styles.overallAmount}>${overallSpent.toFixed(0)}</Text>
          <Text style={styles.overallOf}>of ${overallAmount.toFixed(0)}</Text>
          <View style={styles.bigTrack}>
            <View style={[
              styles.bigFill,
              {
                width: `${overallPct}%`,
                backgroundColor: overallPct >= 100 ? colors.danger : overallPct >= 80 ? colors.warning : colors.success,
              },
            ]} />
          </View>
          <View style={styles.overallFooter}>
            <Text style={styles.overallStat}>{overallPct}% used</Text>
            <Text style={styles.overallStat}>${(overallAmount - overallSpent).toFixed(0)} remaining</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noBudgetCard}>
          <Text style={styles.noBudgetText}>No overall budget set yet. Add a category budget below to get started.</Text>
        </View>
      )}

      {/* Edit Modal Inline */}
      {editItem && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>Edit {editItem.emoji} {editItem.label} Budget</Text>
          <View style={styles.editRow}>
            <Text style={styles.editCurrency}>$</Text>
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
            />
          </View>
          <View style={styles.editBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditItem(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.textInverse} size="small" />
                : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Per-Category Cards */}
      {displayCategories.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>BY CATEGORY</Text>
          {displayCategories.map((cat) => (
            <CategoryBudgetRow key={cat.id} item={cat} onEdit={handleEdit} />
          ))}
        </>
      )}

      {/* Add Category Budget */}
      {availableCategories.length > 0 && (
        showAddForm ? (
          <View style={[styles.editCard, { marginTop: spacing.sm }]}>
            <Text style={styles.editTitle}>Add Category Budget</Text>
            <Text style={styles.label}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {availableCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, newCategoryId === cat.id && styles.catChipActive]}
                  onPress={() => setNewCategoryId(cat.id)}
                >
                  <Text style={styles.catChipText}>{cat.emoji || '📦'} {cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>MONTHLY LIMIT</Text>
            <View style={styles.editRow}>
              <Text style={styles.editCurrency}>$</Text>
              <TextInput
                style={styles.editInput}
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textDisabled}
              />
            </View>
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAddForm(false); setNewCategoryId(null); setNewAmount(''); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddBudget} disabled={addingSaving}>
                {addingSaving
                  ? <ActivityIndicator color={colors.textInverse} size="small" />
                  : <Text style={styles.saveBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setShowAddForm(true); setEditItem(null); }}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add Category Budget</Text>
          </TouchableOpacity>
        )
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  overallCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  noBudgetCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.lg },
  noBudgetText: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' },
  overallLabel: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs },
  overallAmount: { fontSize: 44, fontWeight: typography.weights.bold, color: colors.text },
  overallOf: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.md },
  bigTrack: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
  bigFill: { height: '100%', borderRadius: 5 },
  overallFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  overallStat: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  label: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.xs },
  editCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 2, borderColor: colors.primary,
  },
  editTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: spacing.md },
  editRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  editCurrency: { fontSize: 28, color: colors.textSecondary, fontWeight: typography.weights.bold, marginRight: spacing.sm },
  editInput: { flex: 1, fontSize: 32, fontWeight: typography.weights.bold, color: colors.text, borderBottomWidth: 2, borderColor: colors.primary },
  editBtns: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, paddingVertical: spacing.sm, alignItems: 'center' },
  cancelBtnText: { color: colors.text, fontWeight: typography.weights.semibold },
  saveBtn: { flex: 1, borderRadius: 10, backgroundColor: colors.primary, paddingVertical: spacing.sm, alignItems: 'center' },
  saveBtnText: { color: colors.textInverse, fontWeight: typography.weights.semibold },
  sectionHeader: {
    fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold,
    color: colors.textSecondary, letterSpacing: 1,
    marginBottom: spacing.sm, marginTop: spacing.xs,
  },
  catCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  catEmoji: { fontSize: 26, marginRight: spacing.sm },
  catMeta: { flex: 1 },
  catName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  catAmounts: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  editBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  editBtnText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.semibold },
  track: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
  fill: { height: '100%', borderRadius: 4 },
  catFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  pctText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  remainText: { fontSize: typography.sizes.xs },
  catChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.background, marginRight: spacing.sm,
  },
  catChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  catChipText: { fontSize: typography.sizes.sm, color: colors.text },
  addBtn: {
    marginTop: spacing.sm, borderRadius: 16, borderWidth: 2,
    borderColor: colors.border, borderStyle: 'dashed',
    paddingVertical: spacing.md, alignItems: 'center',
  },
  addBtnText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});

export default DetailedBudget;
