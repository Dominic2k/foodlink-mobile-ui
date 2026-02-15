import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import familyService from '../../services/familyService';
import { Relationship, Gender, ActivityLevel, HealthCondition, FamilyMemberRequest } from '../../types/auth';

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: 'father', label: 'Bố' },
  { value: 'mother', label: 'Mẹ' },
  { value: 'child', label: 'Con cái' },
  { value: 'other', label: 'Khác' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Vừa' },
  { value: 'high', label: 'Cao' },
];

const INITIAL_FORM: FamilyMemberRequest = {
  displayName: '',
  relationship: 'other',
  gender: 'male',
  birthDate: new Date().toISOString().split('T')[0],
  heightCm: undefined,
  weightKg: undefined,
  activityLevel: 'medium',
  healthNotes: '',
  conditionIds: [],
};

export default function EditFamilyMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  
  const [form, setForm] = useState<FamilyMemberRequest>(INITIAL_FORM);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [allConditions, members] = await Promise.all([
        familyService.getHealthConditions(),
        isEdit ? familyService.getFamilyMembers() : Promise.resolve([]),
      ]);
      
      setConditions(allConditions);

      if (isEdit) {
        const member = members.find((m: any) => m.id === id);
        if (member) {
          setForm({
            displayName: member.displayName,
            relationship: member.relationship,
            gender: member.gender,
            birthDate: member.birthDate || new Date().toISOString().split('T')[0],
            heightCm: member.heightCm,
            weightKg: member.weightKg,
            activityLevel: member.activityLevel,
            healthNotes: member.healthNotes || '',
            conditionIds: member.healthConditions.map((c: any) => c.id),
          });
        }
      } else {
        setForm(INITIAL_FORM);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu thành viên');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thành viên');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await familyService.updateFamilyMember(id, form);
        Alert.alert('Thành công', 'Đã cập nhật thông tin thành viên');
      } else {
        await familyService.addFamilyMember(form);
        Alert.alert('Thành công', 'Đã thêm thành viên mới');
      }
      router.navigate('/family-members');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa thành viên này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await familyService.deleteFamilyMember(id!);
              router.navigate('/family-members');
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa thành viên');
            }
          } 
        },
      ]
    );
  };

  const toggleCondition = (conditionId: string) => {
    const current = new Set(form.conditionIds);
    if (current.has(conditionId)) {
      current.delete(conditionId);
    } else {
      current.add(conditionId);
    }
    setForm({ ...form, conditionIds: Array.from(current) });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>Tên hiển thị *</Text>
        <TextInput
          style={styles.input}
          value={form.displayName}
          onChangeText={(text) => setForm({ ...form, displayName: text })}
          placeholder="Ví dụ: Bố, Mẹ, Tên con..."
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Quan hệ</Text>
        <View style={styles.row}>
          {RELATIONSHIPS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.chip,
                form.relationship === r.value && styles.chipActive,
                form.relationship === 'self' && r.value !== 'self' && styles.chipDisabled
              ]}
              onPress={() => form.relationship !== 'self' && setForm({ ...form, relationship: r.value })}
              disabled={form.relationship === 'self'}
            >
              <Text style={[styles.chipText, form.relationship === r.value && styles.chipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
          {form.relationship === 'self' && (
            <TouchableOpacity style={[styles.chip, styles.chipActive]}>
              <Text style={[styles.chipText, styles.chipTextActive]}>Bản thân</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.rowContainer}>
        <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={[styles.genderChip, form.gender === g.value && styles.genderChipActive]}
                onPress={() => setForm({ ...form, gender: g.value })}
              >
                <Text style={[styles.chipText, form.gender === g.value && styles.chipTextActive]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Ngày sinh</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialCommunityIcons name="calendar" size={20} color="#FF6B6B" />
          <Text style={styles.dateText}>{form.birthDate}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(form.birthDate || Date.now())}
            mode="date"
            display="default"
            onChange={(event: any, date?: Date) => {
              setShowDatePicker(false);
              if (date) {
                setForm({ ...form, birthDate: date.toISOString().split('T')[0] });
              }
            }}
          />
        )}
      </View>

      <View style={styles.rowContainer}>
        <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Chiều cao (cm)</Text>
          <TextInput
            style={styles.input}
            value={form.heightCm?.toString()}
            onChangeText={(text) => setForm({ ...form, heightCm: text ? parseFloat(text) : undefined })}
            keyboardType="numeric"
            placeholder="170"
          />
        </View>
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.label}>Cân nặng (kg)</Text>
          <TextInput
            style={styles.input}
            value={form.weightKg?.toString()}
            onChangeText={(text) => setForm({ ...form, weightKg: text ? parseFloat(text) : undefined })}
            keyboardType="numeric"
            placeholder="60"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Mức độ hoạt động</Text>
        <View style={styles.row}>
          {ACTIVITY_LEVELS.map((a) => (
            <TouchableOpacity
              key={a.value}
              style={[styles.chip, form.activityLevel === a.value && styles.chipActive]}
              onPress={() => setForm({ ...form, activityLevel: a.value })}
            >
              <Text style={[styles.chipText, form.activityLevel === a.value && styles.chipTextActive]}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tình trạng sức khỏe/Bệnh lý</Text>
        <View style={styles.conditionContainer}>
          {conditions.map((c) => {
            const isSelected = form.conditionIds?.includes(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.conditionChip, isSelected && styles.conditionChipActive]}
                onPress={() => toggleCondition(c.id)}
              >
                <Text style={[styles.conditionChipText, isSelected && styles.conditionChipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Ghi chú sức khỏe</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.healthNotes}
          onChangeText={(text) => setForm({ ...form, healthNotes: text })}
          multiline
          numberOfLines={4}
          placeholder="Nhập ghi chú thêm về tình trạng sức khỏe..."
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.saveButtonText}>Lưu thông tin</Text>
        )}
      </TouchableOpacity>

      {isEdit && form.relationship !== 'self' && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF5252" />
          <Text style={styles.deleteButtonText}>Xóa thành viên</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#FF6B6B',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  genderChip: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  genderChipActive: {
    backgroundColor: '#FF6B6B',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  conditionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionChip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  conditionChipActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
  },
  conditionChipText: {
    fontSize: 13,
    color: '#757575',
  },
  conditionChipTextActive: {
    color: '#EF6C00',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
  },
  deleteButtonText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
