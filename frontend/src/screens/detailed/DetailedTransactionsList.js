import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { transactionService } from '../../services/transactionService';

const FILTER_OPTIONS = ['All', 'Expenses', 'Income'];
const SORT_OPTIONS = ['Newest', 'Oldest', 'Highest', 'Lowest'];

const FILTER_MAP = { All: '', Expenses: 'expense', Income: 'income' };
const SORT_MAP = {
  Newest: 'date_desc',
  Oldest: 'date_asc',
  Highest: 'amount_desc',
  Lowest: 'amount_asc',
};

const PAGE_SIZE = 20;

const CATEGORY_EMOJI = {
  groceries: '🛒', food: '🍕', dining: '🍔', transport: '🚗', transportation: '🚗',
  entertainment: '🎬', health: '💊', utilities: '⚡', shopping: '🛍️',
  income: '💼', salary: '💰', other: '📦',
};

const getTxEmoji = (tx) => {
  const cat = (tx.category_name || tx.category || '').toLowerCase();
  for (const key of Object.keys(CATEGORY_EMOJI)) {
    if (cat.includes(key)) return CATEGORY_EMOJI[key];
  }
  return tx.type === 'income' ? '💰' : '💸';
};

const DetailedTransactionsList = () => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState('Newest');
  const [showSort, setShowSort] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const debounceRef = useRef(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  const fetchTransactions = useCallback(async (pageNum = 1, reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
        sort: SORT_MAP[activeSort],
      };
      const filterVal = FILTER_MAP[activeFilter];
      if (filterVal) params.type = filterVal;
      if (searchRef.current.trim()) params.search = searchRef.current.trim();

      const data = await transactionService.getAll(params);
      const rows = data.transactions || data.data || data || [];
      const meta = data.pagination || {};

      if (reset) {
        setTransactions(rows);
      } else {
        setTransactions((prev) => [...prev, ...rows]);
      }
      setPage(pageNum);
      setHasMore(rows.length === PAGE_SIZE);
      if (data.summary) {
        setTotalExpenses(parseFloat(data.summary.total_expenses || 0));
        setTotalIncome(parseFloat(data.summary.total_income || 0));
      }
      setTotalCount(meta.total || rows.length);
    } catch {
      // silent — keep existing data
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter, activeSort]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchTransactions(1, true);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, activeFilter, activeSort, fetchTransactions]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchTransactions(page + 1, false);
    }
  };

  const renderItem = ({ item: t, index }) => (
    <TouchableOpacity
      style={[styles.txRow, index === 0 && { borderTopWidth: 0 }]}
      activeOpacity={0.7}
    >
      <View style={styles.txIconWrap}>
        <Text style={styles.txEmoji}>{getTxEmoji(t)}</Text>
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txName}>{t.description || t.merchant || 'Transaction'}</Text>
        <Text style={styles.txMeta}>
          {t.category_name || t.category || 'Other'} · {formatDate(new Date(t.transaction_date || t.date))}
          {t.payment_method ? ` · ${t.payment_method}` : ''}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: t.type === 'income' ? colors.success : colors.danger }]}>
        {t.type === 'income' ? '+' : '−'}{formatCurrency(parseFloat(t.amount))}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textDisabled}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort((v) => !v)}>
          <Text style={styles.sortBtnText}>⇅ {activeSort}</Text>
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortOption, activeSort === s && styles.sortOptionActive]}
              onPress={() => { setActiveSort(s); setShowSort(false); }}
            >
              <Text style={[styles.sortOptionText, activeSort === s && styles.sortOptionTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        {FILTER_OPTIONS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryItem}>
          <Text style={{ color: colors.danger }}>↑ {formatCurrency(totalExpenses)}</Text> expenses
        </Text>
        <Text style={styles.summaryItem}>
          <Text style={{ color: colors.success }}>↓ {formatCurrency(totalIncome)}</Text> income
        </Text>
        <Text style={styles.summaryItem}>{totalCount} total</Text>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔎</Text>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} /> : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  searchRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.container, paddingBottom: spacing.xs },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.xs },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.text, paddingVertical: spacing.sm },
  clearBtn: { fontSize: 14, color: colors.textSecondary, padding: 4 },
  sortBtn: {
    backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center',
  },
  sortBtnText: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  sortDropdown: {
    position: 'absolute', top: 64, right: spacing.container, zIndex: 100,
    backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 8,
  },
  sortOption: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  sortOptionActive: { backgroundColor: colors.primaryBg },
  sortOptionText: { fontSize: typography.sizes.sm, color: colors.text },
  sortOptionTextActive: { color: colors.primary, fontWeight: typography.weights.semibold },
  filterBar: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.container, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sizes.sm, color: colors.text },
  chipTextActive: { color: colors.textInverse, fontWeight: typography.weights.semibold },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.container,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryItem: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  listContent: { paddingHorizontal: spacing.container, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: { fontSize: typography.sizes.md, color: colors.textSecondary },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  txIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md, borderWidth: 1, borderColor: colors.borderLight,
  },
  txEmoji: { fontSize: 22 },
  txInfo: { flex: 1 },
  txName: { fontSize: typography.sizes.md, color: colors.text, fontWeight: typography.weights.medium },
  txMeta: { fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: 2 },
  txAmount: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
});

export default DetailedTransactionsList;
