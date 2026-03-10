import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationItem } from '@/features/recommendation/types';
import { orderService } from '@/features/checkout/services/orderService';
import { OrderRequest } from '@/features/checkout/types';

export default function CheckoutScreen() {
  const { recipeId, selections } = useLocalSearchParams<{ recipeId?: string, selections?: string }>();
  const router = useRouter();
  
  const [item, setItem] = useState<RecommendationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (selections) {
          const parsedSelections = JSON.parse(selections);
          if (parsedSelections.length > 0) {
            const aggregatedIngredients = await recommendationService.aggregateIngredients(parsedSelections);
            setItem({
              recipeId: 'multi',
              recipeName: `Nhiều món (${parsedSelections.length})`,
              evaluated: true,
              score: 0,
              suitable: true,
              ingredients: aggregatedIngredients
            });
          }
        } else if (recipeId) {
          const data = await recommendationService.getRecommendationDetail(recipeId);
          setItem(data);
        }
      } catch (error) {
        console.error('Failed to load data for checkout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [recipeId, selections]);

  const handlePayment = async () => {
    if (!item?.ingredients || item.ingredients.length === 0) return;

    try {
      setSubmitting(true);
      const grandTotal = item.ingredients.reduce((sum, ing) => sum + (ing.totalPrice ?? 0), 0);

      const request: OrderRequest = {
        deliveryAddressText: "Địa chỉ mặc định", // Mocked for now
        deliveryPhone: "0123456789", // Mocked for now
        totalAmount: grandTotal,
        paymentMethod: "COD",
        note: `Đơn hàng nguyên liệu món: ${item.recipeName}`,
        items: item.ingredients.map(ing => ({
          ingredientId: ing.ingredientId || '',
          quantity: ing.quantity || 0,
          unit: ing.unit || '',
          price: ing.price ?? undefined,
          lineTotal: ing.totalPrice ?? undefined
        }))
      };

      await orderService.createOrder(request);

      Alert.alert(
        "Thanh toán thành công",
        "Đơn hàng nguyên liệu của bạn đã được đặt. Tính năng thanh toán online sẽ được tích hợp với bên thứ ba trong tương lai.",
        [
          { 
            text: "Đồng ý", 
            onPress: () => router.back() // Navigate back to recommendation screen
          }
        ]
      );
    } catch (error) {
      console.error('Failed to create order:', error);
      Alert.alert("Lỗi", "Không thể tạo đơn hàng lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#C1766B" />
      </ThemedView>
    );
  }

  if (!item || !item.ingredients || item.ingredients.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="cart-outline" size={42} color="#C1766B" />
        <ThemedText style={styles.emptyTitle}>Không có nguyên liệu nào để mua</ThemedText>
        <Pressable style={styles.backButtonCenter} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonTextCenter}>Quay lại</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const ingredients = item.ingredients;
  const grandTotal = ingredients.reduce((sum, ing) => sum + (ing.totalPrice ?? 0), 0);
  const fmtCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Giỏ hàng nguyên liệu</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.recipeName}>Món: {item.recipeName}</ThemedText>
          <View style={styles.divider} />
          
          {ingredients.map((ing, idx) => (
            <View key={`checkout-ing-${ing.ingredientId || idx}`} style={styles.ingredientRow}>
              <View style={styles.ingredientInfo}>
                <ThemedText style={styles.ingredientName}>{ing.ingredientName}</ThemedText>
                <ThemedText style={styles.ingredientQty}>
                  Số lượng: {ing.quantity ?? '--'} {ing.unit ?? ''}
                </ThemedText>
                {ing.price != null && (
                  <ThemedText style={styles.ingredientPricePerUnit}>
                    Đơn giá: {fmtCurrency(ing.price)} / {ing.unit ?? 'đv'}
                  </ThemedText>
                )}
              </View>
              <View style={styles.ingredientTotal}>
                <ThemedText style={styles.ingredientTotalPrice}>
                  {ing.totalPrice != null ? fmtCurrency(ing.totalPrice) : '--'}
                </ThemedText>
              </View>
            </View>
          ))}
        </ThemedView>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>Tổng cộng:</ThemedText>
          <ThemedText style={styles.totalValue}>{fmtCurrency(grandTotal)}</ThemedText>
        </View>
        <Pressable 
          style={[styles.paymentButton, submitting && styles.paymentButtonDisabled]} 
          onPress={handlePayment}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.paymentButtonText}>Thanh toán</ThemedText>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F7F7F7',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
  },
  backButtonCenter: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  backButtonTextCenter: {
    fontWeight: '600',
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    padding: 16,
    gap: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8F4D44',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0D9D5',
    marginVertical: 4,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ingredientInfo: {
    flex: 1,
    gap: 2,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  ingredientQty: {
    fontSize: 13,
    color: '#6B7280',
  },
  ingredientPricePerUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ingredientTotal: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  ingredientTotalPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8F4D44',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F0D9D5',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8F4D44',
  },
  paymentButton: {
    backgroundColor: '#C1766B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  paymentButtonDisabled: {
    opacity: 0.7,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
