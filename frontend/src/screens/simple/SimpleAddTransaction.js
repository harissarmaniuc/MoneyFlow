import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { CATEGORIES } from '../../utils/constants';
import { transactionService } from '../../services/transactionService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

// Map frontend category slugs to backend default UUIDs (from seed.sql)
const CATEGORY_UUID_MAP = {
  groceries:      '00000000-0000-0000-0000-000000000001',
  dining:         '00000000-0000-0000-0000-000000000002',
  shopping:       '00000000-0000-0000-0000-000000000003',
  transportation: '00000000-0000-0000-0000-000000000004',
  entertainment:  '00000000-0000-0000-0000-000000000005',
  health:         '00000000-0000-0000-0000-000000000006',
  utilities:      '00000000-0000-0000-0000-000000000007',
  other:          '00000000-0000-0000-0000-000000000008',
};

const SimpleAddTransaction = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const canSave = amount && parseFloat(amount) > 0 && category;

  const handleSave = async () => {
    setLoading(true);
    try {
      await transactionService.create({
        amount: parseFloat(amount),
        categoryId: CATEGORY_UUID_MAP[category.id] || null,
        type: 'expense',
        description: category.label,
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setAmount('');
        setCategory(null);
        navigation.navigate('Home');
      }, 1200);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Transaction</Text>

      {/* Amount Input */}
      <View style={styles.amountCard}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textDisabled}
          autoFocus
        />
      </View>

      {/* Category Grid */}
      <Text style={styles.label}>WHAT FOR?</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catItem, category?.id === cat.id && styles.catItemActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catLabel, category?.id === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Save Button */}
      {saved ? (
        <View style={[styles.saveBtn, styles.saveBtnSuccess]}>
          <Text style={styles.saveBtnText}>✓ Saved!</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.saveBtnText}>SAVE</Text>
          }
        </TouchableOpacity>
      )}
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
    marginBottom: spacing.xl,
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  currency: {
    fontSize: 40,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 52,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  catItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  catItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', fontWeight: typography.weights.medium },
  catLabelActive: { color: colors.primary, fontWeight: typography.weights.semibold },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnSuccess: { backgroundColor: colors.success },
  saveBtnText: {
    color: colors.textInverse,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
});

export default SimpleAddTransaction;
