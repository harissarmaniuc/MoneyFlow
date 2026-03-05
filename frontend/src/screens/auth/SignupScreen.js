import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { USER_TYPES, LANGUAGES } from '../../utils/constants';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const TOTAL_STEPS = 5;

const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Step 3
  const [mode, setMode] = useState('simple');

  // Step 4
  const [fontSize, setFontSize] = useState(14);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Step 5
  const [language, setLanguage] = useState('en');
  const [monthlyBudget, setMonthlyBudget] = useState('');

  const toggleUserType = (id) =>
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const validateStep = () => {
    if (step === 1) {
      if (!name.trim()) { Alert.alert('Error', 'Please enter your name'); return false; }
      if (!/\S+@\S+\.\S+/.test(email)) { Alert.alert('Error', 'Please enter a valid email'); return false; }
      if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return false; }
      if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register({
        fullName: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        preferredMode: mode,
        userTypes: selectedTypes,
        language,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
        accessibilitySettings: { fontSize, darkMode, highContrast, screenReader: false, voiceInput: false },
      });
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const ProgressDots = () => (
    <View style={styles.progressRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Create Account</Text>
            <Text style={styles.stepSub}>Let's get you started</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Sarah Johnson" placeholderTextColor={colors.textDisabled} />
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="sarah@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textDisabled} />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Min 8 characters" secureTextEntry placeholderTextColor={colors.textDisabled} />
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry placeholderTextColor={colors.textDisabled} />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>What's Your Situation?</Text>
            <Text style={styles.stepSub}>Choose all that apply — or skip</Text>
            {USER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.checkItem, selectedTypes.includes(type.id) && styles.checkItemActive]}
                onPress={() => toggleUserType(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, selectedTypes.includes(type.id) && styles.checkboxActive]}>
                  {selectedTypes.includes(type.id) && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkLabel, selectedTypes.includes(type.id) && styles.checkLabelActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>How Detailed?</Text>
            <Text style={styles.stepSub}>You can change this anytime in Settings</Text>
            {[
              { id: 'simple', emoji: '📱', name: 'Simple Mode', desc: 'See the essentials only. Fewer options, less to think about. Perfect for quick tracking.' },
              { id: 'detailed', emoji: '📊', name: 'Detailed Mode', desc: 'Track everything precisely. Charts, analytics, goals, and full control over your finances.' },
            ].map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeCard, mode === m.id && styles.modeCardActive]}
                onPress={() => setMode(m.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.modeEmoji}>{m.emoji}</Text>
                <Text style={styles.modeName}>{m.name}</Text>
                <Text style={styles.modeDesc}>{m.desc}</Text>
                {mode === m.id && <Text style={styles.modeSelected}>✓ Selected</Text>}
              </TouchableOpacity>
            ))}
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Accessibility</Text>
            <Text style={styles.stepSub}>Customize the app for your needs</Text>
            <View style={styles.fontSection}>
              <Text style={styles.label}>Font Size: {fontSize}pt</Text>
              <Text style={{ fontSize, color: colors.textSecondary, marginVertical: spacing.xs }}>
                Sample text preview
              </Text>
              <View style={styles.fontButtons}>
                <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize((s) => Math.max(12, s - 2))}>
                  <Text style={styles.fontBtnText}>A−</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fontBtn} onPress={() => setFontSize((s) => Math.min(24, s + 2))}>
                  <Text style={styles.fontBtnText}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>
            {[
              { label: 'Dark Mode', value: darkMode, onChange: setDarkMode },
              { label: 'High Contrast', value: highContrast, onChange: setHighContrast },
            ].map((row) => (
              <View key={row.label} style={styles.toggleRow}>
                <Text style={styles.label}>{row.label}</Text>
                <Switch value={row.value} onValueChange={row.onChange} trackColor={{ true: colors.primary }} thumbColor={colors.textInverse} />
              </View>
            ))}
          </>
        );

      case 5:
        return (
          <>
            <Text style={styles.stepTitle}>Almost Done!</Text>
            <Text style={styles.stepSub}>Last few details</Text>
            <Text style={styles.label}>Language</Text>
            <View style={styles.langGrid}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[styles.langBtn, language === lang.id && styles.langBtnActive]}
                  onPress={() => setLanguage(lang.id)}
                >
                  <Text style={[styles.langText, language === lang.id && styles.langTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Monthly Budget (optional)</Text>
            <TextInput
              style={styles.input}
              value={monthlyBudget}
              onChangeText={setMonthlyBudget}
              placeholder="e.g. 1500"
              keyboardType="numeric"
              placeholderTextColor={colors.textDisabled}
            />
            <Text style={styles.hint}>You can set per-category budgets later in the app</Text>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
        <ProgressDots />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.button} onPress={next} activeOpacity={0.8}>
            <Text style={styles.buttonText}>NEXT →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.buttonText}>GET STARTED 🚀</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.container,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.primary, fontSize: typography.sizes.md },
  stepLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', gap: spacing.xs },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  body: { padding: spacing.container, paddingBottom: spacing.xxl, gap: spacing.md },
  stepTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
  stepSub: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  checkItemActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.textInverse, fontSize: 13, fontWeight: typography.weights.bold },
  checkLabel: { flex: 1, fontSize: typography.sizes.md, color: colors.text },
  checkLabelActive: { color: colors.primary, fontWeight: typography.weights.semibold },
  modeCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  modeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  modeEmoji: { fontSize: 32 },
  modeName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  modeDesc: { fontSize: typography.sizes.sm, color: colors.textSecondary, lineHeight: 20 },
  modeSelected: { color: colors.primary, fontWeight: typography.weights.semibold, marginTop: spacing.xs },
  fontSection: { gap: spacing.xs },
  fontButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  fontBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  fontBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  langBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { fontSize: typography.sizes.sm, color: colors.text },
  langTextActive: { color: colors.textInverse, fontWeight: typography.weights.semibold },
  hint: { fontSize: typography.sizes.xs, color: colors.textSecondary, fontStyle: 'italic' },
  footer: {
    padding: spacing.container,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.textInverse, fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
});

export default SignupScreen;
