import { StyleSheet, ScrollView } from 'react-native';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Chào mừng đến FoodLink!</ThemedText>
          <ThemedText style={styles.emoji}>🍜</ThemedText>
        </ThemedView>
        
        {user?.username && (
          <ThemedView style={styles.userInfo}>
            <ThemedText type="subtitle">Xin chào, {user.username}! 👋</ThemedText>
          </ThemedView>
        )}
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Bạn đồng hành ẩm thực</ThemedText>
          <ThemedText>
            Khám phá trải nghiệm ẩm thực tuyệt vời và kết nối với cộng đồng yêu ẩm thực.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Bắt đầu khám phá</ThemedText>
          <ThemedText>
            Khám phá ứng dụng để tìm nhà hàng, công thức nấu ăn và gợi ý món ăn.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  emoji: {
    fontSize: 28,
  },
  userInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(193, 118, 107, 0.1)',
    borderRadius: 12,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
});
