import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SavedUserRecord } from '../types';

export const SUPABASE_STORAGE_CONFIG_KEY = 'love_balance_supabase_custom_config_v1';
export const SUPABASE_TABLE_NAME = 'user_records';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// SQL Schema Definition for 1-click copy & paste in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- LOVE BALANCE (러브밸런스) Supabase 테이블 스키마
-- Supabase 대시보드 -> SQL Editor에 붙여넣고 [Run]을 실행하세요.
-- ==========================================

-- 1. 유저 테스트 및 상담신청 통합 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_records (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completion_step INT DEFAULT 1,
  has_completed_test BOOLEAN DEFAULT FALSE,
  has_lead_consultation BOOLEAN DEFAULT FALSE,
  lead_status TEXT DEFAULT '미신청',
  admin_notes TEXT DEFAULT '',
  lead_info JSONB,
  self_profile JSONB,
  ideal_profile JSONB,
  explicit_weight JSONB,
  implicit_weight JSONB,
  summary JSONB,
  raw_payload JSONB
);

-- 2. 검색 및 필터링 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_records_created_at ON public.user_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_records_lead_status ON public.user_records (lead_status);
CREATE INDEX IF NOT EXISTS idx_user_records_has_lead ON public.user_records (has_lead_consultation);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.user_records ENABLE ROW LEVEL SECURITY;

-- 4. 익명 사용자(참여자) 및 관리자 데이터 접근 정책 설정
DROP POLICY IF EXISTS "Allow anonymous select" ON public.user_records;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.user_records;
DROP POLICY IF EXISTS "Allow anonymous update" ON public.user_records;
DROP POLICY IF EXISTS "Allow anonymous delete" ON public.user_records;

CREATE POLICY "Allow anonymous select" ON public.user_records FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON public.user_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON public.user_records FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON public.user_records FOR DELETE USING (true);
`;

// Helper to get active Supabase credentials
export function getSupabaseConfig(): SupabaseConfig | null {
  // 1. Check Vite Environment Variables
  const metaEnv = (import.meta as any).env || {};
  const envUrl = metaEnv.VITE_SUPABASE_URL || '';
  const envKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey && !envUrl.includes('your-project') && !envKey.includes('your-anon-key')) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  // 2. Check Custom LocalStorage Config set by Admin
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
    localStorage.removeItem(SUPABASE_STORAGE_CONFIG_KEY);
  } else {
    localStorage.setItem(SUPABASE_STORAGE_CONFIG_KEY, JSON.stringify(config));
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

// Convert SavedUserRecord to Supabase Table Row (snake_case)
export function recordToDbRow(record: SavedUserRecord) {
  return {
    id: record.id,
    created_at: record.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completion_step: record.completionStep ?? 1,
    has_completed_test: record.hasCompletedTest ?? false,
    has_lead_consultation: record.hasLeadConsultation ?? false,
    lead_status: record.leadStatus || '미신청',
    admin_notes: record.adminNotes || '',
    lead_info: record.leadInfo || null,
    self_profile: record.selfProfile || null,
    ideal_profile: record.idealProfile || null,
    explicit_weight: record.explicitWeight || null,
    implicit_weight: record.implicitWeight || null,
    summary: record.summary || null,
    raw_payload: record,
  };
}

// Convert Supabase DB Row to SavedUserRecord
export function dbRowToRecord(row: any): SavedUserRecord {
  // If raw_payload exists, merge it with updated row values
  const base = row.raw_payload || {};
  return {
    id: row.id,
    createdAt: row.created_at || base.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || base.updatedAt || new Date().toISOString(),
    completionStep: row.completion_step ?? base.completionStep ?? 1,
    hasCompletedTest: row.has_completed_test ?? base.hasCompletedTest ?? false,
    hasLeadConsultation: row.has_lead_consultation ?? base.hasLeadConsultation ?? false,
    leadStatus: row.lead_status ?? base.leadStatus ?? '미신청',
    adminNotes: row.admin_notes ?? base.adminNotes ?? '',
    leadInfo: row.lead_info ?? base.leadInfo,
    selfProfile: row.self_profile ?? base.selfProfile,
    idealProfile: row.ideal_profile ?? base.idealProfile,
    explicitWeight: row.explicit_weight ?? base.explicitWeight,
    implicitWeight: row.implicit_weight ?? base.implicitWeight,
    summary: row.summary ?? base.summary,
  };
}

// Test Supabase Connection & Table Health
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

    const { data, error, count } = await testClient
      .from(SUPABASE_TABLE_NAME)
      .select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: `Supabase 연결은 성공했으나 '${SUPABASE_TABLE_NAME}' 테이블이 없습니다. 상단의 SQL 스크립트를 복사하여 Supabase SQL Editor에서 실행해 주세요.`,
        };
      }
      return { success: false, message: `Supabase 오류: ${error.message}` };
    }

    return {
      success: true,
      message: `Supabase 클라우드 데이터베이스에 정상적으로 연결되었습니다. (현재 저장된 레코드: ${count ?? 0}건)`,
      count: count ?? 0,
    };
  } catch (err: any) {
    return { success: false, message: `연결 실패: ${err.message || '네트워크 오류'}` };
  }
}
