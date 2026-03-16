import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';

export default function PaymentSuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to order history after a short delay
    const timer = setTimeout(() => {
      router.replace('/order-history' as any);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>
        <ThemedText style={styles.title}>Thanh toán thành công!</ThemedText>
        <ThemedText style={styles.message}>
          Đơn hàng của bạn đang được xử lý. Bạn sẽ được chuyển đến trang lịch sử đơn hàng trong giây lát.
        </ThemedText>
        <ActivityIndicator size="small" color="#C1766B" style={styles.loader} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  loader: {
    marginTop: 24,
  },
});
