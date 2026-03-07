import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationItem, RecommendationStatusFilter } from '@/features/recommendation/types';

const PAGE_SIZE = 8;
const FILTER_OPTIONS: { key: RecommendationStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'suitable', label: 'Suitable' },
  { key: 'not_suitable', label: 'Not Suitable' },
  { key: 'unevaluated', label: 'Chua danh gia' },
];

const DEFAULT_CATEGORY_OPTIONS = [{ key: 'all', label: 'Loai nguyen lieu: All' }];

export default function RecommendationScreen() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<RecommendationStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categoryOptions, setCategoryOptions] = useState<{ key: string; label: string }[]>(DEFAULT_CATEGORY_OPTIONS);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [scoreMinInput, setScoreMinInput] = useState('');
  const [scoreMaxInput, setScoreMaxInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedScoreMin, setAppliedScoreMin] = useState<number | undefined>(undefined);
  const [appliedScoreMax, setAppliedScoreMax] = useState<number | undefined>(undefined);

  const formatCategoryLabel = (value: string) => {
    if (!value) return 'Other';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const selectedCount = useMemo(
    () => Object.values(selectedMap).reduce((sum, qty) => sum + qty, 0),
    [selectedMap]
  );

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (appliedSearch) count += 1;
    if (appliedScoreMin !== undefined || appliedScoreMax !== undefined) count += 1;
    if (statusFilter !== 'all') count += 1;
    if (categoryFilter !== 'all') count += 1;
    return count;
  }, [appliedSearch, appliedScoreMin, appliedScoreMax, statusFilter, categoryFilter]);

  const fetchPage = useCallback(async (
    targetPage: number,
    append: boolean,
    filter: RecommendationStatusFilter,
    category: string,
    scoreMin?: number,
    scoreMax?: number,
    searchKeyword?: string
  ) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const data = await recommendationService.getRecommendations(
        targetPage,
        PAGE_SIZE,
        filter,
        category,
        'all',
        scoreMin,
        scoreMax,
        searchKeyword
      );
      setItems(prev => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasNext(data.hasNext);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      if (!append) setItems([]);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const data = await recommendationService.getFilterOptions();
        const dynamicOptions = (data.ingredientCategories ?? []).map(category => ({
          key: category,
          label: formatCategoryLabel(category),
        }));
        setCategoryOptions([...DEFAULT_CATEGORY_OPTIONS, ...dynamicOptions]);
      } catch (error) {
        console.error('Failed to load recommendation filter options:', error);
        setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
      }
    };

    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchPage(0, false, statusFilter, categoryFilter, appliedScoreMin, appliedScoreMax, appliedSearch);
  }, [fetchPage, statusFilter, categoryFilter, appliedScoreMin, appliedScoreMax, appliedSearch]);

  const handleAdd = (recipeId: string) => {
    setSelectedMap(prev => ({ ...prev, [recipeId]: (prev[recipeId] ?? 0) + 1 }));
  };

  const handleRemove = (recipeId: string) => {
    setSelectedMap(prev => {
      const current = prev[recipeId] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[recipeId];
        return next;
      }
      return { ...prev, [recipeId]: current - 1 };
    });
  };

  const handleOrderNow = () => {
    Alert.alert('Dat ngay', `Ban da chon ${selectedCount} mon.`, [
      { text: 'Huy', style: 'cancel' },
      {
        text: 'Xac nhan',
        onPress: () => setSelectedMap({}),
      },
    ]);
  };

  const handleFilterChange = (filter: RecommendationStatusFilter) => {
    if (filter === statusFilter) return;
    setStatusFilter(filter);
  };

  const handleCategoryChange = (category: string) => {
    if (category === categoryFilter) return;
    setCategoryFilter(category);
  };

  const parseScoreInput = (value: string): number | undefined => {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return undefined;
    return Math.max(0, Math.min(100, Math.trunc(parsed)));
  };

  const applyAdvancedFilters = () => {
    setAppliedSearch(searchInput.trim());
    setAppliedScoreMin(parseScoreInput(scoreMinInput));
    setAppliedScoreMax(parseScoreInput(scoreMaxInput));
  };

  const resetAdvancedFilters = () => {
    setSearchInput('');
    setScoreMinInput('');
    setScoreMaxInput('');
    setAppliedSearch('');
    setAppliedScoreMin(undefined);
    setAppliedScoreMax(undefined);
  };

  const renderItem = ({ item }: { item: RecommendationItem }) => {
    const quantity = selectedMap[item.recipeId] ?? 0;
    const label = !item.evaluated ? 'Chua danh gia' : item.suitable ? 'Suitable' : 'Not Suitable';
    const badgeStyle = !item.evaluated ? styles.badgePending : item.suitable ? styles.badgeOk : styles.badgeNo;
    const badgeTextStyle = !item.evaluated ? styles.badgeTextPending : item.suitable ? styles.badgeTextOk : styles.badgeTextNo;

    return (
      <ThemedView style={styles.card}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="restaurant-outline" size={24} color="#C1766B" />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.name} numberOfLines={1}>{item.recipeName}</ThemedText>
            <View style={[styles.badge, badgeStyle]}>
              <ThemedText style={[styles.badgeText, badgeTextStyle]}>{label}</ThemedText>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <ThemedText style={styles.score}>{item.evaluated ? `${item.score}/100` : '--/100'}</ThemedText>
          </View>
        </View>

        <View style={styles.actionGroup}>
          <Pressable style={[styles.actionBtn, quantity <= 0 && styles.actionBtnDisabled]} onPress={() => handleRemove(item.recipeId)} disabled={quantity <= 0}>
            <Ionicons name="remove" size={16} color="#C1766B" />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleAdd(item.recipeId)}>
            <Ionicons name="add" size={16} color="#C1766B" />
          </Pressable>
        </View>

        {quantity > 0 ? (
          <View style={styles.qtyBubble}>
            <ThemedText style={styles.qtyText}>{quantity}</ThemedText>
          </View>
        ) : null}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Recommendation</ThemedText>
        <ThemedText style={styles.subtitle}>Danh sach mon phu hop cho ban</ThemedText>
        <Pressable style={styles.filterToggleBtn} onPress={() => setShowFilterPanel(prev => !prev)}>
          <View style={styles.filterToggleLeft}>
            <Ionicons name="options-outline" size={16} color="#8F4D44" />
            <ThemedText style={styles.filterToggleText}>Tim & loc</ThemedText>
          </View>
          <View style={styles.filterToggleRight}>
            {activeAdvancedFilterCount > 0 ? (
              <View style={styles.filterActiveCount}>
                <ThemedText style={styles.filterActiveCountText}>{activeAdvancedFilterCount}</ThemedText>
              </View>
            ) : null}
            <Ionicons
              name={showFilterPanel ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={18}
              color="#8F4D44"
            />
          </View>
        </Pressable>

        {showFilterPanel ? (
          <View style={styles.filterPanel}>
            <View style={styles.filterRow}>
              {FILTER_OPTIONS.map(option => {
                const active = option.key === statusFilter;
                return (
                  <Pressable
                    key={option.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => handleFilterChange(option.key)}
                  >
                    <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.filterRow}>
              {categoryOptions.map(option => {
                const active = option.key === categoryFilter;
                return (
                  <Pressable
                    key={option.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => handleCategoryChange(option.key)}
                  >
                    <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option.label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color="#8F4D44" />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={applyAdvancedFilters}
                placeholder="Tim theo ten mon"
                placeholderTextColor="#B28B85"
                style={styles.searchInput}
                returnKeyType="search"
              />
              {searchInput ? (
                <Pressable onPress={() => setSearchInput('')}>
                  <Ionicons name="close-circle" size={18} color="#C1766B" />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.advancedFilterRow}>
              <TextInput
                value={scoreMinInput}
                onChangeText={setScoreMinInput}
                keyboardType="number-pad"
                placeholder="Score min"
                placeholderTextColor="#B28B85"
                style={styles.scoreInput}
              />
              <TextInput
                value={scoreMaxInput}
                onChangeText={setScoreMaxInput}
                keyboardType="number-pad"
                placeholder="Score max"
                placeholderTextColor="#B28B85"
                style={styles.scoreInput}
              />
              <Pressable style={styles.applyBtn} onPress={applyAdvancedFilters}>
                <ThemedText style={styles.applyBtnText}>Ap dung</ThemedText>
              </Pressable>
              <Pressable style={styles.resetBtn} onPress={resetAdvancedFilters}>
                <ThemedText style={styles.resetBtnText}>Xoa</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.recipeId}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, selectedCount > 0 && { paddingBottom: 110 }]}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color="#C1766B" />
              <ThemedText style={styles.emptyTitle}>Chua co mon de xuat</ThemedText>
              <ThemedText style={styles.emptyText}>Ban hay chay danh gia lai de lay du lieu recommendation.</ThemedText>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasNext ? (
            <Pressable
              style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
              onPress={() => fetchPage(page + 1, true, statusFilter, categoryFilter, appliedScoreMin, appliedScoreMax, appliedSearch)}
              disabled={loadingMore}
            >
              <ThemedText style={styles.loadMoreText}>{loadingMore ? 'Dang tai...' : 'Xem them'}</ThemedText>
            </Pressable>
          ) : <View style={{ height: 20 }} />
        }
      />

      {selectedCount > 0 ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <View style={styles.bottomCountBadge}>
              <Ionicons name="basket-outline" size={14} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.bottomText}>Ban da chon {selectedCount} mon</ThemedText>
          </View>
          <Pressable style={styles.orderBtn} onPress={handleOrderNow}>
            <ThemedText style={styles.orderBtnText}>Dat ngay</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 12,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.7,
  },
  filterToggleBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3C5C0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8F4D44',
  },
  filterToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterActiveCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 999,
    backgroundColor: '#C1766B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActiveCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  filterPanel: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    backgroundColor: '#FFFDFC',
  },
  searchRow: {
    marginTop: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#E3C5C0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#7E3F38',
    paddingVertical: 0,
  },
  advancedFilterRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#E3C5C0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    color: '#7E3F38',
    fontSize: 13,
  },
  applyBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: '#A75A50',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3C5C0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: '#8F4D44',
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E3C5C0',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#C1766B',
    borderColor: '#C1766B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8F4D44',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    position: 'relative',
    shadowColor: '#C1766B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 68,
    height: 68,
    borderRadius: 10,
  },
  imageFallback: {
    backgroundColor: '#F8ECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOk: {
    backgroundColor: '#ECFDF3',
    borderColor: '#86EFAC',
  },
  badgeNo: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  badgePending: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextOk: {
    color: '#15803D',
  },
  badgeTextNo: {
    color: '#B91C1C',
  },
  badgeTextPending: {
    color: '#4B5563',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionGroup: {
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C1766B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  qtyBubble: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#C1766B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.65,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  loadMoreBtn: {
    marginTop: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
  },
  loadMoreBtnDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: '#EA580C',
    fontWeight: '700',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#E2A39A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#C1766B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    color: '#7E3F38',
    fontWeight: '700',
    fontSize: 13,
  },
  orderBtn: {
    backgroundColor: '#A75A50',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  orderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
