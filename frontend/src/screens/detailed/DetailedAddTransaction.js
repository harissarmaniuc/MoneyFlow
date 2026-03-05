import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PAYMENT_METHODS } from '../../utils/constants';
import { categoryService } from '../../services/categoryService';
import { transactionService } from '../../services/transactionService';
import { receiptService } from '../../services/receiptService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const TYPE_OPTIONS = [
  { id: 'expense', label: 'Expense', color: colors.danger },
  { id: 'income', label: 'Income', color: colors.success },
  { id: 'transfer', label: 'Transfer', color: colors.primary },
];

const DetailedAddTransaction = ({ navigation }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(null);
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]?.id || 'cash');
  const [isRecurring, setIsRecurring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    categoryService.getAll()
      .then((data) => setCategories(data))
      .catch(() => {/* silently fall back to empty */})
      .finally(() => setCategoriesLoading(false));
  }, []);

  const handleScanReceipt = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to scan receipts');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled) return;

    setScanning(true);
    try {
      const extracted = await receiptService.scanReceipt(result.assets[0].uri);
      if (extracted.amount) setAmount(String(extracted.amount));
      if (extracted.merchant) setMerchant(extracted.merchant);
      if (extracted.amount || extracted.merchant) {
        Alert.alert(
          'Receipt Scanned',
          `Extracted: ${extracted.merchant ? `"${extracted.merchant}"` : ''} ${extracted.amount ? `$${extracted.amount}` : ''}\n\nPlease verify and select a category.`
        );
      } else {
        Alert.alert('Could not extract data', 'No amount or merchant found. Please fill in manually.');
      }
    } catch (err) {
      Alert.alert('Scan Failed', err?.response?.data?.error || 'Could not process receipt');
    } finally {
      setScanning(false);
    }
  };

  const canSave = amount && parseFloat(amount) > 0 && category;

  const handleSave = async () => {
    setLoading(true);
    try {
      await transactionService.create({
        type,
        amount: parseFloat(amount),
        categoryId: category.id,
        merchantName: merchant.trim() || undefined,
        description: notes.trim() || undefined,
        paymentMethod,
        isRecurring,
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setAmount('');
        setCategory(null);
        setMerchant('');
        setNotes('');
        setIsRecurring(false);
        if (navigation?.canGoBack()) navigation.goBack();
      }, 1000);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error || err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by type — income categories for income, expense categories for expense/transfer
  const filteredCategories = categories.filter((c) =>
    type === 'income' ? c.isIncome === true : c.isIncome !== true
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Add Transaction</Text>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={handleScanReceipt}
          disabled={scanning}
          activeOpacity={0.8}
        >
          {scanning
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={styles.scanBtnText}>📷 Scan Receipt</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Type Toggle */}
      <View style={styles.typeRow}>
        {TYPE_OPTIONS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.typeBtn, type === t.id && { backgroundColor: t.color }]}
            onPress={() => { setType(t.id); setCategory(null); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.typeBtnText, type === t.id && { color: colors.textInverse }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount */}
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
      <Text style={styles.label}>CATEGORY</Text>
      {categoriesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />
      ) : (
        <View style={styles.grid}>
          {filteredCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catItem, category?.id === cat.id && styles.catItemActive]}
              onPress={() => setCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={styles.catEmoji}>{cat.emoji || '📦'}</Text>
              <Text style={[styles.catLabel, category?.id === cat.id && styles.catLabelActive]} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Merchant */}
      <Text style={styles.label}>MERCHANT / PAYEE</Text>
      <TextInput
        style={styles.input}
        value={merchant}
        onChangeText={setMerchant}
        placeholder="e.g. Whole Foods, Netflix..."
        placeholderTextColor={colors.textDisabled}
      />

      {/* Payment Method */}
      <Text style={styles.label}>PAYMENT METHOD</Text>
      <View style={styles.methodRow}>
        {PAYMENT_METHODS.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodBtn, paymentMethod === m.id && styles.methodBtnActive]}
            onPress={() => setPaymentMethod(m.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.methodText, paymentMethod === m.id && styles.methodTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes */}
      <Text style={styles.label}>NOTES</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional note..."
        placeholderTextColor={colors.textDisabled}
        multiline
        numberOfLines={3}
      />

      {/* Recurring Toggle */}
      <View style={styles.recurringRow}>
        <View>
          <Text style={styles.recurringLabel}>Recurring Transaction</Text>
          <Text style={styles.recurringDesc}>Add this to subscriptions automatically</Text>
        </View>
        <Switch
          value={isRecurring}
          onValueChange={setIsRecurring}
          trackColor={{ true: colors.primary }}
          thumbColor={colors.textInverse}
        />
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
            : <Text style={styles.saveBtnText}>SAVE TRANSACTION</Text>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  scanBtn: {
    backgroundColor: colors.primaryBg, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderWidth: 1.5, borderColor: colors.primary, minWidth: 44, minHeight: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.semibold },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  typeBtn: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.surface,
  },
  typeBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  amountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 20,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  currency: { fontSize: 36, fontWeight: typography.weights.bold, color: colors.textSecondary, marginRight: spacing.sm },
  amountInput: { flex: 1, fontSize: 48, fontWeight: typography.weights.bold, color: colors.text },
  label: {
    fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold,
    color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  catItem: {
    width: '22%', aspectRatio: 1, borderRadius: 16, borderWidth: 2,
    borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  catItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  catEmoji: { fontSize: 24 },
  catLabel: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', fontWeight: typography.weights.medium },
  catLabelActive: { color: colors.primary, fontWeight: typography.weights.semibold },
  input: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2, fontSize: typography.sizes.md,
    color: colors.text, marginBottom: spacing.lg,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  methodBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodText: { fontSize: typography.sizes.sm, color: colors.text },
  methodTextActive: { color: colors.textInverse, fontWeight: typography.weights.semibold },
  recurringRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  recurringLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  recurringDesc: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 16,
    paddingVertical: spacing.md, alignItems: 'center',
    minHeight: 56, justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.35 },
  saveBtnSuccess: { backgroundColor: colors.success },
  saveBtnText: { color: colors.textInverse, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, letterSpacing: 1 },
});

export default DetailedAddTransaction;
