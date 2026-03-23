import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { healthService, HealthCondition } from '../services/healthService';

const { width } = Dimensions.get('window');

export default function HealthListScreen() {
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [filteredConditions, setFilteredConditions] = useState<HealthCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadConditions();
  }, []);

  const loadConditions = async () => {
    try {
      const data = await healthService.getAll();
      setConditions(data);
      setFilteredConditions(data);
    } catch (error) {
      console.error('Failed to load health conditions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredConditions(conditions);
      return;
    }
    const filtered = conditions.filter((c) =>
      c.name.toLowerCase().includes(text.toLowerCase()) ||
      c.description?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredConditions(filtered);
  };

  const renderItem = ({ item, index }: { item: HealthCondition; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <Pressable
        style={styles.card}
        onPress={() => router.push({ pathname: '/health-detail', params: { id: item.id } })}
      >
        <Image
          source={item.imageUrl || require('@/assets/images/home/health_tip_fruit.png')}
          style={styles.cardImage}
          contentFit="cover"
        />
        <View style={styles.cardContent}>
          <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
          <ThemedText numberOfLines={2} style={styles.cardDesc}>
            {item.description || 'Tìm hiểu về chế độ ăn uống và lối sống phù hợp cho tình trạng này.'}
          </ThemedText>
          <View style={styles.cardFooter}>
            <View style={styles.tag}>
              <ThemedText style={styles.tagText}>Lời khuyên chuyên gia</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C1766B" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Sức khỏe & Dinh dưỡng</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Kiến thức cho cuộc sống lành mạnh</ThemedText>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Tìm kiếm bệnh lý..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#C1766B" />
        </View>
      ) : (
        <FlatList
          data={filteredConditions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#E5E7EB" />
              <ThemedText style={styles.emptyText}>Không tìm thấy thông tin phù hợp</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1F2937',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardImage: {
    width: 100,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: 'rgba(193, 118, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#C1766B',
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: '#9CA3AF',
    fontSize: 16,
  },
});
