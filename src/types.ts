export interface PersonalityTraits {
  extroversion: number; // 0-100
  emotionalStability: number;
  openness: number;
  conscientiousness: number;
  agreeableness: number;
}

export interface LifestyleTraits {
  drinking: '전혀안함' | '가끔' | '자주';
  smoking: '비흡연' | '흡연';
  exercise: '안함' | '주 1~2회' | '주 3회 이상';
  travel: '집돌이/집순이' | '가끔여행' | '여행마니아';
}

export interface MarriageValues {
  marriageIntent: number; // 0-100
  children: '원함' | '상관없음' | '원치않음';
  dualIncome: '필수선호' | '상관없음' | '외벌이선호';
  familyImportance: number; // 0-100
}

export interface RelationshipStyle {
  communication: number; // 0-100 (대화/소통)
  affectionExpression: number; // 애정표현
  independence: number; // 독립성
  stability: number; // 안정성
}

export interface SelfProfile {
  age: number;
  gender: '남성' | '여성';
  region: string;
  height: number;
  occupationGroup: string; // 전문직, 대기업, 공기업/공무원, IT/개발, 사업가, 금융/증권, 의료, 교육, 기타
  personality: PersonalityTraits;
  lifestyle: LifestyleTraits;
  marriage: MarriageValues;
  relationship: RelationshipStyle;
}

export type ImportanceLevel = 'must' | 'nice' | 'any'; // ❤️ 꼭 중요함, 🙂 가능하면 중요함, 👌 크게 상관없음

export interface ConditionPreference<T> {
  value: T;
  importance: ImportanceLevel;
  dealBreaker?: boolean;
}

export interface IdealProfile {
  ageMin: number;
  ageMax: number;
  ageImportance: ImportanceLevel;
  ageDealBreaker: boolean;

  heightMin: number;
  heightImportance: ImportanceLevel;

  regions: string[];
  regionImportance: ImportanceLevel;

  occupations: string[];
  occupationImportance: ImportanceLevel;

  smokingPreferred: '비흡연만' | '상관없음';
  smokingDealBreaker: boolean;

  drinkingPreferred: '비흡연/금주만' | '적당히' | '상관없음';
  
  childrenPreferred: '원함' | '원치않음' | '상관없음';
  dualIncomePreferred: '맞벌이선호' | '외벌이선호' | '상관없음';

  priorityTraits: {
    warmth: number;
    extroversion: number;
    responsibility: number;
    communication: number;
  };
}

// 10 Dimensions for 100 point allocation & analysis
export type DimensionKey =
  | 'appearance'        // 외모
  | 'personality'       // 성격
  | 'communication'     // 대화/소통
  | 'career'            // 직업
  | 'economics'         // 경제력
  | 'age'               // 나이
  | 'lifestyle'         // 생활방식
  | 'family'            // 가족관
  | 'hobbies'           // 취미
  | 'marriageValues';   // 결혼가치관

export type DimensionsWeights = Record<DimensionKey, number>;

export interface VirtualProfileChoice {
  round: number;
  profileA: Candidate;
  profileB: Candidate;
  chosenId: string; // 'A' or 'B' or candidate ID
}

export interface Candidate {
  id: string;
  name: string;
  age: number;
  gender: '남성' | '여성';
  region: string;
  height: number;
  occupationGroup: string;
  occupationDetail: string;
  avatarUrl?: string;
  summaryQuote: string;
  badgeTags: string[];
  
  // Attribute ratings (0-100) for matching calculation
  scores: Record<DimensionKey, number>;
  
  // Candidate's own self profile
  selfProfile: SelfProfile;

  // Candidate's preferences for reverse matching
  preference: {
    ageMin: number;
    ageMax: number;
    heightMin: number;
    smokingPreferred: string;
    preferredOccupations: string[];
    importanceWeights: Partial<DimensionsWeights>;
  };
}

export interface SingleCandidateResult {
  candidate: Candidate;
  userToCandidate: number;
  candidateToUser: number;
  mutualScore: number;
  passesDealBreakers: boolean;
}

