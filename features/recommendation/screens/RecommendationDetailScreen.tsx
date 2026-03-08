import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { recommendationService } from '@/features/recommendation/services/recommendationService';
import { RecommendationItem } from '@/features/recommendation/types';

export default function RecommendationDetailScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();
  const [item, setItem] = useState<RecommendationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      if (!recipeId) {
        setLoading(false);
        return;
      }

      try {
        const data = await recommendationService.getRecommendationDetail(recipeId);
        setItem(data);
      } catch (error) {
        console.error('Failed to load recommendation detail:', error);
        setItem(null);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [recipeId]);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#C1766B" />
      </ThemedView>
    );
  }

  if (!item) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={42} color="#C1766B" />
        <ThemedText style={styles.emptyTitle}>Khong tai duoc chi tiet</ThemedText>
      </ThemedView>
    );
  }

  const statusLabel = !item.evaluated ? 'Chua danh gia' : item.suitable ? 'Suitable' : 'Not Suitable';
  const statusStyle = !item.evaluated ? styles.statusPending : item.suitable ? styles.statusSuitable : styles.statusUnsuitable;
  const statusTextStyle = !item.evaluated ? styles.statusPendingText : item.suitable ? styles.statusSuitableText : styles.statusUnsuitableText;
  const ingredients = item.ingredients ?? [];

  const fmt = (value?: number | null) => (typeof value === 'number' ? value.toFixed(2) : '--');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.heroImage} />
      ) : (
        <View style={[styles.heroImage, styles.heroFallback]}>
          <Ionicons name="restaurant-outline" size={44} color="#C1766B" />
        </View>
      )}

      <ThemedView style={styles.card}>
        <ThemedText style={styles.name}>{item.recipeName}</ThemedText>

        <View style={[styles.statusBadge, statusStyle]}>
          <ThemedText style={[styles.statusText, statusTextStyle]}>{statusLabel}</ThemedText>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <ThemedText style={styles.metaText}>
            {item.evaluated ? `${item.score}/100` : '--/100'}
          </ThemedText>
        </View>

        <View style={styles.recipeInfoRow}>
          <View style={styles.recipeInfoChip}>
            <Ionicons name="time-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.recipeInfoText}>Prep {item.prepTimeMin ?? '--'} min</ThemedText>
          </View>
          <View style={styles.recipeInfoChip}>
            <Ionicons name="flame-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.recipeInfoText}>Cook {item.cookTimeMin ?? '--'} min</ThemedText>
          </View>
          <View style={styles.recipeInfoChip}>
            <Ionicons name="people-outline" size={14} color="#8F4D44" />
            <ThemedText style={styles.recipeInfoText}>Serves {item.baseServings ?? '--'}</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Mo ta mon</ThemedText>
          <ThemedText style={styles.sectionText}>
            {item.recipeDescription?.trim() || 'Mon nay chua co mo ta.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Ly do danh gia</ThemedText>
          <ThemedText style={styles.sectionText}>
            {item.reason?.trim() || 'Mon nay chua co ly do danh gia.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>De xuat cach an</ThemedText>
          <ThemedText style={styles.sectionText}>
            {item.suggestion?.trim() || 'Mon nay chua co de xuat cach an.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Huong dan nau</ThemedText>
          <ThemedText style={styles.sectionText}>
            {item.recipeInstructions?.trim() || 'Mon nay chua co huong dan nau.'}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tong dinh duong uoc tinh</ThemedText>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Calories</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.calories)}</ThemedText>
            </View>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Protein (g)</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.protein)}</ThemedText>
            </View>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Carb (g)</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.carb)}</ThemedText>
            </View>
            <View style={styles.nutritionCell}>
              <ThemedText style={styles.nutritionLabel}>Fat (g)</ThemedText>
              <ThemedText style={styles.nutritionValue}>{fmt(item.nutritionSummary?.fat)}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.coverageText}>
            Da tinh duoc {item.nutritionSummary?.coveredIngredients ?? 0}/{item.nutritionSummary?.totalIngredients ?? 0} nguyen lieu
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Nguyen lieu</ThemedText>
          {ingredients.length === 0 ? (
            <ThemedText style={styles.sectionText}>Mon nay chua co danh sach nguyen lieu.</ThemedText>
          ) : (
            ingredients.map((ingredient, index) => (
              <View key={`${ingredient.ingredientId ?? ingredient.ingredientName}-${index}`} style={styles.ingredientRow}>
                <View style={styles.ingredientTop}>
                  <ThemedText style={styles.ingredientName}>
                    {ingredient.ingredientName} {ingredient.optional ? '(optional)' : ''}
                  </ThemedText>
                  <ThemedText style={styles.ingredientQty}>
                    {ingredient.quantity ?? '--'} {ingredient.unit ?? ''}
                  </ThemedText>
                </View>
                <ThemedText style={styles.ingredientNutrition}>
                  Cal {fmt(ingredient.calories)} | P {fmt(ingredient.protein)} | C {fmt(ingredient.carb)} | F {fmt(ingredient.fat)}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 24,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F7F7F7',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8ECEA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0D9D5',
    padding: 14,
    gap: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  statusSuitable: {
    backgroundColor: '#ECFDF3',
    borderColor: '#86EFAC',
  },
  statusUnsuitable: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPendingText: {
    color: '#4B5563',
  },
  statusSuitableText: {
    color: '#15803D',
  },
  statusUnsuitableText: {
    color: '#B91C1C',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  recipeInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recipeInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E8C7C2',
    backgroundColor: '#FFF7F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  recipeInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F4D44',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8F4D44',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionCell: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#F0D9D5',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#FFFDFC',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#8F4D44',
    fontWeight: '600',
  },
  nutritionValue: {
    marginTop: 4,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '800',
  },
  coverageText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  ingredientRow: {
    borderWidth: 1,
    borderColor: '#F0D9D5',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 4,
  },
  ingredientTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  ingredientQty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8F4D44',
  },
  ingredientNutrition: {
    fontSize: 12,
    color: '#475569',
  },
});
