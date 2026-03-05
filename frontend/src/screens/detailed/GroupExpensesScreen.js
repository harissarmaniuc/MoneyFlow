import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { groupExpensesService } from '../../services/groupExpensesService';

const GroupCard = ({ group, onSettle }) => {
  const memberCount = parseInt(group.member_count, 10) || 0;
  const totalOwed = parseFloat(group.total_owed) || 0;
  const totalPaid = parseFloat(group.total_paid) || 0;
  const outstanding = totalOwed - totalPaid;
  const settled = group.status === 'settled';

  return (
    <TouchableOpacity style={styles.groupCard} activeOpacity={0.8}>
      <View style={styles.groupTop}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.title}</Text>
          <Text style={styles.groupMembers}>{memberCount} member{memberCount !== 1 ? 's' : ''}</Text>
        </View>
        {settled ? (
          <View style={styles.settledBadge}>
            <Text style={styles.settledText}>✓ Settled</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        )}
      </View>

      <View style={styles.groupStats}>
        <View style={styles.groupStat}>
          <Text style={styles.groupStatVal}>${parseFloat(group.total_amount).toFixed(2)}</Text>
          <Text style={styles.groupStatLabel}>Total</Text>
        </View>
        <View style={styles.groupDivider} />
        <View style={styles.groupStat}>
          <Text style={styles.groupStatVal}>${totalOwed.toFixed(2)}</Text>
          <Text style={styles.groupStatLabel}>Owed</Text>
        </View>
        <View style={styles.groupDivider} />
        <View style={styles.groupStat}>
          <Text style={[styles.groupStatVal, { color: outstanding > 0 ? colors.danger : colors.success }]}>
            ${outstanding.toFixed(2)}
          </Text>
          <Text style={styles.groupStatLabel}>Outstanding</Text>
        </View>
      </View>

      {!settled && outstanding > 0 && (
        <TouchableOpacity
          style={[styles.settleBtn, { backgroundColor: colors.success }]}
          onPress={() => Alert.alert('Settle Up', `Mark "${group.title}" as fully settled?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settle', onPress: () => onSettle(group.id) },
          ])}
          activeOpacity={0.8}
        >
          <Text style={styles.settleBtnText}>Settle Up — ${outstanding.toFixed(2)} outstanding</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const GroupExpensesScreen = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', totalAmount: '', splitAmount: '' });
  const [saving, setSaving] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      setError(null);
      const data = await groupExpensesService.getAll();
      setGroups(data);
    } catch (e) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleSettle = async (id) => {
    try {
      await groupExpensesService.settle(id);
      fetchGroups();
    } catch {
      Alert.alert('Error', 'Failed to settle group expense');
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.totalAmount) {
      Alert.alert('Error', 'Title and total amount are required');
      return;
    }
    setSaving(true);
    try {
      await groupExpensesService.create({
        title: form.title.trim(),
        totalAmount: parseFloat(form.totalAmount),
        members: [],
      });
      setShowModal(false);
      setForm({ title: '', totalAmount: '', splitAmount: '' });
      fetchGroups();
    } catch {
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setSaving(false);
    }
  };

  const activeGroups = groups.filter((g) => g.status !== 'settled');
  const totalOutstanding = activeGroups.reduce(
    (s, g) => s + Math.max(0, parseFloat(g.total_owed) - parseFloat(g.total_paid)),
    0
  );
  const totalPaid = groups.reduce((s, g) => s + parseFloat(g.total_paid || 0), 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subtitle}>Split expenses with others</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
            <Text style={styles.newBtnText}>+ New Group</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchGroups}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.balanceCard}>
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceVal, { color: colors.danger }]}>
                  ${totalOutstanding.toFixed(2)}
                </Text>
                <Text style={styles.balanceLabel}>Outstanding</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={[styles.balanceVal, { color: colors.success }]}>
                  ${totalPaid.toFixed(2)}
                </Text>
                <Text style={styles.balanceLabel}>Total paid</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceVal}>{groups.length}</Text>
                <Text style={styles.balanceLabel}>Groups</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>YOUR GROUPS</Text>
            {groups.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>No groups yet</Text>
                <Text style={styles.emptyHint}>Create a group to split expenses with friends</Text>
              </View>
            ) : (
              groups.map((group) => (
                <GroupCard key={group.id} group={group} onSettle={handleSettle} />
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Group</Text>

            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
              placeholder="e.g. Weekend Trip"
              placeholderTextColor={colors.textDisabled}
            />

            <Text style={styles.inputLabel}>Total Amount ($)</Text>
            <TextInput
              style={styles.input}
              value={form.totalAmount}
              onChangeText={(v) => setForm((p) => ({ ...p, totalAmount: v }))}
              placeholder="0.00"
              placeholderTextColor={colors.textDisabled}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowModal(false); setForm({ title: '', totalAmount: '', splitAmount: '' }); }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={saving}>
                <Text style={styles.createBtnText}>{saving ? 'Creating...' : 'Create Group'}</Text>
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
  errorBox: { backgroundColor: '#FEF2F2', borderRadius: 12, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  errorText: { color: colors.danger, marginBottom: spacing.xs },
  retryText: { color: colors.primary, fontWeight: typography.weights.semibold },
  balanceCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceVal: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  balanceLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  balanceDivider: { width: 1, backgroundColor: colors.border },
  sectionHeader: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold, color: colors.textSecondary, letterSpacing: 1, marginBottom: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: spacing.xs },
  emptyHint: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center' },
  groupCard: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.md, marginBottom: spacing.md },
  groupTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  groupInfo: { flex: 1, marginRight: spacing.sm },
  groupName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
  groupMembers: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  settledBadge: { backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: '#BBF7D0' },
  settledText: { fontSize: typography.sizes.xs, color: colors.success, fontWeight: typography.weights.semibold },
  statusBadge: { backgroundColor: colors.primaryBg, borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: '#BFDBFE' },
  statusText: { fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.semibold },
  groupStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  groupStat: { flex: 1, alignItems: 'center' },
  groupStatVal: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text },
  groupStatLabel: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  groupDivider: { width: 1, backgroundColor: colors.border },
  settleBtn: { borderRadius: 12, paddingVertical: spacing.sm, alignItems: 'center' },
  settleBtnText: { color: colors.textInverse, fontWeight: typography.weights.semibold, fontSize: typography.sizes.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xxl },
  modalTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginBottom: spacing.lg },
  inputLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: typography.sizes.md, color: colors.text,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  modalBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border },
  cancelBtnText: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },
  createBtn: { flex: 1, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', backgroundColor: colors.primary },
  createBtnText: { fontSize: typography.sizes.md, color: colors.textInverse, fontWeight: typography.weights.bold },
});

export default GroupExpensesScreen;
