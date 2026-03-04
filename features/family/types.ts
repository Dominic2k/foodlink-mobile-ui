export interface HealthCondition {
  id: string;
  code: string;
  name: string;
}

export type Relationship = 'self' | 'father' | 'mother' | 'child' | 'other';
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'low' | 'medium' | 'high';
export type Severity = 'mild' | 'medium' | 'severe';

export interface Ingredient {
  id: string;
  name: string;
  category?: string;
  defaultUnit?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface MemberAllergy {
  id: string;
  ingredientId: string;
  ingredientName: string;
  severity: Severity;
}

export interface AllergyRequest {
  ingredientId: string;
  severity: Severity;
}

export interface FamilyMember {
  id: string;
  displayName: string;
  relationship: Relationship;
  gender?: Gender;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  healthNotes?: string;
  healthConditions: HealthCondition[];
  allergies: MemberAllergy[];
}

export interface FamilyMemberRequest {
  displayName: string;
  relationship: Relationship;
  gender?: Gender;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  healthNotes?: string;
  conditionIds?: string[];
  allergies?: AllergyRequest[];
}
