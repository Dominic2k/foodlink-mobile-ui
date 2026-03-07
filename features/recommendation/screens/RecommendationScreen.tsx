import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationItem } from '@/features/recommendation/types';

const PAGE_SIZE = 8;

export default function RecommendationScreen() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>({});

  const selectedCount = useMemo(
    () => Object.values(selectedMap).reduce((sum, qty) => sum + qty, 0),
    [selectedMap]
  );

  const fetchPage = useCallback(async (targetPage: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const data = await recommendationService.getRecommendations(targetPage, PAGE_SIZE);
      setItems(prev => (append ? [...prev, ...data.items] : data.items));
      setPage(data.page);
      setHasNext(data.hasNext);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      if (!append) setItems([]);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const handleAdd = (recipeId: string) => {
    setSelectedMap(prev => ({ ...prev, [recipeId]: (prev[recipeId] ?? 0) + 1 }));
  };

  const handleRemove = (recipeId: string) => {
    setSelectedMap(prev => {
      const current = prev[recipeId] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[recipeId];
        return next;
      }
      return { ...prev, [recipeId]: current - 1 };
    });
  };

  const handleOrderNow = () => {
    Alert.alert('Dat ngay', `Ban da chon ${selectedCount} mon.`, [
      { text: 'Huy', style: 'cancel' },
      {
        text: 'Xac nhan',
        onPress: () => setSelectedMap({}),
      },
    ]);
  };

  const renderItem = ({ item }: { item: RecommendationItem }) => {
    const quantity = selectedMap[item.recipeId] ?? 0;
    const label = !item.evaluated ? 'Chua danh gia' : item.suitable ? 'Suitable' : 'Not Suitable';
    const badgeStyle = !item.evaluated ? styles.badgePending : item.suitable ? styles.badgeOk : styles.badgeNo;
    const badgeTextStyle = !item.evaluated ? styles.badgeTextPending : item.suitable ? styles.badgeTextOk : styles.badgeTextNo;

    return (
      <ThemedView style={styles.card}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name="restaurant-outline" size={24} color="#C1766B" />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.name} numberOfLines={1}>{item.recipeName}</ThemedText>
            <View style={[styles.badge, badgeStyle]}>
              <ThemedText style={[styles.badgeText, badgeTextStyle]}>{label}</ThemedText>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <ThemedText style={styles.score}>{item.evaluated ? `${item.score}/100` : '--/100'}</ThemedText>
          </View>
        </View>

        <View style={styles.actionGroup}>
          <Pressable style={[styles.actionBtn, quantity <= 0 && styles.actionBtnDisabled]} onPress={() => handleRemove(item.recipeId)} disabled={quantity <= 0}>
            <Ionicons name="remove" size={16} color="#C1766B" />
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => handleAdd(item.recipeId)}>
            <Ionicons name="add" size={16} color="#C1766B" />
          </Pressable>
        </View>

        {quantity > 0 ? (
          <View style={styles.qtyBubble}>
            <ThemedText style={styles.qtyText}>{quantity}</ThemedText>
          </View>
        ) : null}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Recommendation</ThemedText>
        <ThemedText style={styles.subtitle}>Danh sach mon phu hop cho ban</ThemedText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.recipeId}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, selectedCount > 0 && { paddingBottom: 110 }]}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color="#C1766B" />
              <ThemedText style={styles.emptyTitle}>Chua co mon de xuat</ThemedText>
              <ThemedText style={styles.emptyText}>Ban hay chay danh gia lai de lay du lieu recommendation.</ThemedText>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasNext ? (
            <Pressable
              style={[styles.loadMoreBtn, loadingMore && styles.loadMoreBtnDisabled]}
              onPress={() => fetchPage(page + 1, true)}
              disabled={loadingMore}
            >
              <ThemedText style={styles.loadMoreText}>{loadingMore ? 'Dang tai...' : 'Xem them'}</ThemedText>
            </Pressable>
          ) : <View style={{ height: 20 }} />
        }
      />

      {selectedCount > 0 ? (
        <View style={styles.bottomBar}>
          <View style={styles.bottomInfo}>
            <View style={styles.bottomCountBadge}>
              <Ionicons name="basket-outline" size={14} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.bottomText}>Ban da chon {selectedCount} mon</ThemedText>
          </View>
          <Pressable style={styles.orderBtn} onPress={handleOrderNow}>
            <ThemedText style={styles.orderBtnText}>Dat ngay</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 12,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    position: 'relative',
    shadowColor: '#C1766B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 68,
    height: 68,
    borderRadius: 10,
  },
  imageFallback: {
    backgroundColor: '#F8ECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOk: {
    backgroundColor: '#ECFDF3',
    borderColor: '#86EFAC',
  },
  badgeNo: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  badgePending: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextOk: {
    color: '#15803D',
  },
  badgeTextNo: {
    color: '#B91C1C',
  },
  badgeTextPending: {
    color: '#4B5563',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  score: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionGroup: {
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C1766B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  qtyBubble: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#C1766B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    opacity: 0.65,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  loadMoreBtn: {
    marginTop: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FFF7ED',
  },
  loadMoreBtnDisabled: {
    opacity: 0.6,
  },
  loadMoreText: {
    color: '#EA580C',
    fontWeight: '700',
    fontSize: 12,
  },
  bottomBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#E2A39A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#C1766B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    color: '#7E3F38',
    fontWeight: '700',
    fontSize: 13,
  },
  orderBtn: {
    backgroundColor: '#A75A50',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  orderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
