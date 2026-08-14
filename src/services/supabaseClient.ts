import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedUserRecord, ConsultationStatus } from '../types';

export const SUPABASE_STORAGE_CONFIG_KEY = 'love_balance_supabase_custom_config_v1';
export const TABLE_TEST_SUBMISSIONS = 'test_submissions';
export const TABLE_CONSULTATIONS = 'consultations';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// UUID generator and validator helper
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ensureValidUUID(id?: string): string {
  if (!id) return generateUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  // If id is in legacy rec_... format, deterministically generate or return new UUID
  return generateUUID();
}

// Status Mappings between UI (한국어) and Database (English status)
export function mapStatusToDb(status?: ConsultationStatus): 'pending' | 'contacted' | 'completed' | 'cancelled' {
  switch (status) {
    case '상담예약':
    case '연락완료' as any:
      return 'contacted';
    case '상담완료':
      return 'completed';
    case '보류':
    case '취소' as any:
      return 'cancelled';
    case '대기':
    case '미신청':
    default:
      return 'pending';
  }
}

export function mapStatusFromDb(status?: string): ConsultationStatus {
  switch (status) {
    case 'contacted':
      return '상담예약';
    case 'completed':
      return '상담완료';
    case 'cancelled':
      return '보류';
    case 'pending':
    default:
      return '대기';
  }
}

// SQL Schema Definition for 1-click copy & paste in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- =======================================================
-- LOVE BALANCE 2 - Supabase 데이터베이스 스키마
-- =======================================================

-- 1. UUID 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------
-- 2. 테스트 참여 및 매칭 분석 결과 테이블 (test_submissions)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- [Step 1] 본인 기본 정보 (빠른 검색 및 필터링용 독립 컬럼)
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('남성', '여성')),
    region VARCHAR(50) NOT NULL,
    height INT NOT NULL,
    occupation_group VARCHAR(50) NOT NULL,
    
    -- [Step 1] 본인 세부 프로필 (성격, 라이프스타일, 결혼관, 연애스타일)
    self_profile JSONB NOT NULL,
    
    -- [Step 2] 이상형 조건 (연령대, 키, 지역, 직업, 흡연/음주, Deal Breaker 등)
    ideal_profile JSONB NOT NULL,
    
    -- [Step 3 & 4] 가중치 데이터 (명시적 경매 점수, 암묵적 행동 가중치, 최종 가중치)
    explicit_weights JSONB NOT NULL,
    implicit_weights JSONB NOT NULL,
    final_weights JSONB NOT NULL,
    
    -- [Step 6] 분석 결과 주요 지표
    archetype_code VARCHAR(50),       -- 예: 'LOGICAL_REALIST'
    archetype_title VARCHAR(100),      -- 예: '현실적인 조건 탐색가'
    consistency_percent NUMERIC(5, 2),  -- 이상형 자기이해도 (%)
    rarity_percent NUMERIC(5, 2),       -- 이상형 희소도 (%)
    
    -- [Step 6] 분석 리포트 전체 데이터 (매칭 결과, 유연성 리포트, 추천 타입 등)
    full_report JSONB NOT NULL
);

-- -------------------------------------------------------
-- 3. 1:1 커플매니저 상담 신청 관리 테이블 (consultations)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 해당 사용자의 매칭 테스트 결과 연동 (외래키)
    submission_id UUID REFERENCES public.test_submissions(id) ON DELETE SET NULL,
    
    -- 고객 신청 정보
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    preferred_time VARCHAR(50) NOT NULL,
    consent BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- 관리자 처리 상태 ('pending': 대기중, 'contacted': 연락완료, 'completed': 상담완료, 'cancelled': 취소)
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled')),
    
    -- 매니저 스크립트 제공용 구조화 데이터
    manager_payload JSONB,
    
    -- 관리자 전용 상담 메모
    admin_notes TEXT
);

-- -------------------------------------------------------
-- 4. 인덱스(Index) 생성 - 관리자 대시보드 조회 성능 최적화
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_test_submissions_created_at ON public.test_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_submissions_gender_age ON public.test_submissions(gender, age);
CREATE INDEX IF NOT EXISTS idx_test_submissions_archetype ON public.test_submissions(archetype_code);

