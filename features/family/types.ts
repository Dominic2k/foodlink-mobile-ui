export interface HealthCondition {
  id: string;
  code: string;
  name: string;
}

export type Relationship = 'self' | 'father' | 'mother' | 'child' | 'other';
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'low' | 'medium' | 'high';

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
}
