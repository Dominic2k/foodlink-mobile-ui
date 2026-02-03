import { StyleSheet, ScrollView } from 'react-native';

import { ThemedText } from '@/components/common/ThemedText';
import { ThemedView } from '@/components/common/ThemedView';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Explore</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Discover Food</ThemedText>
          <ThemedText>
            Find new restaurants, trending dishes, and hidden gems in your area.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recipes</ThemedText>
          <ThemedText>
            Browse curated recipes from our community of food enthusiasts.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Food Reviews</ThemedText>
          <ThemedText>
            Read honest reviews from fellow food lovers before trying a new place.
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
    marginBottom: 24,
  },
  section: {
    gap: 8,
    marginBottom: 20,
  },
});
