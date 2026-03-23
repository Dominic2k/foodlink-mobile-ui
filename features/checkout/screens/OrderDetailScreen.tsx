import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { orderService } from '@/features/checkout/services/orderService';
import { OrderIngredientResponse, OrderResponse, OrderResponseItem } from '@/features/checkout/types';

const BRAND = '#C1766B';

type AggregatedIngredient = {
  key: string;
  ingredientName: string;
  baseUnit: string;
  quantityBase: number;
  lineTotal: number;
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [ratingValues, setRatingValues] = useState<Record<string, number>>({});
  const [commentValues, setCommentValues] = useState<Record<string, string>>({});
  const [submittingRatingId, setSubmittingRatingId] = useState<string | null>(null);
  const [deletingRatingId, setDeletingRatingId] = useState<string | null>(null);

  const syncRatingDrafts = useCallback((data: OrderResponse) => {
    setRatingValues(() => {
      const next: Record<string, number> = {};
      (data.items || []).forEach((item) => {
        next[item.id] = item.dishRating || 0;
      });
      return next;
    });

    setCommentValues(() => {
      const next: Record<string, string> = {};
      (data.items || []).forEach((item) => {
        next[item.id] = item.dishRatingComment || '';
      });
      return next;
    });
  }, []);

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
      syncRatingDrafts(data);
    } catch (error) {
      console.error('Failed to load order detail:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId, syncRatingDrafts]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const handleCancelOrder = () => {
    if (!orderId) return;

    Alert.alert('Xác nhận hủy đơn', 'Bạn có chắc chắn muốn hủy đơn hàng này không?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            setCanceling(true);
            await orderService.cancelMyOrder(orderId);
            await loadOrderDetail();
            Alert.alert('Thành công', 'Đơn hàng đã được hủy.');
          } catch (error: any) {
            console.error('Failed to cancel order:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể hủy đơn hàng lúc này.');
          } finally {
            setCanceling(false);
          }
        },
      },
    ]);
  };

  const handleSubmitRating = async (item: OrderResponseItem) => {
    const rating = ratingValues[item.id] || 0;
    const comment = (commentValues[item.id] || '').trim();

    if (!orderId) return;

    if (rating < 1 || rating > 5) {
      Alert.alert('Thiếu đánh giá', 'Vui lòng chọn từ 1 đến 5 sao trước khi gửi.');
      return;
    }

    try {
      setSubmittingRatingId(item.id);
      await orderService.submitDishRating(orderId, item.id, { rating, comment });
      await loadOrderDetail();
      Alert.alert('Thành công', item.dishRating ? 'Đánh giá món ăn đã được cập nhật.' : 'Đánh giá món ăn đã được lưu.');
    } catch (error: any) {
      console.error('Failed to submit dish rating:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể gửi đánh giá lúc này.');
    } finally {
      setSubmittingRatingId(null);
    }
  };

  const handleDeleteRating = (item: OrderResponseItem) => {
    if (!orderId || !item.dishRating) return;

    Alert.alert('Xóa đánh giá', 'Bạn có chắc muốn xóa đánh giá của món ăn này không?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            setDeletingRatingId(item.id);
            await orderService.deleteDishRating(orderId, item.id);
            await loadOrderDetail();
            Alert.alert('Thành công', 'Đánh giá món ăn đã được xóa.');
          } catch (error: any) {
            console.error('Failed to delete dish rating:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể xóa đánh giá lúc này.');
          } finally {
            setDeletingRatingId(null);
          }
        },
      },
    ]);
  };

  const aggregatedIngredients = useMemo<AggregatedIngredient[]>(() => {
    if (!order?.items?.length) return [];

    const map = new Map<string, AggregatedIngredient>();
    order.items.forEach((item) => {
      (item.ingredients || []).forEach((ing: OrderIngredientResponse) => {
        const key = `${ing.ingredientId || ing.ingredientName}-${ing.baseUnit || ''}`;
        const existing = map.get(key);
        if (existing) {
          existing.quantityBase += Number(ing.quantityBase || 0);
          existing.lineTotal += Number(ing.lineTotal || 0);
          return;
        }

        map.set(key, {
          key,
          ingredientName: ing.ingredientName || 'Nguyên liệu',
          baseUnit: ing.baseUnit || '',
          quantityBase: Number(ing.quantityBase || 0),
          lineTotal: Number(ing.lineTotal || 0),
        });
      });
    });

    return Array.from(map.values()).sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  }, [order]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value?: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const getStatusColor = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'processing':
      case 'confirmed':
        return '#3B82F6';
      case 'completed':
        return '#10B981';
      case 'canceled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return 'Đang chờ';
      case 'processing':
      case 'confirmed':
        return 'Đang xử lý';
      case 'completed':
        return 'Hoàn thành';
      case 'canceled':
        return 'Đã hủy';
      default:
        return status || '--';
    }
  };

  const renderStars = (item: OrderResponseItem, disabled: boolean) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          disabled={disabled}
          onPress={() => setRatingValues((prev) => ({ ...prev, [item.id]: star }))}
          style={styles.starButton}
        >
          <Ionicons
            name={(ratingValues[item.id] || 0) >= star ? 'star' : 'star-outline'}
            size={24}
            color={(ratingValues[item.id] || 0) >= star ? '#F59E0B' : '#D1D5DB'}
          />
        </Pressable>
      ))}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND} />
      </ThemedView>
    );
  }

  if (!order) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={40} color="#9CA3AF" />
        <ThemedText style={styles.emptyText}>Không tìm thấy đơn hàng.</ThemedText>
        <Pressable style={styles.backAction} onPress={() => router.back()}>
          <ThemedText style={styles.backActionText}>Quay lại</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Chi tiết đơn hàng</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <ThemedText style={styles.orderCode}>Đơn hàng #{order.id.slice(0, 8).toUpperCase()}</ThemedText>
              <ThemedText style={styles.metaText}>Tạo lúc: {formatDate(order.createdAt)}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <ThemedText style={styles.infoLine}>Người nhận: {order.userFullName || '--'}</ThemedText>
          <ThemedText style={styles.infoLine}>Địa chỉ: {order.deliveryAddressText || '--'}</ThemedText>
          <ThemedText style={styles.infoLine}>Điện thoại: {order.deliveryPhone || '--'}</ThemedText>
          <ThemedText style={styles.infoLine}>Thanh toán: {order.paymentMethod || '--'}</ThemedText>
          <ThemedText style={styles.infoLine}>Ghi chú: {order.note || '--'}</ThemedText>
          <ThemedText style={styles.totalAmount}>Tổng tiền: {formatCurrency(order.totalAmount)}</ThemedText>
          {order.status?.toLowerCase() === 'pending' ? (
            <Pressable style={[styles.cancelBtn, canceling && styles.cancelBtnDisabled]} disabled={canceling} onPress={handleCancelOrder}>
              <ThemedText style={styles.cancelBtnText}>{canceling ? 'Đang hủy...' : 'Hủy đơn'}</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Danh sách món đã chọn</ThemedText>
          {(order.items || []).map((item, index) => (
            <View key={item.id} style={[styles.itemBlock, index === order.items.length - 1 && styles.itemBlockLast]}>
              <Pressable
                style={styles.linkRow}
                onPress={() =>
                  router.push({
                    pathname: '/order-recommendation-detail',
                    params: {
                      recipeId: item.recipeId,
                      returnTo: 'order-detail',
                      orderId: order.id,
                    },
                  })
                }
              >
                <View style={styles.linkContent}>
                  <ThemedText style={styles.linkTitle}>{item.recipeName}</ThemedText>
                  <ThemedText style={styles.linkSub}>
                    Khẩu phần x{item.servings} - {formatCurrency(item.lineTotal)}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </Pressable>

              {order.status?.toLowerCase() === 'completed' ? (
                <View style={styles.ratingCard}>
                  <View style={styles.ratingHeader}>
                    <ThemedText style={styles.ratingTitle}>Đánh giá món ăn</ThemedText>
                    {item.dishRating ? (
                      <View style={styles.ratedBadge}>
                        <ThemedText style={styles.ratedBadgeText}>Đã lưu</ThemedText>
                      </View>
                    ) : null}
                  </View>

                  {renderStars(item, submittingRatingId === item.id || deletingRatingId === item.id)}

                  <TextInput
                    value={commentValues[item.id] || ''}
                    editable={submittingRatingId !== item.id && deletingRatingId !== item.id}
                    onChangeText={(value) => setCommentValues((prev) => ({ ...prev, [item.id]: value }))}
                    placeholder="Chia sẻ cảm nhận về món ăn này"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                    style={styles.commentInput}
                  />

                  {item.dishRatedAt ? (
                    <ThemedText style={styles.ratingMeta}>Đã đánh giá lúc: {formatDate(item.dishRatedAt)}</ThemedText>
                  ) : null}

                  <View style={styles.ratingActions}>
                    <Pressable
                      style={[styles.submitRatingBtn, (submittingRatingId === item.id || deletingRatingId === item.id) && styles.submitRatingBtnDisabled]}
                      disabled={submittingRatingId === item.id || deletingRatingId === item.id}
                      onPress={() => handleSubmitRating(item)}
                    >
                      <ThemedText style={styles.submitRatingBtnText}>
                        {submittingRatingId === item.id
                          ? (item.dishRating ? 'Đang cập nhật...' : 'Đang gửi...')
                          : (item.dishRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                      </ThemedText>
                    </Pressable>

                    {item.dishRating ? (
                      <Pressable
                        style={[styles.deleteRatingBtn, deletingRatingId === item.id && styles.submitRatingBtnDisabled]}
                        disabled={submittingRatingId === item.id || deletingRatingId === item.id}
                        onPress={() => handleDeleteRating(item)}
                      >
                        <ThemedText style={styles.deleteRatingBtnText}>
                          {deletingRatingId === item.id ? 'Đang xóa...' : 'Xóa đánh giá'}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          ))}
          {(!order.items || order.items.length === 0) && (
            <ThemedText style={styles.emptyHint}>Không có món nào trong đơn.</ThemedText>
          )}
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Nguyên liệu đã xác nhận mua</ThemedText>
          {aggregatedIngredients.map((ing) => (
            <View key={ing.key} style={styles.ingRow}>
              <View style={styles.linkContent}>
                <ThemedText style={styles.ingName}>{ing.ingredientName}</ThemedText>
                <ThemedText style={styles.ingQty}>
                  {ing.quantityBase} {ing.baseUnit}
                </ThemedText>
              </View>
              <ThemedText style={styles.ingPrice}>{formatCurrency(ing.lineTotal)}</ThemedText>
            </View>
          ))}
          {aggregatedIngredients.length === 0 && (
            <ThemedText style={styles.emptyHint}>Không có nguyên liệu nào.</ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 18,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  orderCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  metaText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  infoLine: {
    fontSize: 14,
    color: '#374151',
  },
  totalAmount: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: BRAND,
  },
  cancelBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnDisabled: {
    opacity: 0.6,
  },
  cancelBtnText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  itemBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
    marginBottom: 4,
  },
  itemBlockLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 0,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  linkSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingCard: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 10,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratedBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ratedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starButton: {
    paddingVertical: 2,
    paddingRight: 4,
  },
  commentInput: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  ratingMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  submitRatingBtn: {
    alignSelf: 'flex-start',
    backgroundColor: BRAND,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitRatingBtnDisabled: {
    opacity: 0.7,
  },
  submitRatingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ratingActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  deleteRatingBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteRatingBtnText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ingName: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  ingQty: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  ingPrice: {
    fontSize: 14,
    color: BRAND,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  emptyHint: {
    color: '#9CA3AF',
    fontSize: 13,
    paddingVertical: 6,
  },
  backAction: {
    marginTop: 4,
    backgroundColor: BRAND,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
