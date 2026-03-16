import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { useRecommendationRefresh } from '@/features/recommendation/context/RecommendationRefreshContext';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationEvaluationStatus, RecommendationItem } from '@/features/recommendation/types';

export default function RecommendationDetailScreen() {
  const { recipeId, returnTo, orderId } = useLocalSearchParams<{ recipeId?: string; returnTo?: string; orderId?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
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
    navigation.setOptions({
      headerLeft: () => (
        <Pressable
          onPress={() => {
            if (returnTo === 'order-detail') {
              if (router.canGoBack()) {
                router.back();
                return;
              }
              if (orderId) {
                router.replace({ pathname: '/order-detail', params: { orderId } });
                return;
              }
            }
            if (returnTo === 'recommendation') {
              router.navigate('/recommendation');
              return;
            }
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.navigate('/recommendation');
          }}
          style={{ marginLeft: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
      ),
    });
  }, [navigation, returnTo, orderId, router]);

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
    if (!value) return 'Khác';
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
        <View style={styles.titleRow}>
          <ThemedText style={styles.name}>{item.recipeName}</ThemedText>
          <View 
            style={[
              styles.luxuryDetailBadge, 
              { 
                backgroundColor: item.evaluated ? (item.suitable ? '#ECFDF5' : '#FEF2F2') : '#F3F4F6',
                borderColor: item.evaluated ? (item.suitable ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)') : '#D1D5DB'
              }
            ]}
          >
            <View style={styles.detailBadgeContent}>
              {item.evaluated && (
                <Ionicons 
                  name={item.suitable ? "checkmark-circle" : "close-circle"} 
                  size={14} 
                  color={item.suitable ? '#065F46' : '#991B1B'} 
                  style={{ marginRight: 4 }} 
                />
              )}
              <ThemedText style={[styles.luxuryDetailBadgeText, { color: item.evaluated ? (item.suitable ? '#065F46' : '#991B1B') : '#6B7280' }]}>
                {statusLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        {needsRecommendationRefresh && (evaluationStatus === 'queued' || evaluationStatus === 'processing') ? (
          <View style={styles.refreshNotice}>
            <Ionicons name="sync-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.refreshNoticeText}>Đang chờ hệ thống đánh giá lại món ăn...</ThemedText>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <View 
            style={[
              styles.luxuryDetailScorePill,
              {
                backgroundColor: item.evaluated ? (item.score >= 80 ? '#F0FDF4' : item.score >= 60 ? '#FFFBEB' : '#FEF2F2') : '#F9FAFB',
                borderColor: item.evaluated ? (item.score >= 80 ? 'rgba(34, 197, 94, 0.3)' : item.score >= 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)') : 'rgba(0,0,0,0.05)'
              }
            ]}
          >
            <Ionicons 
              name="flash" 
              size={12} 
              color={item.evaluated ? (item.score >= 80 ? '#059669' : item.score >= 60 ? '#D97706' : '#DC2626') : '#9CA3AF'} 
              style={{ marginRight: 6 }} 
            />
            <ThemedText 
              style={[
                styles.luxuryDetailScoreText, 
                { color: item.evaluated ? (item.score >= 80 ? '#059669' : item.score >= 60 ? '#D97706' : '#DC2626') : '#6B7280' }
              ]}
            >
              {item.evaluated ? `Điểm số: ${item.score}/100` : '--/100'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.categoriesRow}>
          {item.dishCategories && item.dishCategories.map(cat => (
            <View key={cat} style={styles.premiumDetailChip}>
              <Ionicons name="restaurant-outline" size={12} color="#2C5C3F" />
              <ThemedText style={styles.premiumDetailChipText}>{cat}</ThemedText>
            </View>
          ))}
          {item.category && item.category !== 'other' ? (
            <View style={[styles.premiumDetailChip, { backgroundColor: '#F8ECEA', borderColor: '#E8C7C2' }]}>
              <Ionicons name="pricetag-outline" size={12} color="#8F4D44" />
              <ThemedText style={[styles.premiumDetailChipText, { color: '#8F4D44' }]}>{formatCategoryLabel(item.category)}</ThemedText>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  luxuryDetailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  luxuryDetailBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  luxuryDetailScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
    borderWidth: 1,
  },
  luxuryDetailScoreText: {
    fontSize: 13,
    fontWeight: '900',
  },
  premiumDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  premiumDetailChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
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
    gap: 12,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    borderRadius: 14,
    backgroundColor: '#FFFDFC',
    padding: 14,
    shadowColor: '#A75A50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceRowTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderStyle: 'dashed',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C1766B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  servingValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  servingHint: {
    fontSize: 12,
    color: '#828282',
    fontStyle: 'italic',
  },
  totalPriceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalPriceValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#C1766B',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F8ECEA',
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F4D44',
  },
  section: {
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    borderLeftWidth: 4,
    borderLeftColor: '#C1766B',
    paddingLeft: 10,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
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
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nutritionValue: {
    marginTop: 4,
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '800',
  },
  coverageText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  ingredientRow: {
    borderWidth: 1,
    borderColor: '#F0D9D5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 6,
    marginBottom: 8,
  },
  ingredientTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  ingredientQty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C1766B',
  },
  ingredientNutrition: {
    fontSize: 12,
    color: '#6B7280',
  },
  ingredientPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8F4D44',
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
