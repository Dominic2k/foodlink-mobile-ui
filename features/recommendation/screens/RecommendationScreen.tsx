import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { useRecommendationRefresh } from '@/features/recommendation/context/RecommendationRefreshContext';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationEvaluationStatus, RecommendationItem, RecommendationStatusFilter } from '@/features/recommendation/types';

const PAGE_SIZE = 8;
const FILTER_OPTIONS: { key: RecommendationStatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'suitable', label: 'Phù hợp' },
  { key: 'not_suitable', label: 'Không phù hợp' },
  { key: 'unevaluated', label: 'Chưa đánh giá' },
];

const DEFAULT_CATEGORY_OPTIONS = [{ key: 'all', label: 'Loại nguyên liệu: Tất cả' }];

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
  const [openSelector, setOpenSelector] = useState<'status' | 'category' | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [scoreMinInput, setScoreMinInput] = useState('');
  const [scoreMaxInput, setScoreMaxInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedScoreMin, setAppliedScoreMin] = useState<number | undefined>(undefined);
  const [appliedScoreMax, setAppliedScoreMax] = useState<number | undefined>(undefined);
  const [evaluationStatus, setEvaluationStatus] = useState<RecommendationEvaluationStatus>('idle');
  const { needsRecommendationRefresh, clearRecommendationRefreshNeeded } = useRecommendationRefresh();

  const formatCategoryLabel = (value: string) => {
    if (!value) return 'Other';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== 'number') return null;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const selectedStatusLabel = FILTER_OPTIONS.find(option => option.key === statusFilter)?.label ?? 'Tất cả';
  const selectedCategoryLabel = categoryOptions.find(option => option.key === categoryFilter)?.label ?? 'Loại nguyên liệu: Tất cả';

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
        const ingredientOpts = (data.ingredientCategories ?? []).map(cat => ({
          key: cat,
          label: `Nhóm nguyên liệu: ${formatCategoryLabel(cat)}`,
        }));
        const dishOpts = (data.dishCategories ?? []).map(cat => ({
          key: cat,
          label: `Loại món: ${cat}`,
        }));
        setCategoryOptions([...DEFAULT_CATEGORY_OPTIONS, ...dishOpts, ...ingredientOpts]);
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

  useFocusEffect(
    useCallback(() => {
      if (!needsRecommendationRefresh) {
        return undefined;
      }

      let isActive = true;
      let intervalId: ReturnType<typeof setInterval> | undefined;

      const checkEvaluationStatus = async () => {
        try {
          const statusRes = await recommendationService.getEvaluationStatus();
          if (!isActive) return;

          setEvaluationStatus(statusRes.status);

          if (statusRes.status === 'queued' || statusRes.status === 'processing') {
            return;
          }

          await fetchPage(0, false, statusFilter, categoryFilter, appliedScoreMin, appliedScoreMax, appliedSearch);
          clearRecommendationRefreshNeeded();
        } catch (error) {
          console.error('Failed to check recommendation evaluation status:', error);
        }
      };

      checkEvaluationStatus();
      intervalId = setInterval(checkEvaluationStatus, 3000);

      return () => {
        isActive = false;
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [
      needsRecommendationRefresh,
      clearRecommendationRefreshNeeded,
      fetchPage,
      statusFilter,
      categoryFilter,
      appliedScoreMin,
      appliedScoreMax,
      appliedSearch,
    ])
  );

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
    // Map record<recipeId, qty> to an array of objects
    const selections = Object.entries(selectedMap).map(([recipeId, quantity]) => ({
      recipeId,
      quantity,
    }));

    router.push({
      pathname: '/checkout',
      params: { selections: JSON.stringify(selections) },
    });
    // Optional: clear selected items on navigate
    // setSelectedMap({});
  };

  const handleFilterChange = (filter: RecommendationStatusFilter) => {
    if (filter === statusFilter) return;
    setStatusFilter(filter);
    setOpenSelector(null);
  };

  const handleCategoryChange = (category: string) => {
    if (category === categoryFilter) return;
    setCategoryFilter(category);
    setOpenSelector(null);
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

  const handleOpenDetail = (recipeId: string) => {
    router.push({
      pathname: '/recommendation-detail',
      params: { recipeId, returnTo: 'recommendation' },
    });
  };

  const renderItem = ({ item }: { item: RecommendationItem }) => {
    const quantity = selectedMap[item.recipeId] ?? 0;
    const label = !item.evaluated ? 'Chưa đánh giá' : item.suitable ? 'Phù hợp' : 'Không phù hợp';

    const getScoreColor = (score: number): [string, string] => {
      if (score >= 80) return ['#22C55E', '#16A34A']; // Green
      if (score >= 60) return ['#F59E0B', '#D97706']; // Orange
      return ['#EF4444', '#DC2626']; // Red
    };

    const getBadgeStyles = () => {
      if (!item.evaluated) return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
      if (item.suitable) return { bg: '#ECFDF5', text: '#065F46', border: 'rgba(16, 185, 129, 0.3)' };
      return { bg: '#FEF2F2', text: '#991B1B', border: 'rgba(239, 68, 68, 0.3)' };
    };

    const badgeStyles = getBadgeStyles();
    const scoreColor = item.evaluated ? (item.score >= 80 ? '#059669' : item.score >= 60 ? '#D97706' : '#DC2626') : '#9CA3AF';
    const scoreBg = item.evaluated ? (item.score >= 80 ? '#F0FDF4' : item.score >= 60 ? '#FFFBEB' : '#FEF2F2') : '#F9FAFB';
    const scoreBorder = item.evaluated ? (item.score >= 80 ? 'rgba(34, 197, 94, 0.2)' : item.score >= 60 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'rgba(0,0,0,0.05)';

    return (
      <Pressable onPress={() => handleOpenDetail(item.recipeId)}>
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
              <View 
                style={[
                  styles.luxuryBadge, 
                  { backgroundColor: badgeStyles.bg, borderColor: badgeStyles.border }
                ]}
              >
                <View style={styles.badgeContent}>
                  {item.evaluated && (
                    <Ionicons 
                      name={item.suitable ? "checkmark-circle" : "close-circle"} 
                      size={12} 
                      color={badgeStyles.text} 
                      style={{ marginRight: 4 }} 
                    />
                  )}
                  <ThemedText style={[styles.luxuryBadgeText, { color: badgeStyles.text }]}>
                    {label}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View 
                style={[
                  styles.luxuryScorePill, 
                  { backgroundColor: scoreBg, borderColor: scoreBorder }
                ]}
              >
                <Ionicons name="flash" size={10} color={scoreColor} style={{ marginRight: 3 }} />
                <ThemedText style={[styles.luxuryScoreText, { color: scoreColor }]}>
                  {item.evaluated ? `${item.score}/100` : '--/100'}
                </ThemedText>
              </View>

              {item.pricePerServing != null ? (
                <View style={styles.luxuryPricePill}>
                  <Ionicons name="pricetag" size={12} color="#8F4D44" />
                  <ThemedText style={styles.luxuryPriceText}>{formatCurrency(item.pricePerServing)}</ThemedText>
                </View>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {item.dishCategories && item.dishCategories.map(cat => (
                <View key={cat} style={styles.premiumChip}>
                  <ThemedText style={styles.premiumChipText}>{cat}</ThemedText>
                </View>
              ))}
              {item.category && item.category !== 'other' ? (
                <View style={[styles.premiumChip, { backgroundColor: '#F8ECEA' }]}>
                  <ThemedText style={[styles.premiumChipText, { color: '#8F4D44' }]}>{formatCategoryLabel(item.category)}</ThemedText>
                </View>
              ) : null}
            </ScrollView>
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
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Gợi ý món ăn</ThemedText>
        <ThemedText style={styles.subtitle}>Danh sách món phù hợp cho bạn</ThemedText>
        {needsRecommendationRefresh && (evaluationStatus === 'queued' || evaluationStatus === 'processing') ? (
          <View style={styles.statusNotice}>
            <Ionicons name="sync-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.statusNoticeText}>Đang cập nhật gợi ý theo thông tin gia đình mới...</ThemedText>
          </View>
        ) : null}
        <Pressable style={styles.filterToggleBtn} onPress={() => setShowFilterPanel(prev => !prev)}>
          <View style={styles.filterToggleLeft}>
            <Ionicons name="options-outline" size={16} color="#8F4D44" />
            <ThemedText style={styles.filterToggleText}>Tìm & lọc</ThemedText>
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
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterSectionLabel}>Trạng thái đánh giá</ThemedText>
              <Pressable
                style={styles.filterSelector}
                onPress={() => setOpenSelector(prev => (prev === 'status' ? null : 'status'))}
              >
                <ThemedText style={styles.filterSelectorText}>{selectedStatusLabel}</ThemedText>
                <Ionicons
                  name={openSelector === 'status' ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color="#8F4D44"
                />
              </Pressable>
              {openSelector === 'status' ? (
                <View style={styles.filterOptionList}>
                  {FILTER_OPTIONS.map(option => {
                    const active = option.key === statusFilter;
                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.filterOptionItem, active && styles.filterOptionItemActive]}
                        onPress={() => handleFilterChange(option.key)}
                      >
                        <ThemedText style={[styles.filterOptionText, active && styles.filterOptionTextActive]}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterSectionLabel}>Danh mục</ThemedText>
              <Pressable
                style={styles.filterSelector}
                onPress={() => setOpenSelector(prev => (prev === 'category' ? null : 'category'))}
              >
                <ThemedText style={styles.filterSelectorText}>{selectedCategoryLabel}</ThemedText>
                <Ionicons
                  name={openSelector === 'category' ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={18}
                  color="#8F4D44"
                />
              </Pressable>
              {openSelector === 'category' ? (
                <View style={styles.filterOptionList}>
                  {categoryOptions.map(option => {
                    const active = option.key === categoryFilter;
                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.filterOptionItem, active && styles.filterOptionItemActive]}
                        onPress={() => handleCategoryChange(option.key)}
                      >
                        <ThemedText style={[styles.filterOptionText, active && styles.filterOptionTextActive]}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color="#8F4D44" />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={applyAdvancedFilters}
                placeholder="Tìm theo tên món"
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
                placeholder="Điểm tối thiểu"
                placeholderTextColor="#B28B85"
                style={styles.scoreInput}
              />
              <TextInput
                value={scoreMaxInput}
                onChangeText={setScoreMaxInput}
                keyboardType="number-pad"
                placeholder="Điểm tối đa"
                placeholderTextColor="#B28B85"
                style={styles.scoreInput}
              />
              <Pressable style={styles.applyBtn} onPress={applyAdvancedFilters}>
                <ThemedText style={styles.applyBtnText}>Áp dụng</ThemedText>
              </Pressable>
              <Pressable style={styles.resetBtn} onPress={resetAdvancedFilters}>
                <ThemedText style={styles.resetBtnText}>Xóa</ThemedText>
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
              <ThemedText style={styles.emptyTitle}>Chưa có món đề xuất</ThemedText>
              <ThemedText style={styles.emptyText}>Bạn hãy chạy đánh giá lại để lấy dữ liệu gợi ý.</ThemedText>
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
              <ThemedText style={styles.loadMoreText}>{loadingMore ? 'Đang tải...' : 'Xem thêm'}</ThemedText>
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
            <ThemedText style={styles.bottomText}>Bạn đã chọn {selectedCount} món</ThemedText>
          </View>
          <Pressable style={styles.orderBtn} onPress={handleOrderNow}>
            <ThemedText style={styles.orderBtnText}>Đặt ngay</ThemedText>
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
  statusNotice: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF7F5',
    borderWidth: 1,
    borderColor: '#E8C7C2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#8F4D44',
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
  filterSection: {
    marginTop: 10,
    gap: 8,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F4D44',
  },
  filterSelector: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3C5C0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterSelectorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#7E3F38',
  },
  filterOptionList: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  filterOptionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F7E5E1',
  },
  filterOptionItemActive: {
    backgroundColor: '#FAEFEC',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#8F4D44',
  },
  filterOptionTextActive: {
    fontWeight: '700',
    color: '#A75A50',
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
  luxuryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  luxuryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  luxuryScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  luxuryScoreText: {
    fontSize: 11,
    fontWeight: '900',
  },
  luxuryPricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  luxuryPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  chipsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  premiumChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#E2F1E7',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  premiumChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2C5C3F',
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
