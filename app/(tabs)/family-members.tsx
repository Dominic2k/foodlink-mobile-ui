import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import familyService from '../../services/familyService';
import { FamilyMember, Relationship } from '../../types/auth';

const RELATIONSHIP_LABELS: Record<Relationship, { label: string; icon: string; color: string }> = {
  self: { label: 'Bản thân', icon: 'account', color: '#4A90E2' },
  father: { label: 'Bố', icon: 'human-male', color: '#5C6BC0' },
  mother: { label: 'Mẹ', icon: 'human-female', color: '#EC407A' },
  child: { label: 'Con cái', icon: 'human-child', color: '#66BB6A' },
  other: { label: 'Khác', icon: 'account-question', color: '#78909C' },
};

export default function FamilyMembersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await familyService.getFamilyMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch family members:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thành viên gia đình');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [fetchMembers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const renderMember = ({ item }: { item: FamilyMember }) => {
    const config = RELATIONSHIP_LABELS[item.relationship] || RELATIONSHIP_LABELS.other;

    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => router.push({
          pathname: '/edit-family-member',
          params: { id: item.id }
        })}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
          <MaterialCommunityIcons name={config.icon as any} size={32} color={config.color} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.displayName}</Text>
          <Text style={styles.memberRelation}>{config.label}</Text>
          {item.healthConditions && item.healthConditions.length > 0 && (
            <View style={styles.badgeContainer}>
              {item.healthConditions.map((c: any) => (
                <View key={c.id} style={styles.conditionBadge}>
                  <Text style={styles.conditionText}>{c.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#BDBDBD" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B6B']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-group-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>Chưa có thành viên nào</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/edit-family-member')}
            >
              <Text style={styles.addButtonText}>Thêm thành viên</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberRelation: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionBadge: {
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 10,
    color: '#EF6C00',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
