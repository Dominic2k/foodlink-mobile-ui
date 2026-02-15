import { StyleSheet, ScrollView } from 'react-native';

import { ThemedText } from '@/components/common/ThemedText';
import { ThemedView } from '@/components/common/ThemedView';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome to FoodLink!</ThemedText>
          <ThemedText style={styles.emoji}>🍜</ThemedText>
        </ThemedView>
        
        {user?.username && (
          <ThemedView style={styles.userInfo}>
            <ThemedText type="subtitle">Hello, {user.username}! 👋</ThemedText>
          </ThemedView>
        )}
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Your Food Companion</ThemedText>
          <ThemedText>
            Discover amazing food experiences and connect with fellow food lovers.
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Getting Started</ThemedText>
          <ThemedText>
            Explore the app to find restaurants, recipes, and food recommendations.
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