export interface FlexibilityResult {
  conditionLabel: string;
  category: 'age' | 'height' | 'occupation' | 'region';
  originalPoolCount: number;
  newPoolCount: number;
  increasePercent: number;
  isDealBreaker: boolean;
}

export interface DynamicCTAInfo {
  title: string;
  subtitle: string;
  buttonText: string;
  caseType: 'A' | 'B' | 'C' | 'Default';
}

export interface LoveMatchTestResult {
  selfProfile: SelfProfile;
  idealProfile: IdealProfile;
  explicitWeight: DimensionsWeights;
  implicitWeight: DimensionsWeights;
  finalWeight: DimensionsWeights;
  
  archetype: {
    title: string;
    description: string;
    code: string;
  };

  explicitVsActual: {
    dimension: DimensionKey;
    label: string;
    explicitPct: number;
    implicitPct: number;
    finalPct: number;
  }[];

  preferenceConsistency: number; // 이상형 자기이해도 (0-100%)
  consistencyComment: string;

  candidateResults: SingleCandidateResult[];
  mutualCandidates: SingleCandidateResult[];
  mutualZoneCandidates: SingleCandidateResult[]; // High mutual match overlapping zone
  
  rarityCount: number; // e.g. 84 candidates out of 1000
  rarityPercent: number; // e.g. 8.4%
  rarityComment: string;

  flexibility: FlexibilityResult[];

  attractedTypes: string[];
  attractedToUserTypes: string[];

  cta: DynamicCTAInfo;
}

export interface LeadConsultation {
  name: string;
  phone: string;
  preferredTime: string;
  notes?: string;
  consent: boolean;
}

export type ConsultationStatus = '대기' | '상담예약' | '상담완료' | '보류' | '미신청';

export interface SavedUserRecord {
  id: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  completionStep: number; // 1 ~ 6
  hasCompletedTest: boolean;
  hasLeadConsultation: boolean;
  leadStatus: ConsultationStatus;
  adminNotes?: string;
  
  // Lead info if submitted
  leadInfo?: {
    name: string;
    phone: string;
    preferredTime: string;
    consent: boolean;
    submittedAt: string;
  };

  // User input data
  selfProfile?: SelfProfile;
  idealProfile?: IdealProfile;
  explicitWeight?: DimensionsWeights;
  implicitWeight?: DimensionsWeights;
  
  // Computed simulation summaries
  summary?: {
    archetypeTitle: string;
    archetypeCode: string;
    archetypeDescription: string;
    preferenceConsistency: number;
    consistencyComment: string;
    rarityPercent: number;
    rarityCount: number;
    rarityComment: string;
    mutualMatchCount: number;
    topMutualScore: number;
    attractedTypes: string[];
    attractedToUserTypes: string[];
    recommendedAdjustment?: string;
    ctaTitle?: string;
    ctaButtonText?: string;
  };
}

export interface AdminFilterOptions {
  searchQuery?: string;
  status?: ConsultationStatus | 'ALL' | 'LEADS_ONLY';
  gender?: '전체' | '남성' | '여성';
  region?: string;
  occupation?: string;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  sortBy?: 'latest' | 'oldest' | 'rarity_desc' | 'consistency_desc' | 'lead_first';
}

export interface AdminStats {
  totalRecords: number;
  totalLeads: number;
  conversionRate: number;
  maleCount: number;
  femaleCount: number;
  avgAge: number;
  avgRarity: number;
  avgConsistency: number;
  topOccupation: string;
  topArchetype: string;
  pendingLeadsCount: number;
}

export interface ConsultationPayload {
  customer: {
    name: string;
    phone: string;
    age: number;
    gender: string;
    region: string;
    preferredTime: string;
  };
  relationshipIntent: number;
  topPriorities: string[];
  dealBreakers: string[];
  explicitPreference: Partial<Record<DimensionKey, number>>;
  behavioralPreference: Partial<Record<DimensionKey, number>>;
  preferredType: string;
  mutualType: string;
  rarity: number;
  recommendedAdjustment: string;
  testCompletion: number;
}
