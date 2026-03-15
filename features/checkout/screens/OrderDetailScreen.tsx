import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { orderService } from '@/features/checkout/services/orderService';
import { OrderIngredientResponse, OrderResponse } from '@/features/checkout/types';

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

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order detail:', error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const handleCancelOrder = () => {
    if (!orderId) return;

    Alert.alert('Xac nhan huy don', 'Ban co chac chan muon huy don hang nay khong?', [
      { text: 'Khong', style: 'cancel' },
      {
        text: 'Huy don',
        style: 'destructive',
        onPress: async () => {
          try {
            setCanceling(true);
            await orderService.cancelMyOrder(orderId);
            await loadOrderDetail();
            Alert.alert('Thanh cong', 'Don hang da duoc huy.');
          } catch (error: any) {
            console.error('Failed to cancel order:', error);
            Alert.alert('Loi', error?.message || 'Khong the huy don hang luc nay.');
          } finally {
            setCanceling(false);
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
          ingredientName: ing.ingredientName || 'Nguyen lieu',
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
      case 'pending': return '#F59E0B';
      case 'processing': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'canceled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pending': return 'Dang cho';
      case 'processing': return 'Dang xu ly';
      case 'completed': return 'Hoan thanh';
      case 'canceled': return 'Da huy';
      default: return status || '--';
    }
  };

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
        <ThemedText style={styles.emptyText}>Khong tim thay don hang.</ThemedText>
        <Pressable style={styles.backAction} onPress={() => router.back()}>
          <ThemedText style={styles.backActionText}>Quay lai</ThemedText>
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
        <ThemedText style={styles.headerTitle}>Chi tiet don hang</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <ThemedText style={styles.orderCode}>Don hang #{order.id.slice(0, 8).toUpperCase()}</ThemedText>
              <ThemedText style={styles.metaText}>Tao luc: {formatDate(order.createdAt)}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
              <ThemedText style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                {getStatusText(order.status)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <ThemedText style={styles.infoLine}>Dia chi: {order.deliveryAddressText || '--'}</ThemedText>
          <ThemedText style={styles.infoLine}>Dien thoai: {order.deliveryPhone || '--'}</ThemedText>
          <ThemedText style={styles.infoLine}>Thanh toan: {order.paymentMethod || '--'}</ThemedText>
          <ThemedText style={styles.infoLine}>Ghi chu: {order.note || '--'}</ThemedText>
          <ThemedText style={styles.totalAmount}>Tong tien: {formatCurrency(order.totalAmount)}</ThemedText>
          {order.status?.toLowerCase() === 'pending' ? (
            <Pressable style={[styles.cancelBtn, canceling && styles.cancelBtnDisabled]} disabled={canceling} onPress={handleCancelOrder}>
              <ThemedText style={styles.cancelBtnText}>{canceling ? 'Dang huy...' : 'Huy don'}</ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Danh sach mon da chon</ThemedText>
          {(order.items || []).map((item) => (
            <Pressable
              key={item.id}
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
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.linkTitle}>{item.recipeName}</ThemedText>
                <ThemedText style={styles.linkSub}>
                  Khau phan x{item.servings} - {formatCurrency(item.lineTotal)}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          ))}
          {(!order.items || order.items.length === 0) && (
            <ThemedText style={styles.emptyHint}>Khong co mon nao trong don.</ThemedText>
          )}
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.sectionTitle}>Nguyen lieu da xac nhan mua</ThemedText>
          {aggregatedIngredients.map((ing) => (
            <View key={ing.key} style={styles.ingRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.ingName}>{ing.ingredientName}</ThemedText>
                <ThemedText style={styles.ingQty}>
                  {ing.quantityBase} {ing.baseUnit}
                </ThemedText>
              </View>
              <ThemedText style={styles.ingPrice}>{formatCurrency(ing.lineTotal)}</ThemedText>
            </View>
          ))}
          {aggregatedIngredients.length === 0 && (
            <ThemedText style={styles.emptyHint}>Khong co nguyen lieu nao.</ThemedText>
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
