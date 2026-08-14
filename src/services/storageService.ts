import * as XLSX from 'xlsx';
import {
  SavedUserRecord,
  AdminFilterOptions,
  AdminStats,
  SelfProfile,
  IdealProfile,
  DimensionsWeights,
  LoveMatchTestResult,
  LeadConsultation,
  ConsultationStatus,
} from '../types';

const LOCAL_STORAGE_KEY = 'love_balance_saved_records_v1';
const CURRENT_SESSION_KEY = 'love_balance_current_session_id';

// Helper to get or create unique session ID
export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(CURRENT_SESSION_KEY);
  if (!id) {
    id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(CURRENT_SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  const newId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem(CURRENT_SESSION_KEY, newId);
  return newId;
}

// Local storage fallback helpers
function getLocalRecords(): SavedUserRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const list: SavedUserRecord[] = raw ? JSON.parse(raw) : [];
    return list.filter((r) => !r.id.startsWith('rec_sample_'));
  } catch {
    return [];
  }
}

function saveLocalRecords(records: SavedUserRecord[]) {
  try {
    const clean = records.filter((r) => !r.id.startsWith('rec_sample_'));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(clean));
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }
}

// 1. Save or update record (Dual persistence: API + LocalStorage)
export async function saveRecord(payload: Partial<SavedUserRecord>): Promise<SavedUserRecord> {
  const sessionId = payload.id || getOrCreateSessionId();
  const recordToSave: SavedUserRecord = {
    id: sessionId,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completionStep: payload.completionStep || 1,
    hasCompletedTest: payload.hasCompletedTest ?? false,
    hasLeadConsultation: payload.hasLeadConsultation ?? false,
    leadStatus: payload.leadStatus || (payload.leadInfo ? '대기' : '미신청'),
    adminNotes: payload.adminNotes || '',
    leadInfo: payload.leadInfo,
    selfProfile: payload.selfProfile,
    idealProfile: payload.idealProfile,
    explicitWeight: payload.explicitWeight,
    implicitWeight: payload.implicitWeight,
    summary: payload.summary,
    ...payload,
  };

  // Local storage update
  const localList = getLocalRecords();
  const existingIdx = localList.findIndex((r) => r.id === sessionId);
  if (existingIdx >= 0) {
    localList[existingIdx] = { ...localList[existingIdx], ...recordToSave };
  } else {
    localList.unshift(recordToSave);
  }
  saveLocalRecords(localList);

  // Server API update
  try {
    const res = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordToSave),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.record) {
        return data.record;
      }
    }
  } catch (err) {
    console.warn('Backend API offline or slow, relying on local sync:', err);
  }

  return recordToSave;
}

