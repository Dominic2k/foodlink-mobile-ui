import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { ThemedText } from '@/shared/components/common/ThemedText';
import { ThemedView } from '@/shared/components/common/ThemedView';
import { useAuth } from '@/features/auth/context/AuthContext';
import { userService } from '@/features/profile/services/userService';
import { UserProfile } from '@/features/profile/types';

const BRAND = '#C1766B';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async () => {
    try {
      const response = await userService.getProfile();
      setProfile(response.data);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Reload profile when screen gets focused (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push({
      pathname: '/edit-profile',
      params: {
        fullName: profile?.fullName || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        avatarUrl: profile?.avatarUrl || '',
      },
    } as any);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND} />
      </ThemedView>
    );
  }

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />}
    >
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Hồ sơ</ThemedText>
        </View>

        {/* Avatar & Info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {profile?.avatarUrl ? (
              <ThemedText style={styles.avatarInitials}>{initials}</ThemedText>
            ) : (
              <ThemedText style={styles.avatarInitials}>{initials}</ThemedText>
            )}
          </View>
          <ThemedText style={styles.userName}>{profile?.fullName || 'Chưa cập nhật'}</ThemedText>
          <ThemedText style={styles.userEmail}>{profile?.email}</ThemedText>
        </View>

        {/* Profile Info Cards */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.sectionTitle}>Thông tin cá nhân</ThemedText>

          <View style={styles.infoCard}>
            <InfoRow icon="call-outline" label="Điện thoại" value={profile?.phone} placeholder="Chưa cập nhật" />
            <View style={styles.divider} />
            <InfoRow icon="location-outline" label="Địa chỉ" value={profile?.address} placeholder="Chưa cập nhật" />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: 'rgba(193, 118, 107, 0.12)' }]}>
                <Ionicons name="create-outline" size={20} color={BRAND} />
              </View>
              <ThemedText style={styles.menuText}>Chỉnh sửa hồ sơ</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Ionicons name="settings-outline" size={20} color="#3B82F6" />
              </View>
              <ThemedText style={styles.menuText}>Cài đặt</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/family-members')}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: 'rgba(74, 144, 226, 0.12)' }]}>
                <Ionicons name="people-outline" size={20} color="#4A90E2" />
              </View>
              <ThemedText style={styles.menuText}>Quản lý gia đình</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#10B981" />
              </View>
              <ThemedText style={styles.menuText}>Trợ giúp</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          <ThemedText style={styles.logoutButtonText}>Đăng xuất</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, placeholder }: {
  icon: any;
  label: string;
  value: string | null | undefined;
  placeholder: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={18} color="#999" />
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={[styles.infoValue, !value && styles.infoPlaceholder]}>
        {value || placeholder}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 14,
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    maxWidth: '50%',
    textAlign: 'right',
  },
  infoPlaceholder: {
    color: '#BBB',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 14,
  },
  menuSection: {
    marginBottom: 24,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});
