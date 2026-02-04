import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import { ThemedText } from '@/components/common/ThemedText';
import { ThemedView } from '@/components/common/ThemedView';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Welcome to FoodLink!</ThemedText>
        </ThemedView>
        
        {user?.username && (
          <ThemedView style={styles.userInfo}>
            <ThemedText type="subtitle">Hello, {user.username}!</ThemedText>
            {user.role && <ThemedText>Role: {user.role}</ThemedText>}
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

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <ThemedText style={styles.logoutButtonText}>🚪 Logout</ThemedText>
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  userInfo: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 150, 136, 0.1)',
    borderRadius: 12,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