CREATE INDEX IF NOT EXISTS idx_consultations_status ON public.consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON public.consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_phone ON public.consultations(phone);

-- -------------------------------------------------------
-- 5. consultations 테이블 updated_at 자동 업데이트 트리거
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_consultations_updated_at ON public.consultations;
CREATE TRIGGER set_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- 6. Supabase 행 수준 보안 (Row Level Security - RLS) 설정
-- -------------------------------------------------------
ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- 기존 정책 리셋
DROP POLICY IF EXISTS "Enable insert for anon users on test_submissions" ON public.test_submissions;
DROP POLICY IF EXISTS "Enable insert for anon users on consultations" ON public.consultations;
DROP POLICY IF EXISTS "Enable select for all on test_submissions" ON public.test_submissions;
DROP POLICY IF EXISTS "Enable select for all on consultations" ON public.consultations;
DROP POLICY IF EXISTS "Enable update for all on consultations" ON public.consultations;
DROP POLICY IF EXISTS "Enable delete for all on consultations" ON public.consultations;
DROP POLICY IF EXISTS "Enable delete for all on test_submissions" ON public.test_submissions;

-- 웹사이트 방문자(익명) INSERT 허용
CREATE POLICY "Enable insert for anon users on test_submissions"
    ON public.test_submissions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable insert for anon users on consultations"
    ON public.consultations FOR INSERT
    WITH CHECK (true);

-- 관리자 대시보드 조회 및 관리용 SELECT/UPDATE/DELETE 허용
CREATE POLICY "Enable select for all on test_submissions"
    ON public.test_submissions FOR SELECT
    USING (true);

CREATE POLICY "Enable select for all on consultations"
    ON public.consultations FOR SELECT
    USING (true);

CREATE POLICY "Enable update for all on consultations"
    ON public.consultations FOR UPDATE
    USING (true);

CREATE POLICY "Enable delete for all on consultations"
    ON public.consultations FOR DELETE
    USING (true);

CREATE POLICY "Enable delete for all on test_submissions"
    ON public.test_submissions FOR DELETE
    USING (true);
