import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/context/AuthContext';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationItem } from '@/features/recommendation/types';
import { orderService } from '@/features/checkout/services/orderService';
import { OrderItemRequest, OrderRequest } from '@/features/checkout/types';
import { paymentService } from '@/features/checkout/services/paymentService';
import * as WebBrowser from 'expo-web-browser';

export default function CheckoutScreen() {
  const { recipeId, selections, servings } = useLocalSearchParams<{ recipeId?: string, selections?: string, servings?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [item, setItem] = useState<RecommendationItem | null>(null);
  const [editableIngredients, setEditableIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delivery Info States
  const [deliveryPhone, setDeliveryPhone] = useState(user?.phone || '');
  const [deliveryAddressText, setDeliveryAddressText] = useState(user?.address || '');
  const [note, setNote] = useState('');

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
            setEditableIngredients(aggregatedIngredients);
          }
        } else if (recipeId) {
          const data = await recommendationService.getRecommendationDetail(recipeId);
          const desiredServings = Math.max(1, Number(servings || '1'));
          const baseServings = data.baseServings && data.baseServings > 0 ? data.baseServings : 1;
          const factor = desiredServings / baseServings;
          const scaledIngredients = data.ingredients?.map(ing => ({
            ...ing,
            quantity: ing.quantity != null ? ing.quantity * factor : ing.quantity,
            totalPrice: ing.totalPrice != null ? ing.totalPrice * factor : ing.totalPrice,
          })) || [];
          setItem({
            ...data,
            ingredients: scaledIngredients,
          });
          setEditableIngredients(scaledIngredients);
        }
      } catch (error) {
        console.error('Failed to load data for checkout:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [recipeId, selections, servings]);

  const updateQuantity = (id: string, delta: number) => {
    setEditableIngredients(prev => prev.map(ing => {
      if (ing.ingredientId === id || (id === 'none' && !ing.ingredientId)) {
        const currentQty = ing.quantity || 0;
        const newQty = Math.max(0.1, currentQty + delta);
        const unitPrice = ing.price || (ing.totalPrice / (currentQty || 1));
        return { 
          ...ing, 
          quantity: Number(newQty.toFixed(2)), 
          totalPrice: Number((newQty * unitPrice).toFixed(0)) 
        };
      }
      return ing;
    }));
  };

  const removeIngredient = (id: string) => {
    setEditableIngredients(prev => prev.filter(ing => ing.ingredientId !== id));
  };


  const handlePayment = async () => {
    if (editableIngredients.length === 0) return;

    if (!deliveryPhone.trim() || !deliveryAddressText.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập điền đầy đủ Số điện thoại và Địa chỉ giao hàng trước khi thanh toán.");
      return;
    }

    try {
      setSubmitting(true);
      const actualTotal = editableIngredients.reduce((sum, ing) => sum + (ing.totalPrice ?? 0), 0);
      
      // Stripe minimum for VND is ~12,000 VND. Force at least 15,000 for demo if needed.
      const grandTotal = Math.max(actualTotal, 15000);

      // 1. Create Stripe Checkout Session in Backend with Redirect URLs
      const successUrl = Linking.createURL('payment-success');
      const cancelUrl = Linking.createURL('payment-cancel');
      console.log('[Stripe Checkout] URLs:', { successUrl, cancelUrl });
      
      console.log('[Stripe Checkout] Creating session for amount:', grandTotal);
      const { url } = await paymentService.createCheckoutSession(grandTotal, successUrl, cancelUrl);
      
      if (!url) {
        throw new Error("Không nhận được URL thanh toán từ server.");
      }

      // 2. Open Stripe Hosted Checkout Page with AuthSession for automatic dismissal
      const result = await WebBrowser.openAuthSessionAsync(url, successUrl);
      
      if (result.type !== 'success' && result.type !== 'dismiss') {
        setSubmitting(false);
        return;
      }

      // 3. Create order in backend after returning from Stripe
      let orderItems: OrderItemRequest[] = [];
      if (selections) {
        const parsedSelections = JSON.parse(selections);
        orderItems = parsedSelections.map((sel: any) => ({
          recipeId: sel.recipeId,
          servings: sel.quantity || 1
        }));
      } else if (recipeId) {
        orderItems = [{
          recipeId: recipeId,
          servings: Math.max(1, Number(servings || '1'))
        }];
      }

      const customIngredients = editableIngredients.map(ing => ({
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit
      }));

      const request: OrderRequest = {
        deliveryAddressText: deliveryAddressText.trim(),
        deliveryPhone: deliveryPhone.trim(), 
        paymentMethod: "STRIPE",
        note: note.trim() ? note.trim() : `Đơn hàng đã thanh toán qua Stripe Checkout: ${item?.recipeName || 'Nhiều món'}`,
        items: orderItems.map((oi) => ({
          ...oi,
          customIngredients: (orderItems.length === 1 || (recipeId && oi.recipeId === recipeId)) ? customIngredients : undefined
        }))
      };

      await orderService.createOrder(request);

      Alert.alert(
        "Thanh toán thành công",
        "Đơn hàng của bạn đã được đặt thành công sau khi thanh toán qua Stripe.",
        [{ text: "Đồng ý", onPress: () => router.push('/order-history') }]
      );
    } catch (error: any) {
      console.error('Failed to complete Stripe Checkout flow:', error);
      Alert.alert("Lỗi thanh toán", error.message || "Quá trình thanh toán gặp sự cố.");
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

  const grandTotal = editableIngredients.reduce((sum, ing) => sum + (ing.totalPrice ?? 0), 0);
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
          
          {editableIngredients.map((ing, idx) => (
            <View key={`checkout-ing-${ing.ingredientId || idx}`} style={styles.ingredientRow}>
              <View style={styles.ingredientInfo}>
                <ThemedText style={styles.ingredientName}>{ing.ingredientName}</ThemedText>
                <View style={styles.quantityContainer}>
                  <Pressable 
                    onPress={() => updateQuantity(ing.ingredientId || 'none', -(ing.quantity > 100 ? 50 : 1))}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="remove-circle-outline" size={22} color="#C1766B" />
                  </Pressable>
                  <ThemedText style={styles.ingredientQty}>
                    {ing.quantity ?? '--'} {ing.unit ?? ''}
                  </ThemedText>
                  <Pressable 
                    onPress={() => updateQuantity(ing.ingredientId || 'none', (ing.quantity >= 100 ? 50 : 1))}
                    style={styles.qtyBtn}
                  >
                    <Ionicons name="add-circle-outline" size={22} color="#C1766B" />
                  </Pressable>
                </View>
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
                <Pressable onPress={() => removeIngredient(ing.ingredientId)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>
          ))}
        </ThemedView>

        <ThemedView style={[styles.card, { marginTop: 16 }]}>
          <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 }}>Thông tin giao hàng</ThemedText>
          
          <ThemedText style={styles.inputLabel}>Số điện thoại *</ThemedText>
          <TextInput
            style={styles.textInput}
            value={deliveryPhone}
            onChangeText={setDeliveryPhone}
            placeholder="Nhập số điện thoại nhận hàng"
            keyboardType="phone-pad"
          />

          <ThemedText style={styles.inputLabel}>Địa chỉ giao hàng *</ThemedText>
          <TextInput
            style={styles.textInput}
            value={deliveryAddressText}
            onChangeText={setDeliveryAddressText}
            placeholder="Nhập số nhà, đường, phường, quận"
            multiline
          />

          <ThemedText style={styles.inputLabel}>Ghi chú (Tùy chọn)</ThemedText>
          <TextInput
            style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
            value={note}
            onChangeText={setNote}
            placeholder="Chi tiết địa điểm hoặc yêu cầu giao hàng..."
            multiline
          />
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
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    minWidth: 60,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  qtyBtn: {
    padding: 2,
  },
  removeBtn: {
    marginTop: 8,
    padding: 4,
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
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 8,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAF9',
    color: '#111827',
  },
});
