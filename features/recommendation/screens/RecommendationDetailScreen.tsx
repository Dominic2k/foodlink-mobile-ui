import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { useRecommendationRefresh } from '@/features/recommendation/context/RecommendationRefreshContext';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationEvaluationStatus, RecommendationItem } from '@/features/recommendation/types';

export default function RecommendationDetailScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();
  const router = useRouter();
  const [item, setItem] = useState<RecommendationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedInstructions, setExpandedInstructions] = useState(false);
  const [servings, setServings] = useState(1);
  const [evaluationStatus, setEvaluationStatus] = useState<RecommendationEvaluationStatus>('idle');
  const { needsRecommendationRefresh, clearRecommendationRefreshNeeded } = useRecommendationRefresh();

  const loadDetail = useCallback(async () => {
    if (!recipeId) {
      setLoading(false);
      return;
    }

    try {
      const data = await recommendationService.getRecommendationDetail(recipeId);
      setItem(data);
    } catch (error) {
      console.error('Failed to load recommendation detail:', error);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const base = item?.baseServings && item.baseServings > 0 ? item.baseServings : 1;
    setServings(base);
  }, [item?.recipeId, item?.baseServings]);

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

          setLoading(true);
          await loadDetail();
          clearRecommendationRefreshNeeded();
        } catch (error) {
          console.error('Failed to check recommendation detail evaluation status:', error);
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
    }, [needsRecommendationRefresh, clearRecommendationRefreshNeeded, loadDetail])
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#C1766B" />
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={42} color="#C1766B" />
        <ThemedText style={styles.emptyTitle}>Không tải được chi tiết</ThemedText>
      </ThemedView>
    );
  }

  const statusLabel = !item.evaluated ? 'Chưa đánh giá' : item.suitable ? 'Phù hợp' : 'Không phù hợp';
  const statusStyle = !item.evaluated ? styles.statusPending : item.suitable ? styles.statusSuitable : styles.statusUnsuitable;
  const statusTextStyle = !item.evaluated ? styles.statusPendingText : item.suitable ? styles.statusSuitableText : styles.statusUnsuitableText;
  const ingredients = item.ingredients ?? [];

  const fmt = (value?: number | null) => (typeof value === 'number' ? value.toFixed(2) : '--');
  const formatCurrency = (value?: number | null) => {
    if (typeof value !== 'number') return '--';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatCategoryLabel = (value: string) => {
    if (!value) return 'Other';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  const baseServings = item.baseServings && item.baseServings > 0 ? item.baseServings : 1;
  const servingFactor = servings / baseServings;
  const selectedTotalPrice = item.ingredients && item.ingredients.length > 0
    ? item.ingredients.reduce((sum, ing) => sum + ((ing.totalPrice ?? 0) * servingFactor), 0)
    : (item.pricePerServing != null ? item.pricePerServing * servings : null);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroFallback]}>
            <Ionicons name="restaurant-outline" size={44} color="#C1766B" />
          </View>
        )}

      <ThemedView style={styles.card}>
        <ThemedText style={styles.name}>{item.recipeName}</ThemedText>

        <View style={[styles.statusBadge, statusStyle]}>
          <ThemedText style={[styles.statusText, statusTextStyle]}>{statusLabel}</ThemedText>
        </View>

        {needsRecommendationRefresh && (evaluationStatus === 'queued' || evaluationStatus === 'processing') ? (
          <View style={styles.refreshNotice}>
            <Ionicons name="sync-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.refreshNoticeText}>Đang chờ hệ thống đánh giá lại món ăn...</ThemedText>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <ThemedText style={styles.metaText}>
            {item.evaluated ? `${item.score}/100` : '--/100'}
          </ThemedText>
        </View>

        <View style={styles.categoriesRow}>
          {item.dishCategories && item.dishCategories.map(cat => (
            <View key={cat} style={[styles.categoryBadge, { backgroundColor: '#E2F1E7', borderColor: '#B5D8C1' }]}>
              <Ionicons name="restaurant-outline" size={12} color="#2C5C3F" />
              <ThemedText style={[styles.categoryBadgeText, { color: '#2C5C3F' }]}>{cat}</ThemedText>
            </View>
          ))}
          {item.category && item.category !== 'other' ? (
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag-outline" size={12} color="#8F4D44" />
              <ThemedText style={styles.categoryBadgeText}>{formatCategoryLabel(item.category)}</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.recipeInfoRow}>
          <View style={styles.recipeInfoChip}>
            <Ionicons name="time-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.recipeInfoText}>Chuẩn bị {item.prepTimeMin ?? '--'} phút</ThemedText>
          </View>
          <View style={styles.recipeInfoChip}>
            <Ionicons name="flame-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.recipeInfoText}>Nấu {item.cookTimeMin ?? '--'} phút</ThemedText>
          </View>
          <View style={styles.recipeInfoChip}>
            <Ionicons name="people-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.recipeInfoText}>Khẩu phần {item.baseServings ?? '--'}</ThemedText>
          </View>
        </View>

        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Giá một khẩu phần</ThemedText>
            <ThemedText style={styles.priceValue}>{formatCurrency(item.pricePerServing)}</ThemedText>
          </View>
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Khẩu phần muốn mua</ThemedText>
            <View style={styles.servingStepper}>
              <Pressable
                style={[styles.stepperBtn, servings <= 1 && styles.stepperBtnDisabled]}
                onPress={() => setServings(prev => Math.max(1, prev - 1))}
                disabled={servings <= 1}
              >
                <Ionicons name="remove" size={16} color="#8F4D44" />
              </Pressable>
              <ThemedText style={styles.servingValue}>{servings}</ThemedText>
              <Pressable style={styles.stepperBtn} onPress={() => setServings(prev => prev + 1)}>
                <Ionicons name="add" size={16} color="#8F4D44" />
              </Pressable>
            </View>
          </View>
          <ThemedText style={styles.servingHint}>Công thức gốc hiện tại dành cho {baseServings} khẩu phần.</ThemedText>
          <View style={[styles.priceRow, styles.priceRowTotal]}>
            <ThemedText style={styles.totalPriceLabel}>Tổng giá ước tính</ThemedText>
            <ThemedText style={styles.totalPriceValue}>{formatCurrency(selectedTotalPrice)}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Mô tả món</ThemedText>
          <ThemedText style={styles.sectionText}>
            {item.recipeDescription?.trim() || 'Món này chưa có mô tả.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Lý do đánh giá</ThemedText>
          <ThemedText style={styles.sectionText}>
            {item.reason?.trim() || 'Món này chưa có lý do đánh giá.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Đề xuất cách ăn</ThemedText>
          <ThemedText style={styles.sectionText}>
            {item.suggestion?.trim() || 'Món này chưa có đề xuất cách ăn.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Hướng dẫn nấu</ThemedText>
          <ThemedText
            style={styles.sectionText}
            numberOfLines={expandedInstructions ? undefined : 4}
          >
            {item.recipeInstructions?.trim() || 'Món này chưa có hướng dẫn nấu.'}
          </ThemedText>
          {item.recipeInstructions && item.recipeInstructions.trim().length > 0 && (
            <Pressable
              style={styles.expandBtn}
              onPress={() => setExpandedInstructions(prev => !prev)}
            >
              <ThemedText style={styles.expandBtnText}>
                {expandedInstructions ? 'Thu gọn' : 'Xem đầy đủ'}
              </ThemedText>
              <Ionicons
                name={expandedInstructions ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#8F4D44"
              />
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tổng dinh dưỡng ước tính</ThemedText>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Calo</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.calories)}</ThemedText>
            </View>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Đạm (g)</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.protein)}</ThemedText>
            </View>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Tinh bột (g)</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.carb)}</ThemedText>
            </View>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Chất béo (g)</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.fat)}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.coverageText}>
            Đã tính được {item.nutritionSummary?.coveredIngredients ?? 0}/{item.nutritionSummary?.totalIngredients ?? 0} nguyên liệu
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Nguyên liệu</ThemedText>
          {ingredients.length === 0 ? (
            <ThemedText style={styles.sectionText}>Món này chưa có danh sách nguyên liệu.</ThemedText>
          ) : (
            ingredients.map((ingredient, index) => (
              <View key={`${ingredient.ingredientId ?? ingredient.ingredientName}-${index}`} style={styles.ingredientRow}>
                <View style={styles.ingredientTop}>
                  <ThemedText style={styles.ingredientName}>
                    {ingredient.ingredientName} {ingredient.optional ? '(tùy chọn)' : ''}
                  </ThemedText>
                  <ThemedText style={styles.ingredientQty}>
                    {ingredient.quantity != null ? fmt(ingredient.quantity * servingFactor) : '--'} {ingredient.unit ?? ''}
                  </ThemedText>
                </View>
                <ThemedText style={styles.ingredientPriceText}>
                  {formatCurrency(ingredient.totalPrice != null ? ingredient.totalPrice * servingFactor : null)}
                </ThemedText>
                <ThemedText style={styles.ingredientNutrition}>
                  Cal {fmt(ingredient.calories)} | P {fmt(ingredient.protein)} | C {fmt(ingredient.carb)} | F {fmt(ingredient.fat)}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ThemedView>
    </ScrollView>
      <View style={styles.bottomFixedBar}>
        <Pressable
          style={styles.buyButton}
          onPress={() => {
            if (item.recipeId) {
              router.push({
                pathname: '/checkout',
                params: { recipeId: item.recipeId, servings: String(servings) }
              });
            }
          }}
        >
          <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          <ThemedText style={styles.buyButtonText}>Mua tất cả nguyên liệu</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 24,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F7F7F7',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8ECEA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    padding: 14,
    gap: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  statusSuitable: {
    backgroundColor: '#ECFDF3',
    borderColor: '#86EFAC',
  },
  statusUnsuitable: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  refreshNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF7F5',
    borderWidth: 1,
    borderColor: '#E8C7C2',
  },
  refreshNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#8F4D44',
  },
  statusPendingText: {
    color: '#4B5563',
  },
  statusSuitableText: {
    color: '#15803D',
  },
  statusUnsuitableText: {
    color: '#B91C1C',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#E8E0F0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B4C8A',
  },
  recipeInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recipeInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E8C7C2',
    backgroundColor: '#FFF7F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recipeInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F4D44',
  },
  priceCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    borderRadius: 14,
    backgroundColor: '#FFF8F4',
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceRowTotal: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8C7C2',
  },
  priceLabel: {
    fontSize: 13,
    color: '#8F4D44',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    color: '#7E3F38',
    fontWeight: '800',
  },
  servingStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D9B4AE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  servingValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  servingHint: {
    fontSize: 12,
    color: '#7E3F38',
  },
  totalPriceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7E3F38',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A75A50',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFF7F5',
    borderWidth: 1,
    borderColor: '#E8C7C2',
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F4D44',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8F4D44',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionCell: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#F0D9D5',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FFFDFC',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#8F4D44',
    fontWeight: '600',
  },
  nutritionValue: {
    marginTop: 4,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '800',
  },
  coverageText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  ingredientRow: {
    borderWidth: 1,
    borderColor: '#F0D9D5',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 4,
  },
  ingredientTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  ingredientQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F4D44',
  },
  ingredientNutrition: {
    fontSize: 12,
    color: '#475569',
  },
  ingredientPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A75A50',
  },
  bottomFixedBar: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0D9D5',
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C1766B',
    paddingVertical: 14,
    borderRadius: 12,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
