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
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { familyService } from '@/features/family/services/familyService';
import {
  Relationship, Gender, ActivityLevel, Severity,
  HealthCondition, Ingredient, AllergyRequest, FamilyMemberRequest,
} from '@/features/family/types';

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

const SEVERITIES: { value: Severity; label: string; color: string }[] = [
  { value: 'mild', label: 'Nhẹ', color: '#66BB6A' },
  { value: 'medium', label: 'Trung bình', color: '#FFA726' },
  { value: 'severe', label: 'Nghiêm trọng', color: '#EF5350' },
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
  allergies: [],
};

export default function EditFamilyMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  const [form, setForm] = useState<FamilyMemberRequest>(INITIAL_FORM);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [allConditions, allIngredients, members] = await Promise.all([
        familyService.getHealthConditions(),
        familyService.getIngredients(),
        isEdit ? familyService.getFamilyMembers() : Promise.resolve([]),
      ]);
      
      setConditions(allConditions);
      setIngredients(allIngredients);

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
            allergies: member.allergies?.map((a: any) => ({
              ingredientId: a.ingredientId,
              severity: a.severity,
            })) || [],
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

  const toggleAllergy = (ingredientId: string) => {
    const allergies = [...(form.allergies || [])];
    const idx = allergies.findIndex(a => a.ingredientId === ingredientId);
    if (idx >= 0) {
      allergies.splice(idx, 1);
    } else {
      allergies.push({ ingredientId, severity: 'medium' });
    }
    setForm({ ...form, allergies });
  };

  const updateAllergySeverity = (ingredientId: string, severity: Severity) => {
    const allergies = (form.allergies || []).map(a =>
      a.ingredientId === ingredientId ? { ...a, severity } : a
    );
    setForm({ ...form, allergies });
  };

  const getAllergyForIngredient = (ingredientId: string): AllergyRequest | undefined => {
    return (form.allergies || []).find(a => a.ingredientId === ingredientId);
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

      {/* Allergy Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Nguyên liệu dị ứng</Text>
        <Text style={styles.sublabel}>Chọn nguyên liệu mà thành viên bị dị ứng và mức độ</Text>
        <View style={styles.allergyContainer}>
          {ingredients.map((ingredient) => {
            const allergy = getAllergyForIngredient(ingredient.id);
            const isSelected = !!allergy;
            return (
              <View key={ingredient.id} style={styles.allergyItem}>
                <TouchableOpacity
                  style={[styles.allergyChip, isSelected && styles.allergyChipActive]}
                  onPress={() => toggleAllergy(ingredient.id)}
                >
                  <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={18}
                    color={isSelected ? '#EF5350' : '#BDBDBD'}
                  />
                  <Text style={[styles.allergyChipText, isSelected && styles.allergyChipTextActive]}>
                    {ingredient.name}
                  </Text>
                </TouchableOpacity>
                {isSelected && (
                  <View style={styles.severityRow}>
                    {SEVERITIES.map((s) => (
                      <TouchableOpacity
                        key={s.value}
                        style={[
                          styles.severityChip,
                          allergy?.severity === s.value && { backgroundColor: s.color + '20', borderColor: s.color },
                        ]}
                        onPress={() => updateAllergySeverity(ingredient.id, s.value)}
                      >
                        <View style={[styles.severityDot, { backgroundColor: s.color }]} />
                        <Text
                          style={[
                            styles.severityChipText,
                            allergy?.severity === s.value && { color: s.color, fontWeight: '600' },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
  sublabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 12,
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
  // Allergy styles
  allergyContainer: {
    gap: 4,
  },
  allergyItem: {
    marginBottom: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  allergyChipActive: {
    // active state handled by icon color
  },
  allergyChipText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  allergyChipTextActive: {
    color: '#333',
    fontWeight: '500',
  },
  severityRow: {
    flexDirection: 'row',
    marginLeft: 30,
    marginTop: 4,
  },
  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  severityChipText: {
    fontSize: 11,
    color: '#757575',
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
