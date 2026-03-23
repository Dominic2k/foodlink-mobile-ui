import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { orderService } from '@/features/checkout/services/orderService';
import { OrderResponse, OrderResponseItem } from '@/features/checkout/types';

const BRAND = '#C1766B';

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const router = useRouter();

  const loadOrders = async () => {
    try {
      const data = await orderService.getMyOrders();
      setOrders(data.content);
    } catch (error) {
      console.error('Failed to load order history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert('Xác nhận hủy đơn', 'Bạn có chắc chắn muốn hủy đơn hàng này không?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelingOrderId(orderId);
            await orderService.cancelMyOrder(orderId);
            await loadOrders();
          } catch (error: any) {
            console.error('Failed to cancel order:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể hủy đơn hàng lúc này.');
          } finally {
            setCancelingOrderId(null);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
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
        return status;
    }
  };

  const getRatingState = (order: OrderResponse) => {
    const items = order.items || [];
    const ratedCount = items.filter((item) => item.dishRating).length;
    const unratedCount = items.filter((item) => !item.dishRating).length;

    return {
      ratedCount,
      unratedCount,
      canRate: order.status?.toLowerCase() === 'completed' && unratedCount > 0,
      allRated: order.status?.toLowerCase() === 'completed' && unratedCount === 0 && items.length > 0,
    };
  };

  const renderItemRatingBadge = (orderItem: OrderResponseItem) => {
    const rated = !!orderItem.dishRating;

    return (
      <View style={[styles.itemBadge, rated ? styles.itemBadgeRated : styles.itemBadgeUnrated]}>
        <Ionicons
          name={rated ? 'star' : 'create-outline'}
          size={12}
          color={rated ? '#166534' : '#9A3412'}
        />
        <ThemedText style={[styles.itemBadgeText, rated ? styles.itemBadgeTextRated : styles.itemBadgeTextUnrated]}>
          {rated ? 'Đã đánh giá' : 'Chưa đánh giá'}
        </ThemedText>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: OrderResponse }) => {
    const ratingState = getRatingState(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.orderCard}
        onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.id } })}
      >
        <View style={styles.orderHeader}>
          <View>
            <ThemedText style={styles.orderId}>Đơn hàng #{item.id.slice(0, 8).toUpperCase()}</ThemedText>
            <ThemedText style={styles.orderDate}>{formatDate(item.createdAt)}</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </ThemedText>
          </View>
        </View>

        {(ratingState.canRate || ratingState.allRated) ? (
          <View style={[styles.ratingNotice, ratingState.canRate ? styles.ratingNoticePending : styles.ratingNoticeDone]}>
            <Ionicons
              name={ratingState.canRate ? 'chatbubble-ellipses-outline' : 'checkmark-circle-outline'}
              size={16}
              color={ratingState.canRate ? '#9A3412' : '#166534'}
            />
            <ThemedText style={[styles.ratingNoticeText, ratingState.canRate ? styles.ratingNoticeTextPending : styles.ratingNoticeTextDone]}>
              {ratingState.canRate
                ? `Có ${ratingState.unratedCount} món cần đánh giá`
                : `Đã đánh giá ${ratingState.ratedCount}/${item.items.length} món`}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.orderSummary}>
          <View style={styles.itemsList}>
            {item.items.map((orderItem) => (
              <View key={orderItem.id} style={styles.itemRow}>
                <View style={styles.itemMain}>
                  <ThemedText style={styles.itemText} numberOfLines={1}>
                    {orderItem.recipeName} x{orderItem.servings}
                  </ThemedText>
                  {item.status?.toLowerCase() === 'completed' ? renderItemRatingBadge(orderItem) : null}
                </View>
              </View>
            ))}
          </View>
          <View style={styles.paymentInfo}>
            <ThemedText style={styles.totalLabel}>Tổng cộng</ThemedText>
            <ThemedText style={styles.totalValue}>{formatCurrency(item.totalAmount)}</ThemedText>
          </View>
        </View>

        {item.status?.toLowerCase() === 'completed' ? (
          <View style={styles.hintRow}>
            <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
            <ThemedText style={styles.hintText}>Mở chi tiết đơn hàng để gửi đánh giá món ăn.</ThemedText>
          </View>
        ) : null}

        {item.status?.toLowerCase() === 'pending' ? (
          <View style={styles.cardFooter}>
            <Pressable
              style={[styles.cancelBtn, cancelingOrderId === item.id && styles.cancelBtnDisabled]}
              disabled={cancelingOrderId === item.id}
              onPress={(event) => {
                event.stopPropagation();
                handleCancelOrder(item.id);
              }}
            >
              <ThemedText style={styles.cancelBtnText}>
                {cancelingOrderId === item.id ? 'Đang hủy...' : 'Hủy đơn'}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Lịch sử đơn hàng</ThemedText>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color="#E5E7EB" />
            <ThemedText style={styles.emptyText}>Bạn chưa có đơn hàng nào.</ThemedText>
          </View>
        }
      />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  ratingNoticePending: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  ratingNoticeDone: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  ratingNoticeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratingNoticeTextPending: {
    color: '#9A3412',
  },
  ratingNoticeTextDone: {
    color: '#166534',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemsList: {
    flex: 1,
    marginRight: 16,
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
    gap: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#4B5563',
  },
  itemBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  itemBadgeRated: {
    backgroundColor: '#DCFCE7',
  },
  itemBadgeUnrated: {
    backgroundColor: '#FFEDD5',
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemBadgeTextRated: {
    color: '#166534',
  },
  itemBadgeTextUnrated: {
    color: '#9A3412',
  },
  paymentInfo: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: BRAND,
  },
  hintRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  cancelBtn: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
});