`;

// Memory cache for runtime synced config
let runtimeSyncedConfig: SupabaseConfig | null = null;

// Auto-sync config from server API once on app load
if (typeof window !== 'undefined') {
  fetch('/api/supabase-config')
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.config && data.config.url && data.config.anonKey) {
        runtimeSyncedConfig = data.config;
        localStorage.setItem(SUPABASE_STORAGE_CONFIG_KEY, JSON.stringify(data.config));
      }
    })
    .catch(() => {});
}

// Helper to get active Supabase credentials
export function getSupabaseConfig(): SupabaseConfig | null {
  // 1. Check runtime synced config in memory
  if (runtimeSyncedConfig && runtimeSyncedConfig.url && runtimeSyncedConfig.anonKey) {
    return runtimeSyncedConfig;
  }

  // 2. Check Vite Environment Variables
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey && !envUrl.includes('your-project') && !envKey.includes('your-anon-key')) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  // 3. Check Custom LocalStorage Config
  try {
    const custom = localStorage.getItem(SUPABASE_STORAGE_CONFIG_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
      }
    }
  } catch (err) {
    console.error('Failed to read custom supabase config:', err);
  }

  return null;
}

export function saveCustomSupabaseConfig(config: SupabaseConfig | null) {
  if (!config || !config.url || !config.anonKey) {
    runtimeSyncedConfig = null;
    localStorage.removeItem(SUPABASE_STORAGE_CONFIG_KEY);
    // Broadcast clear to server
    fetch('/api/supabase-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: '', anonKey: '' }),
    }).catch(() => {});
  } else {
    runtimeSyncedConfig = { url: config.url.trim(), anonKey: config.anonKey.trim() };
    localStorage.setItem(SUPABASE_STORAGE_CONFIG_KEY, JSON.stringify(runtimeSyncedConfig));
    // Broadcast to server to persist for all devices
    fetch('/api/supabase-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(runtimeSyncedConfig),
    }).catch(() => {});
  }
}

// Lazy Supabase client instance
let supabaseInstance: SupabaseClient | null = null;
let currentConfigHash: string = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config) {
    supabaseInstance = null;
    currentConfigHash = '';
    return null;
  }

  const hash = `${config.url}_${config.anonKey}`;
  if (!supabaseInstance || currentConfigHash !== hash) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: { persistSession: false },
      });
      currentConfigHash = hash;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      supabaseInstance = null;
    }
  }
  return supabaseInstance;
}

// Convert SavedUserRecord to test_submissions DB Row
export function recordToSubmissionRow(record: SavedUserRecord) {
  const self = record.selfProfile || ({} as any);
  const ideal = record.idealProfile || ({} as any);
  const exp = record.explicitWeight || {};
  const imp = record.implicitWeight || {};
  const sum = record.summary || ({} as any);

  // Compute final weights (average of explicit & implicit if not defined)
  const finalWeights: Record<string, number> = {};
  const dimensions = ['appearance', 'personality', 'communication', 'career', 'economics', 'age', 'lifestyle', 'family', 'hobbies', 'marriageValues'];
  for (const d of dimensions) {
    const e = (exp as any)[d] ?? 10;
    const i = (imp as any)[d] ?? 10;
    finalWeights[d] = Math.round((e + i) / 2);
  }

  return {
    id: ensureValidUUID(record.id),
    created_at: record.createdAt || new Date().toISOString(),
    age: Number(self.age) || 28,
    gender: (self.gender === '여성' ? '여성' : '남성') as '남성' | '여성',
    region: self.region || '서울',
    height: Number(self.height) || (self.gender === '여성' ? 163 : 177),
    occupation_group: self.occupationGroup || '기타',
    self_profile: self,
    ideal_profile: ideal,
    explicit_weights: exp,
    implicit_weights: imp,
    final_weights: finalWeights,
    archetype_code: sum.archetypeCode || 'BALANCE_EXPLORER',
    archetype_title: sum.archetypeTitle || '균형잡힌 가치관 탐색가',
    consistency_percent: Number(sum.preferenceConsistency) || 85.0,
    rarity_percent: Number(sum.rarityPercent) || 7.5,
    full_report: {
      summary: sum,
      completionStep: record.completionStep ?? 6,
      hasCompletedTest: record.hasCompletedTest ?? true,
    },
  };
}

// Convert SavedUserRecord to consultations DB Row
export function recordToConsultationRow(record: SavedUserRecord) {
  const lead = record.leadInfo || ({} as any);
  return {
    submission_id: ensureValidUUID(record.id),
    created_at: lead.submittedAt || record.createdAt || new Date().toISOString(),
    updated_at: record.updatedAt || new Date().toISOString(),
    name: lead.name || '미등록',
    phone: lead.phone || '010-0000-0000',
    preferred_time: lead.preferredTime || '무관 (빠른 상담)',
    consent: lead.consent !== false,
    status: mapStatusToDb(record.leadStatus),
    manager_payload: {
      selfProfile: record.selfProfile,
      idealProfile: record.idealProfile,
      summary: record.summary,
      adminNotes: record.adminNotes,
    },
    admin_notes: record.adminNotes || '',
  };
}

// Merge test_submissions and consultations into SavedUserRecord
export function mergeDbRowsToRecord(submission: any, consultation?: any): SavedUserRecord {
  const fullReport = submission?.full_report || {};
  const summary = fullReport.summary || {};
  const selfProfile = submission?.self_profile || {};
  const idealProfile = submission?.ideal_profile || {};
  const explicitWeight = submission?.explicit_weights || {};
  const implicitWeight = submission?.implicit_weights || {};

  const hasLead = !!consultation;
  const leadStatus = consultation ? mapStatusFromDb(consultation.status) : '미신청';

  return {
    id: submission?.id || consultation?.submission_id || generateUUID(),
    createdAt: submission?.created_at || consultation?.created_at || new Date().toISOString(),
    updatedAt: consultation?.updated_at || submission?.created_at || new Date().toISOString(),
    completionStep: fullReport.completionStep ?? (submission ? 6 : 1),
    hasCompletedTest: fullReport.hasCompletedTest ?? (!!submission),
    hasLeadConsultation: hasLead,
    leadStatus,
    adminNotes: consultation?.admin_notes || '',
    leadInfo: consultation
      ? {
          name: consultation.name,
          phone: consultation.phone,
          preferredTime: consultation.preferred_time,
          consent: consultation.consent !== false,
          submittedAt: consultation.created_at,
        }
      : undefined,
    selfProfile: {
      age: submission?.age ?? selfProfile.age ?? 28,
      gender: submission?.gender ?? selfProfile.gender ?? '남성',
      region: submission?.region ?? selfProfile.region ?? '서울',
      height: submission?.height ?? selfProfile.height ?? 175,
      occupationGroup: submission?.occupation_group ?? selfProfile.occupationGroup ?? '기타',
      personality: selfProfile.personality || { extroversion: 50, emotionalStability: 50, openness: 50, conscientiousness: 50, agreeableness: 50 },
      lifestyle: selfProfile.lifestyle || { drinking: '가끔', smoking: '비흡연', exercise: '주 1~2회', travel: '가끔여행' },
      marriage: selfProfile.marriage || { marriageIntent: 80, children: '원함', dualIncome: '필수선호', familyImportance: 80 },
      relationship: selfProfile.relationship || { communication: 80, affectionExpression: 80, independence: 50, stability: 80 },
    },
    idealProfile,
    explicitWeight,
    implicitWeight,
    summary: {
      archetypeTitle: submission?.archetype_title || summary.archetypeTitle || '가치관 탐색가',
      archetypeCode: submission?.archetype_code || summary.archetypeCode || 'BALANCE_EXPLORER',
      archetypeDescription: summary.archetypeDescription || '',
      preferenceConsistency: Number(submission?.consistency_percent) || Number(summary.preferenceConsistency) || 85,
      consistencyComment: summary.consistencyComment || '',
      rarityPercent: Number(submission?.rarity_percent) || Number(summary.rarityPercent) || 7.5,
      rarityCount: summary.rarityCount || 75,
      rarityComment: summary.rarityComment || '',
      mutualMatchCount: summary.mutualMatchCount || 12,
      topMutualScore: summary.topMutualScore || 94,
      attractedTypes: summary.attractedTypes || [],
      attractedToUserTypes: summary.attractedToUserTypes || [],
      recommendedAdjustment: summary.recommendedAdjustment,
      ctaTitle: summary.ctaTitle,
      ctaButtonText: summary.ctaButtonText,
    },
  };
}

// Test Supabase Connection & Schema Health
export async function testSupabaseConnection(configToTest?: SupabaseConfig): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  const config = configToTest || getSupabaseConfig();
  if (!config) {
    return { success: false, message: 'Supabase URL 및 Anon Key가 설정되지 않았습니다.' };
  }

  try {
    const testClient = createClient(config.url, config.anonKey, {
      auth: { persistSession: false },
    });

    const [subRes, consRes] = await Promise.all([
      testClient.from(TABLE_TEST_SUBMISSIONS).select('id', { count: 'exact', head: true }),
      testClient.from(TABLE_CONSULTATIONS).select('id', { count: 'exact', head: true }),
    ]);

    if (subRes.error) {
      if (subRes.error.code === '42P01' || subRes.error.message.includes('relation') || subRes.error.message.includes('does not exist')) {
        return {
          success: false,
          message: `'${TABLE_TEST_SUBMISSIONS}' 테이블이 존재하지 않습니다. 상단 [SQL 스크립트 복사] 버튼을 누르고 Supabase SQL Editor에서 실행해 주세요.`,
        };
      }
      return { success: false, message: `테이블 조회 실패: ${subRes.error.message}` };
    }

    if (consRes.error) {
      if (consRes.error.code === '42P01' || consRes.error.message.includes('relation') || consRes.error.message.includes('does not exist')) {
        return {
          success: false,
          message: `'${TABLE_CONSULTATIONS}' 테이블이 존재하지 않습니다. 상단 [SQL 스크립트 복사] 버튼을 누르고 Supabase SQL Editor에서 실행해 주세요.`,
        };
      }
      return { success: false, message: `상담 테이블 조회 실패: ${consRes.error.message}` };
    }

    const totalSubmissions = subRes.count ?? 0;
    const totalConsultations = consRes.count ?? 0;

    return {
      success: true,
      message: `Supabase 데이터베이스 연동 정상 완료! (테스트 참여: ${totalSubmissions}건 / 상담 신청: ${totalConsultations}건)`,
      count: totalSubmissions,
    };
  } catch (err: any) {
    return { success: false, message: `연결 실패: ${err.message || '네트워크 오류'}` };
  }
}