// 2. Fetch all records with filter query
export async function fetchRecords(filters?: AdminFilterOptions): Promise<SavedUserRecord[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.searchQuery) params.append('search', filters.searchQuery);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.gender) params.append('gender', filters.gender);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.occupation) params.append('occupation', filters.occupation);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);

    const res = await fetch(`/api/records?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        const cleanList = data.records.filter((r: SavedUserRecord) => !r.id.startsWith('rec_sample_'));
        // Sync local storage with fetched records
        saveLocalRecords(cleanList);
        return cleanList;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from server, fallback to local storage:', err);
  }

  // Fallback to local storage with manual filter
  let list = getLocalRecords();
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    list = list.filter((r) =>
      (r.leadInfo?.name || '').toLowerCase().includes(q) ||
      (r.leadInfo?.phone || '').includes(q) ||
      (r.selfProfile?.occupationGroup || '').toLowerCase().includes(q) ||
      (r.selfProfile?.region || '').toLowerCase().includes(q)
    );
  }
  return list;
}

// 3. Update single record (Status, Admin Notes)
export async function updateRecordDetails(
  id: string,
  updates: Partial<SavedUserRecord>
): Promise<SavedUserRecord | null> {
  // Local storage update
  const localList = getLocalRecords();
  const idx = localList.findIndex((r) => r.id === id);
  if (idx >= 0) {
    localList[idx] = { ...localList[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLocalRecords(localList);
  }

  try {
    const res = await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) return data.record;
    }
  } catch (err) {
    console.error('Update record error:', err);
  }

  return idx >= 0 ? localList[idx] : null;
}

// 4. Delete record
export async function deleteRecord(id: string): Promise<boolean> {
  const localList = getLocalRecords().filter((r) => r.id !== id);
  saveLocalRecords(localList);

  try {
    const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return true;
  }
}

// 5. Clear all records
export async function clearAllRecords(): Promise<boolean> {
  saveLocalRecords([]);
  try {
    const res = await fetch('/api/records', { method: 'DELETE' });
    return res.ok;
  } catch {
    return true;
  }
}

// 6. Calculate Admin Statistics
export function calculateStats(records: SavedUserRecord[]): AdminStats {
  const totalRecords = records.length;
  const leads = records.filter((r) => r.hasLeadConsultation);
  const totalLeads = leads.length;
  const conversionRate = totalRecords > 0 ? Math.round((totalLeads / totalRecords) * 100) : 0;
  const pendingLeadsCount = records.filter((r) => r.leadStatus === '대기').length;

  const maleCount = records.filter((r) => r.selfProfile?.gender === '남성').length;
  const femaleCount = records.filter((r) => r.selfProfile?.gender === '여성').length;

  const validAges = records.map((r) => r.selfProfile?.age).filter((a): a is number => typeof a === 'number');
  const avgAge = validAges.length > 0 ? Math.round(validAges.reduce((a, b) => a + b, 0) / validAges.length) : 0;

  const validRarities = records.map((r) => r.summary?.rarityPercent).filter((v): v is number => typeof v === 'number');
  const avgRarity = validRarities.length > 0 ? Number((validRarities.reduce((a, b) => a + b, 0) / validRarities.length).toFixed(1)) : 0;

  const validConsistencies = records.map((r) => r.summary?.preferenceConsistency).filter((v): v is number => typeof v === 'number');
  const avgConsistency = validConsistencies.length > 0 ? Math.round(validConsistencies.reduce((a, b) => a + b, 0) / validConsistencies.length) : 0;

  const occCounts: Record<string, number> = {};
  records.forEach((r) => {
    const occ = r.selfProfile?.occupationGroup;
    if (occ) occCounts[occ] = (occCounts[occ] || 0) + 1;
  });
  const topOccupation = Object.entries(occCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'IT/개발';

  const archCounts: Record<string, number> = {};
  records.forEach((r) => {
    const arch = r.summary?.archetypeTitle;
    if (arch) archCounts[arch] = (archCounts[arch] || 0) + 1;
  });
  const topArchetype = Object.entries(archCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '안정 지향 현실주의자';

  return {
    totalRecords,
    totalLeads,
    conversionRate,
    maleCount,
    femaleCount,
    avgAge,
    avgRarity,
    avgConsistency,
    topOccupation,
    topArchetype,
    pendingLeadsCount,
  };
}

// 8. Excel Export Utility (.xlsx)
export function exportRecordsToExcel(records: SavedUserRecord[], filenamePrefix = '러브밸런스_매칭데이터_전체'): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Master Comprehensive Data
  const masterRows = records.map((r, index) => {
    const sp = r.selfProfile;
    const ip = r.idealProfile;
    const exp = r.explicitWeight;
    const imp = r.implicitWeight;
    const sm = r.summary;
    const lead = r.leadInfo;

    return {
      '연번': index + 1,
      '관리ID': r.id,
      '등록일시': new Date(r.createdAt).toLocaleString('ko-KR'),
      '진행단계': `STEP ${r.completionStep}/6`,
      '테스트완료여부': r.hasCompletedTest ? '완료' : '진행중',
      '상담신청여부': r.hasLeadConsultation ? '신청완료' : '미신청',
      '상담상태': r.leadStatus,
      '고객성함': lead?.name || '(미입력)',
      '연락처': lead?.phone || '(미입력)',
      '상담희망시간': lead?.preferredTime || '-',
      '개인정보동의': lead?.consent ? '동의' : '미동의',
      '관리자상담메모': r.adminNotes || '',

      // 본인 프로필
      '본인_성별': sp?.gender || '-',
      '본인_나이': sp?.age ? `${sp.age}세` : '-',
      '본인_신장': sp?.height ? `${sp.height}cm` : '-',
      '본인_거주지': sp?.region || '-',
      '본인_직업군': sp?.occupationGroup || '-',
      '본인_음주': sp?.lifestyle?.drinking || '-',
      '본인_흡연': sp?.lifestyle?.smoking || '-',
      '본인_운동': sp?.lifestyle?.exercise || '-',
      '본인_여행': sp?.lifestyle?.travel || '-',
      '본인_결혼의향점수': sp?.marriage?.marriageIntent ? `${sp.marriage.marriageIntent}점` : '-',
      '본인_자녀계획': sp?.marriage?.children || '-',
      '본인_맞벌이선호': sp?.marriage?.dualIncome || '-',
      '본인_가족중요도': sp?.marriage?.familyImportance ? `${sp.marriage.familyImportance}점` : '-',
      '성격_외향성': sp?.personality?.extroversion ?? '-',
      '성격_정서안정성': sp?.personality?.emotionalStability ?? '-',
      '성격_개방성': sp?.personality?.openness ?? '-',
      '성격_성실성': sp?.personality?.conscientiousness ?? '-',
      '성격_친화성': sp?.personality?.agreeableness ?? '-',

      // 이상형 조건
      '이상형_희망연령': ip ? `${ip.ageMin}세 ~ ${ip.ageMax}세` : '-',
      '이상형_연령필수(DealBreaker)': ip?.ageDealBreaker ? '필수' : '무관',
      '이상형_최소키': ip?.heightMin ? `${ip.heightMin}cm 이상` : '-',
      '이상형_희망지역': ip?.regions ? ip.regions.join(', ') : '-',
      '이상형_희망직업군': ip?.occupations ? ip.occupations.join(', ') : '-',
      '이상형_흡연조건': ip?.smokingPreferred || '-',
      '이상형_흡연필수(DealBreaker)': ip?.smokingDealBreaker ? '필수' : '무관',
      '이상형_음주조건': ip?.drinkingPreferred || '-',
      '이상형_자녀계획': ip?.childrenPreferred || '-',
      '이상형_맞벌이': ip?.dualIncomePreferred || '-',

      // 명시적 100점 경매 가중치
      '경매_외모(%)': exp?.appearance ?? 0,
      '경매_성격(%)': exp?.personality ?? 0,
      '경매_대화소통(%)': exp?.communication ?? 0,
      '경매_직업(%)': exp?.career ?? 0,
      '경매_경제력(%)': exp?.economics ?? 0,
      '경매_나이(%)': exp?.age ?? 0,
      '경매_생활방식(%)': exp?.lifestyle ?? 0,
      '경매_가족관(%)': exp?.family ?? 0,
      '경매_취미(%)': exp?.hobbies ?? 0,
      '경매_결혼가치관(%)': exp?.marriageValues ?? 0,

      // 무의식 게임 가중치
      '무의식_외모(%)': imp?.appearance ?? 0,
      '무의식_성격(%)': imp?.personality ?? 0,
      '무의식_대화소통(%)': imp?.communication ?? 0,
      '무의식_직업(%)': imp?.career ?? 0,
      '무의식_경제력(%)': imp?.economics ?? 0,
      '무의식_나이(%)': imp?.age ?? 0,
      '무의식_생활방식(%)': imp?.lifestyle ?? 0,
      '무의식_가족관(%)': imp?.family ?? 0,
      '무의식_취미(%)': imp?.hobbies ?? 0,
      '무의식_결혼가치관(%)': imp?.marriageValues ?? 0,

      // AI 진단 리포트 결과
      'AI_스타일_아키타입': sm?.archetypeTitle || '-',
      'AI_아키타입_설명': sm?.archetypeDescription || '-',
      '이상형_자기이해도(일치도)': sm?.preferenceConsistency ? `${sm.preferenceConsistency}%` : '-',
      '이상형_희소도': sm?.rarityPercent ? `상위 ${sm.rarityPercent}%` : '-',
      '풀_부합_인원': sm?.rarityCount ? `${sm.rarityCount}명` : '-',
      '쌍방매칭_인원수': sm?.mutualMatchCount ? `${sm.mutualMatchCount}명` : '-',
      '최고_매칭점수': sm?.topMutualScore ? `${sm.topMutualScore}점` : '-',
      '내가끌리는_유형': sm?.attractedTypes ? sm.attractedTypes.join(' / ') : '-',
      '나에게호감갖는_유형': sm?.attractedToUserTypes ? sm.attractedToUserTypes.join(' / ') : '-',
      '매니저_권장조정안': sm?.recommendedAdjustment || '-',
    };
  });

  const masterWs = XLSX.utils.json_to_sheet(masterRows);
  XLSX.utils.book_append_sheet(wb, masterWs, '전체_참여자_통합데이터');

  // Sheet 2: Consultation Lead Focus Sheet
  const leadRows = records
    .filter((r) => r.hasLeadConsultation)
    .map((r, index) => {
      const sp = r.selfProfile;
      const lead = r.leadInfo;
      const sm = r.summary;
      return {
        '연번': index + 1,
        '상담상태': r.leadStatus,
        '신청일시': lead?.submittedAt ? new Date(lead.submittedAt).toLocaleString('ko-KR') : new Date(r.createdAt).toLocaleString('ko-KR'),
        '고객성함': lead?.name || '-',
        '연락처': lead?.phone || '-',
        '상담희망시간': lead?.preferredTime || '-',
        '성별': sp?.gender || '-',
        '나이': sp?.age ? `${sp.age}세` : '-',
        '지역': sp?.region || '-',
        '직업군': sp?.occupationGroup || '-',
        '결혼의향': sp?.marriage?.marriageIntent ? `${sp.marriage.marriageIntent}점` : '-',
        '아키타입': sm?.archetypeTitle || '-',
        '희소도': sm?.rarityPercent ? `${sm.rarityPercent}%` : '-',
        '자기이해도': sm?.preferenceConsistency ? `${sm.preferenceConsistency}%` : '-',
        '추천조정안': sm?.recommendedAdjustment || '-',
        '관리자상담메모': r.adminNotes || '',
      };
    });

  if (leadRows.length > 0) {
    const leadWs = XLSX.utils.json_to_sheet(leadRows);
    XLSX.utils.book_append_sheet(wb, leadWs, 'VIP_상담신청_리드목록');
  }

  // Sheet 3: Weights 10-dimension comparison
  const weightRows = records.map((r, index) => {
    const lead = r.leadInfo;
    const exp = r.explicitWeight;
    const imp = r.implicitWeight;
    return {
      '연번': index + 1,
      '고객성함': lead?.name || `참여자_${r.id.slice(-4)}`,
      '성별': r.selfProfile?.gender || '-',
      '나이': r.selfProfile?.age || '-',
      '[명시]외모': exp?.appearance ?? 0,
      '[무의식]외모': imp?.appearance ?? 0,
      '[명시]성격': exp?.personality ?? 0,
      '[무의식]성격': imp?.personality ?? 0,
      '[명시]대화': exp?.communication ?? 0,
      '[무의식]대화': imp?.communication ?? 0,
      '[명시]직업': exp?.career ?? 0,
      '[무의식]직업': imp?.career ?? 0,
      '[명시]경제력': exp?.economics ?? 0,
      '[무의식]경제력': imp?.economics ?? 0,
      '[명시]나이': exp?.age ?? 0,
      '[무의식]나이': imp?.age ?? 0,
      '[명시]생활방식': exp?.lifestyle ?? 0,
      '[무의식]생활방식': imp?.lifestyle ?? 0,
      '[명시]가족관': exp?.family ?? 0,
      '[무의식]가족관': imp?.family ?? 0,
      '[명시]취미': exp?.hobbies ?? 0,
      '[무의식]취미': imp?.hobbies ?? 0,
      '[명시]결혼가치': exp?.marriageValues ?? 0,
      '[무의식]결혼가치': imp?.marriageValues ?? 0,
      '일치도(%)': r.summary?.preferenceConsistency ?? 0,
    };
  });

  const weightWs = XLSX.utils.json_to_sheet(weightRows);
  XLSX.utils.book_append_sheet(wb, weightWs, '10대영역_가중치_비교');

  // Trigger Excel file download
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `${filenamePrefix}_${dateStr}.xlsx`);
}
