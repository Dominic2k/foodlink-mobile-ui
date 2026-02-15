import { StyleSheet, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/common/ThemedText';
import { ThemedView } from '@/components/common/ThemedView';

export default function RecommendationScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Recommendations</ThemedText>
          <ThemedText style={styles.emoji}>🍽️</ThemedText>
        </ThemedView>

        <ThemedText style={styles.subtitle}>
          Discover food suggestions just for you
        </ThemedText>

        {/* Empty state */}
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color="#C1766B" />
          <ThemedText style={styles.emptyTitle}>No Recommendations Yet</ThemedText>
          <ThemedText style={styles.emptyText}>
            We're preparing personalized food recommendations based on your preferences. Check back soon!
          </ThemedText>
        </View>
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
    marginBottom: 8,
  },
  emoji: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    marginBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
