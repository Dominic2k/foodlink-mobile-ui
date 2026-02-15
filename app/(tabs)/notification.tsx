import { StyleSheet, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/common/ThemedText';
import { ThemedView } from '@/components/common/ThemedView';

export default function NotificationScreen() {
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Notifications</ThemedText>
          <ThemedText style={styles.emoji}>🔔</ThemedText>
        </ThemedView>

        <ThemedText style={styles.subtitle}>
          Stay updated with the latest
        </ThemedText>

        {/* Empty state */}
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={64} color="#C1766B" />
          <ThemedText style={styles.emptyTitle}>No Notifications</ThemedText>
          <ThemedText style={styles.emptyText}>
            You're all caught up! New notifications will appear here when you receive them.
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
