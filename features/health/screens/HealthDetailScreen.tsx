import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { healthService, HealthCondition } from '../services/healthService';

const { width } = Dimensions.get('window');

export default function HealthDetailScreen() {
  const { id } = useLocalSearchParams();
  const [condition, setCondition] = useState<HealthCondition | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadDetail(id as string);
    }
  }, [id]);

  const loadDetail = async (id: string) => {
    try {
      const data = await healthService.getById(id);
      setCondition(data);
    } catch (error) {
      console.error('Failed to load health detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#C1766B" />
      </View>
    );
  }

  if (!condition) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText>Không tìm thấy thông tin chi tiết.</ThemedText>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ThemedText style={styles.backBtnText}>Quay lại</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={condition.imageUrl || require('@/assets/images/home/health_tip_fruit.png')}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.heroGradient}
          />
          <Pressable style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.heroTitleContainer}>
            <ThemedText style={styles.heroTitle}>{condition.name}</ThemedText>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={20} color="#C1766B" />
                <ThemedText style={styles.sectionTitle}>Mô tả</ThemedText>
              </View>
              <ThemedText style={styles.descriptionText}>
                {condition.description || 'Thông tin chi tiết về tình trạng sức khỏe này đang được cập nhật.'}
              </ThemedText>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <LinearGradient
              colors={['#FFF5F4', '#FFFFFF']}
              style={styles.adviceCard}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="nutrition-outline" size={20} color="#C1766B" />
                <ThemedText style={styles.sectionTitle}>Chế độ ăn uống</ThemedText>
              </View>
              <ThemedText style={styles.adviceText}>
                {condition.dietaryAdvice || 'Duy trì chế độ ăn uống cân bằng, tránh các thực phẩm gây kích ứng và tham khảo ý kiến bác sĩ.'}
              </ThemedText>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600)}>
            <LinearGradient
              colors={['#F0F9FF', '#FFFFFF']}
              style={styles.adviceCard}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="body-outline" size={20} color="#3B82F6" />
                <ThemedText style={[styles.sectionTitle, { color: '#1E40AF' }]}>Vận động & Lối sống</ThemedText>
              </View>
              <ThemedText style={styles.adviceText}>
                {condition.exerciseAdvice || 'Vận động nhẹ nhàng thường xuyên và duy trì giấc ngủ đủ giấc để tăng cường sức đề kháng.'}
              </ThemedText>
            </LinearGradient>
          </Animated.View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Floating Bottom Button */}
      <Animated.View entering={FadeIn.delay(800)} style={styles.bottomBar}>
        <Pressable 
          style={styles.recommendBtn} 
          onPress={() => router.push('/recommendation')}
        >
          <LinearGradient
            colors={['#C1766B', '#A65D52']}
            style={styles.gradientBtn}
          >
            <ThemedText style={styles.recommendBtnText}>Khám phá công thức gợi ý</ThemedText>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: '#C1766B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroContainer: {
    height: 350,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  headerBackBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitleContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    paddingVertical: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
  },
  content: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  descriptionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  adviceCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  adviceText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  recommendBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#C1766B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  gradientBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  recommendBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
