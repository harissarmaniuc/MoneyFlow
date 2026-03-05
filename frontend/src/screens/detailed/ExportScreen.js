import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert,
} from 'react-native';
import { exportsService } from '../../services/exportsService';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const FORMAT_OPTIONS = [
  { id: 'csv', label: 'CSV', desc: 'Spreadsheet compatible (Excel, Google Sheets)', icon: '📊' },
  { id: 'pdf', label: 'PDF', desc: 'Formatted report with charts', icon: '📄' },
  { id: 'json', label: 'JSON', desc: 'Raw data for developers', icon: '📦' },
];

const PERIOD_OPTIONS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3m', label: 'Last 3 Months' },
  { id: 'last_6m', label: 'Last 6 Months' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Time' },
];

const INCLUDE_OPTIONS = [
  { id: 'transactions', label: 'Transactions', default: true },
  { id: 'budgets', label: 'Budgets', default: true },
  { id: 'goals', label: 'Goals', default: false },
  { id: 'subscriptions', label: 'Subscriptions', default: false },
  { id: 'analytics', label: 'Analytics Summary', default: true },
];

const ExportScreen = () => {
  const [format, setFormat] = useState('csv');
  const [period, setPeriod] = useState('this_month');
  const [included, setIncluded] = useState(
    INCLUDE_OPTIONS.filter((o) => o.default).map((o) => o.id)
  );
  const [loading, setLoading] = useState(false);

  const toggleInclude = (id) =>
    setIncluded((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleExport = async () => {
    if (included.length === 0) {
      Alert.alert('Error', 'Please select at least one data type to export');
      return;
    }
    setLoading(true);
    try {
      const backendFormat = format === 'json' ? 'excel' : format;
      await exportsService.exportData(backendFormat, { period, include: included });
      Alert.alert(
        'Export Queued',
        `Your ${format.toUpperCase()} export has been queued. You'll be notified when it's ready.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Export Failed', err?.response?.data?.error || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Export Data</Text>
      <Text style={styles.subtitle}>Download your financial data</Text>

      {/* Format Selection */}
      <Text style={styles.sectionHeader}>FORMAT</Text>
      {FORMAT_OPTIONS.map((f) => (
        <TouchableOpacity
          key={f.id}
          style={[styles.optionCard, format === f.id && styles.optionCardActive]}
          onPress={() => setFormat(f.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.optionIcon}>{f.icon}</Text>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionLabel, format === f.id && styles.optionLabelActive]}>{f.label}</Text>
            <Text style={styles.optionDesc}>{f.desc}</Text>
          </View>
          <View style={[styles.radio, format === f.id && styles.radioActive]}>
            {format === f.id && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      {/* Period Selection */}
      <Text style={styles.sectionHeader}>DATE RANGE</Text>
      <View style={styles.periodGrid}>
        {PERIOD_OPTIONS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.periodBtn, period === p.id && styles.periodBtnActive]}
            onPress={() => setPeriod(p.id)}
          >
            <Text style={[styles.periodText, period === p.id && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Include Checkboxes */}
      <Text style={styles.sectionHeader}>INCLUDE</Text>
      <View style={styles.checkGroup}>
        {INCLUDE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={styles.checkRow}
            onPress={() => toggleInclude(opt.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, included.includes(opt.id) && styles.checkboxActive]}>
              {included.includes(opt.id) && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Export Button */}
      <TouchableOpacity
        style={[styles.exportBtn, loading && styles.exportBtnLoading]}
        onPress={handleExport}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.exportBtnText}>
          {loading ? 'Preparing Export...' : `Export as ${format.toUpperCase()} →`}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        Your data is exported securely and never shared with third parties.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.container, paddingBottom: spacing.xxl },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg },
  sectionHeader: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 2, borderColor: colors.border,
  },
  optionCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  optionIcon: { fontSize: 26, marginRight: spacing.md },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  optionLabelActive: { color: colors.primary },
  optionDesc: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  periodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  periodBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  periodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  periodText: { fontSize: typography.sizes.sm, color: colors.text },
  periodTextActive: { color: colors.textInverse, fontWeight: typography.weights.semibold },
  checkGroup: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, gap: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.textInverse, fontSize: 13, fontWeight: typography.weights.bold },
  checkLabel: { fontSize: typography.sizes.md, color: colors.text },
  exportBtn: {
    marginTop: spacing.xl, backgroundColor: colors.primary, borderRadius: 16,
    paddingVertical: spacing.md, alignItems: 'center', minHeight: 56, justifyContent: 'center',
  },
  exportBtnLoading: { opacity: 0.7 },
  exportBtnText: { color: colors.textInverse, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, letterSpacing: 0.5 },
  hint: { fontSize: typography.sizes.xs, color: colors.textDisabled, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
});

export default ExportScreen;
