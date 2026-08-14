import React, { useState, useEffect, useMemo } from 'react';
import {
  SavedUserRecord,
  AdminFilterOptions,
  AdminStats,
  ConsultationStatus,
  DimensionKey,
} from '../types';
import {
  fetchRecords,
  updateRecordDetails,
  deleteRecord,
  clearAllRecords,
  calculateStats,
  exportRecordsToExcel,
} from '../services/storageService';
import {
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  TABLE_TEST_SUBMISSIONS,
  TABLE_CONSULTATIONS,
} from '../services/supabaseClient';
import { DIMENSION_LABELS } from '../data/questionsData';
import {
  Users,
  PhoneCall,
  Download,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sliders,
  TrendingUp,
  Heart,
  Sparkles,
  Shield,
  FileSpreadsheet,
  Calendar,
  MessageSquare,
  ArrowUpDown,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Database,
  Cloud,
  ExternalLink,
  Code,
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onRecordsChange?: () => void;
}

const ADMIN_PASSWORD = '1q2w3e4r5t!!';
const ADMIN_AUTH_KEY = 'lovematch_admin_auth';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onRecordsChange }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authShake, setAuthShake] = useState(false);

  const [records, setRecords] = useState<SavedUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<SavedUserRecord | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Supabase Database Config Modal & Status State
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Custom Delete Confirm Modal State
  const [recordToDelete, setRecordToDelete] = useState<SavedUserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | 'ALL' | 'LEADS_ONLY'>('ALL');
  const [genderFilter, setGenderFilter] = useState<'전체' | '남성' | '여성'>('전체');
  const [regionFilter, setRegionFilter] = useState('전체');
  const [occupationFilter, setOccupationFilter] = useState('전체');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'rarity_desc' | 'consistency_desc' | 'lead_first'>('latest');

  // Detail Modal Tab
  const [detailTab, setDetailTab] = useState<'lead' | 'self' | 'ideal' | 'weights' | 'result'>('lead');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<ConsultationStatus>('대기');
  const [savingNotes, setSavingNotes] = useState(false);

  // Check Supabase initial status
  const checkSupabaseStatus = async () => {
    const cfg = getSupabaseConfig();
    if (cfg) {
      setSupabaseUrlInput(cfg.url);
      setSupabaseKeyInput(cfg.anonKey);
      const res = await testSupabaseConnection(cfg);
      setIsSupabaseConnected(res.success);
    } else {
      setIsSupabaseConnected(false);
    }
  };

  // Load Records if authenticated
  const loadData = async () => {
    setLoading(true);
    await checkSupabaseStatus();
    const data = await fetchRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleOpenSupabaseModal = () => {
    const cfg = getSupabaseConfig();
    if (cfg) {
      setSupabaseUrlInput(cfg.url);
      setSupabaseKeyInput(cfg.anonKey);
    }
    setSupabaseTestResult(null);
    setShowSupabaseModal(true);
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      setSupabaseTestResult({ success: false, message: 'URL과 Anon Key를 모두 입력해 주세요.' });
      return;
    }
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    const res = await testSupabaseConnection({
      url: supabaseUrlInput.trim(),
      anonKey: supabaseKeyInput.trim(),
    });
    setIsTestingSupabase(false);
    setSupabaseTestResult(res);
    if (res.success) {
      setIsSupabaseConnected(true);
    }
  };

  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      saveCustomSupabaseConfig(null);
      setIsSupabaseConnected(false);
      setShowSupabaseModal(false);
      setDeleteToast('Supabase 설정이 해제되어 기본 서버/로컬 모드로 전환되었습니다.');
      setTimeout(() => setDeleteToast(null), 3000);
      loadData();
      return;
    }

    const cfg = { url: supabaseUrlInput.trim(), anonKey: supabaseKeyInput.trim() };
    saveCustomSupabaseConfig(cfg);
    setIsTestingSupabase(true);
    const res = await testSupabaseConnection(cfg);
    setIsTestingSupabase(false);
    setIsSupabaseConnected(res.success);

    setShowSupabaseModal(false);
    setDeleteToast(res.success ? 'Supabase 클라우드 데이터베이스가 연결되었습니다!' : 'Supabase 설정이 저장되었습니다.');
    setTimeout(() => setDeleteToast(null), 3000);
    loadData();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      } catch (err) {
        console.error(err);
      }
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      setAuthShake(true);
      setTimeout(() => setAuthShake(false), 500);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_AUTH_KEY);
    } catch (err) {
      console.error(err);
    }
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError('');
  };

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (r.leadInfo?.name || '').toLowerCase();
        const phone = (r.leadInfo?.phone || '').replace(/[^0-9]/g, '');
        const rawPhone = (r.leadInfo?.phone || '').toLowerCase();
        const occ = (r.selfProfile?.occupationGroup || '').toLowerCase();
        const reg = (r.selfProfile?.region || '').toLowerCase();
        const arch = (r.summary?.archetypeTitle || '').toLowerCase();
        const notes = (r.adminNotes || '').toLowerCase();
        const id = (r.id || '').toLowerCase();

        const match =
          name.includes(q) ||
          phone.includes(q.replace(/[^0-9]/g, '')) ||
          rawPhone.includes(q) ||
          occ.includes(q) ||
          reg.includes(q) ||
          arch.includes(q) ||
          notes.includes(q) ||
          id.includes(q);
        if (!match) return false;
      }

      // Status
      if (statusFilter === 'LEADS_ONLY') {
        if (!r.hasLeadConsultation) return false;
      } else if (statusFilter !== 'ALL') {
        if (r.leadStatus !== statusFilter) return false;
      }

      // Gender
      if (genderFilter !== '전체') {
        if (r.selfProfile?.gender !== genderFilter) return false;
      }

      // Region
      if (regionFilter !== '전체') {
        if (r.selfProfile?.region !== regionFilter) return false;
      }

      // Occupation
      if (occupationFilter !== '전체') {
        if (r.selfProfile?.occupationGroup !== occupationFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'lead_first') {
        if (a.hasLeadConsultation && !b.hasLeadConsultation) return -1;
        if (!a.hasLeadConsultation && b.hasLeadConsultation) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'rarity_desc') {
        return (a.summary?.rarityPercent || 0) - (b.summary?.rarityPercent || 0);
      }
      if (sortBy === 'consistency_desc') {
        return (b.summary?.preferenceConsistency || 0) - (a.summary?.preferenceConsistency || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [records, searchQuery, statusFilter, genderFilter, regionFilter, occupationFilter, sortBy]);

  const stats: AdminStats = useMemo(() => calculateStats(records), [records]);

  // Handle Quick Status Change from table
  const handleQuickStatusChange = async (id: string, newStatus: ConsultationStatus) => {
    const updated = await updateRecordDetails(id, { leadStatus: newStatus });
    if (updated) {
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, leadStatus: newStatus } : r)));
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord({ ...selectedRecord, leadStatus: newStatus });
        setEditStatus(newStatus);
      }
    }
  };

  // Open Detail Modal
  const handleOpenDetail = (record: SavedUserRecord) => {
    setSelectedRecord(record);
    setEditNotes(record.adminNotes || '');
    setEditStatus(record.leadStatus);
    setDetailTab('lead');
  };

  // Save Notes and Status from Modal
  const handleSaveNotes = async () => {
    if (!selectedRecord) return;
    setSavingNotes(true);
    const updated = await updateRecordDetails(selectedRecord.id, {
      adminNotes: editNotes,
      leadStatus: editStatus,
    });
    setSavingNotes(false);
    if (updated) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id ? { ...r, adminNotes: editNotes, leadStatus: editStatus } : r
        )
      );
      setSelectedRecord({ ...selectedRecord, adminNotes: editNotes, leadStatus: editStatus });
    }
  };

  // Request Delete Confirmation Modal (avoids window.confirm browser restrictions)
  const handleRequestDelete = (record: SavedUserRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecordToDelete(record);
  };

  // Confirm Single Delete Execution
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    const targetId = recordToDelete.id;
    const targetName = recordToDelete.leadInfo?.name || `참여자(${targetId.slice(-6)})`;

    try {
      await deleteRecord(targetId);
      setRecords((prev) => prev.filter((r) => r.id !== targetId));
      if (selectedRecord?.id === targetId) {
        setSelectedRecord(null);
      }
      setRecordToDelete(null);
      setDeleteToast(`'${targetName}' 데이터가 안전하게 삭제되었습니다.`);
      setTimeout(() => setDeleteToast(null), 3000);
      onRecordsChange?.();
    } catch (err) {
      console.error('Delete failed:', err);
      // Ensure local state removal even if network error
      setRecords((prev) => prev.filter((r) => r.id !== targetId));
      setRecordToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Request Clear All Confirmation
  const handleRequestClearAll = () => {
    setShowClearConfirm(true);
  };

  // Confirm Clear All Execution
  const handleConfirmClearAll = async () => {
    setIsDeleting(true);
    try {
      await clearAllRecords();
      setRecords([]);
      setSelectedRecord(null);
      setShowClearConfirm(false);
      setDeleteToast('모든 참여자 데이터가 완전히 초기화되었습니다.');
      setTimeout(() => setDeleteToast(null), 3000);
      onRecordsChange?.();
    } catch (err) {
      console.error('Clear all failed:', err);
      setRecords([]);
      setShowClearConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy phone number
  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Excel Exports
  const handleExportAll = () => {
    exportRecordsToExcel(records, '러브밸런스_전체데이터');
  };

  const handleExportFiltered = () => {
    exportRecordsToExcel(filteredRecords, `러브밸런스_필터데이터_${filteredRecords.length}건`);
  };

  const getStatusBadge = (status: ConsultationStatus) => {
    switch (status) {
      case '대기':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case '상담예약':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '상담완료':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case '보류':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case '미신청':
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const dimensionKeys: DimensionKey[] = [
    'appearance',
    'personality',
    'communication',
    'career',
    'economics',
    'age',
    'lifestyle',
    'family',
    'hobbies',
    'marriageValues',
  ];

  // If not authenticated, render Password Authentication Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all transform ${
            authShake ? 'animate-shake ring-2 ring-rose-500' : ''
          }`}
        >
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-rose-900/60 via-slate-900 to-indigo-950/60 p-6 border-b border-slate-800 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3 shadow-lg shadow-rose-950/50">
              <Lock className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-3 py-1 rounded-full font-semibold mb-2">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>관리자 보안 인증</span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight">
              관리자 모드 접속
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              참여자 개인정보 및 정밀 분석 데이터 보호를 위해 관리자 비밀번호를 입력해주세요.
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                관리자 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="비밀번호를 입력하세요"
                  autoFocus
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {authError && (
                <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>관리자 로그인</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition-all cursor-pointer"
              >
                돌아가기 (시뮬레이터로 복귀)
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/50">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white">
                LOVE BALANCE 관리자 센터
              </h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] px-2 py-0.5 rounded-full font-medium">
                Admin Console
              </span>
            </div>
            <p className="text-xs text-slate-400">
              참여자 입력 정보 실시간 저장, 상담 리드 관리 및 엑셀(.xlsx) 추출
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Supabase DB Connection Button */}
          <button
            onClick={handleOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isSupabaseConnected
                ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-600/50 shadow-xs'
                : 'bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border-indigo-600/50'
            }`}
            title="다중 단말 통합 Supabase 클라우드 데이터베이스 설정"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSupabaseConnected ? '🟢 Supabase DB 연동중' : '🟡 Supabase 클라우드 DB 연동'}</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            title="전체 데이터 엑셀 파일(.xlsx)로 다운로드"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>전체 엑셀 다운로드 ({records.length}건)</span>
          </button>

          {filteredRecords.length !== records.length && (
            <button
              onClick={handleExportFiltered}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="현재 필터된 데이터만 엑셀 다운로드"
            >
              <Download className="w-3.5 h-3.5" />
              <span>필터 결과 엑셀 ({filteredRecords.length}건)</span>
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="데이터 새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-400' : ''}`} />
          </button>

          {/* Clear all */}
          <button
            onClick={handleRequestClearAll}
            className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700 hover:border-rose-800 transition-all cursor-pointer"
            title="전체 데이터 초기화"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-xs font-medium rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="관리자 세션 로그아웃"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3.5 py-2 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>닫기 (시뮬레이터로 복귀)</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-100 p-6 overflow-y-auto space-y-6">
        {/* 1. Top KPI Summary Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>총 참여자</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalRecords}명</div>
            <p className="text-[11px] text-slate-400 mt-1">
              남 {stats.maleCount} / 여 {stats.femaleCount}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>상담 신청 리드</span>
              <PhoneCall className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600">{stats.totalLeads}건</div>
            <p className="text-[11px] text-rose-500/80 mt-1 font-semibold">
              전환율 {stats.conversionRate}%
            </p>
          </div>

          <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-1">
              <span>상담 대기</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-700">{stats.pendingLeadsCount}건</div>
            <p className="text-[11px] text-amber-600 mt-1 font-medium">연락 필요 리드</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>평균 연령</span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.avgAge}세</div>
            <p className="text-[11px] text-slate-400 mt-1">결혼적령기 중심</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>평균 희소도</span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-700">상위 {stats.avgRarity}%</div>
            <p className="text-[11px] text-slate-400 mt-1">이상형 눈높이</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>이상형 자기이해도</span>
              <Sliders className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-teal-700">{stats.avgConsistency}%</div>
            <p className="text-[11px] text-slate-400 mt-1">명시 vs 무의식 일치</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>최다 직업군</span>
              <UserCheck className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-lg font-bold text-slate-800 truncate" title={stats.topOccupation}>
              {stats.topOccupation}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate" title={stats.topArchetype}>
              {stats.topArchetype}
            </p>
          </div>
        </div>

        {/* 2. Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 보기 ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('LEADS_ONLY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === 'LEADS_ONLY'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              🔥 VIP 상담 신청자만 ({records.filter((r) => r.hasLeadConsultation).length})
            </button>
            <button
              onClick={() => setStatusFilter('대기')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === '대기'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              상담 대기 ({records.filter((r) => r.leadStatus === '대기').length})
            </button>
            <button
              onClick={() => setStatusFilter('상담예약')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === '상담예약'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              상담 예약 ({records.filter((r) => r.leadStatus === '상담예약').length})
            </button>
            <button
              onClick={() => setStatusFilter('상담완료')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === '상담완료'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              상담 완료 ({records.filter((r) => r.leadStatus === '상담완료').length})
            </button>
            <button
              onClick={() => setStatusFilter('보류')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                statusFilter === '보류'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              보류 ({records.filter((r) => r.leadStatus === '보류').length})
            </button>
          </div>

          {/* Search and Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="이름, 연락처, 직업, 지역, 아키타입, 메모 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Gender Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 shrink-0 font-medium">성별:</span>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="bg-transparent w-full font-medium text-slate-700 focus:outline-none"
              >
                <option value="전체">전체 성별</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 shrink-0 font-medium">지역:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-transparent w-full font-medium text-slate-700 focus:outline-none"
              >
                <option value="전체">전체 지역</option>
                <option value="서울">서울</option>
                <option value="경기/인천">경기/인천</option>
                <option value="부산/경남">부산/경남</option>
                <option value="대구/경북">대구/경북</option>
                <option value="대전/충청">대전/충청</option>
                <option value="광주/전라">광주/전라</option>
                <option value="강원">강원</option>
                <option value="제주">제주</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent w-full font-medium text-slate-700 focus:outline-none"
              >
                <option value="latest">최신 등록순</option>
                <option value="lead_first">상담 신청자 우선</option>
                <option value="rarity_desc">희소도 높은순 (상위%)</option>
                <option value="consistency_desc">자기이해도 높은순</option>
                <option value="oldest">오래된 순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Main Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                참여자 데이터 목록 ({filteredRecords.length}건)
              </h3>
              {filteredRecords.length !== records.length && (
                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-medium">
                  필터링 적용 중
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              테이블의 행을 클릭하면 모든 세부 입력 데이터를 열람할 수 있습니다.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-3.5">등록일시</th>
                  <th className="py-3 px-3.5">상담 상태</th>
                  <th className="py-3 px-3.5">고객 성함 / 연락처</th>
                  <th className="py-3 px-3.5">상담 희망시간</th>
                  <th className="py-3 px-3.5">본인 스펙 (성별/나이/키/지역/직업)</th>
                  <th className="py-3 px-3.5">AI 아키타입</th>
                  <th className="py-3 px-3.5 text-center">희소도 / 이해도</th>
                  <th className="py-3 px-3.5">관리자 메모</th>
                  <th className="py-3 px-3.5 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                      조건에 일치하는 참여자 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => {
                    const sp = r.selfProfile;
                    const lead = r.leadInfo;
                    const sm = r.summary;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => handleOpenDetail(r)}
                        className="hover:bg-rose-50/40 cursor-pointer transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3 px-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {new Date(r.createdAt).toLocaleDateString('ko-KR', {
                              month: 'numeric',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(r.createdAt).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Lead Status Badge & Quick Change */}
                        <td className="py-3 px-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={r.leadStatus}
                            onChange={(e) =>
                              handleQuickStatusChange(r.id, e.target.value as ConsultationStatus)
                            }
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer focus:outline-none ${getStatusBadge(
                              r.leadStatus
                            )}`}
                          >
                            <option value="대기">대기</option>
                            <option value="상담예약">상담예약</option>
                            <option value="상담완료">상담완료</option>
                            <option value="보류">보류</option>
                            <option value="미신청">미신청</option>
                          </select>
                        </td>

                        {/* Customer Info */}
                        <td className="py-3 px-3.5">
                          {lead ? (
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{lead.name}</span>
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold">
                                  VIP
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono mt-0.5">
                                <span>{lead.phone}</span>
                                <button
                                  onClick={(e) => handleCopyPhone(lead.phone, e)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                                  title="전화번호 복사"
                                >
                                  {copiedPhone === lead.phone ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">상담 미신청 (테스트 진행)</span>
                          )}
                        </td>

                        {/* Preferred Time */}
                        <td className="py-3 px-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                          {lead?.preferredTime || '-'}
                        </td>

                        {/* Self Profile summary */}
                        <td className="py-3 px-3.5">
                          {sp ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                <span
                                  className={sp.gender === '남성' ? 'text-blue-600' : 'text-rose-600'}
                                >
                                  {sp.gender}
                                </span>{' '}
                                · {sp.age}세 · {sp.height}cm
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {sp.region} · {sp.occupationGroup}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Archetype */}
                        <td className="py-3 px-3.5">
                          {sm ? (
                            <div>
                              <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                                {sm.archetypeTitle}
                              </span>
                              <span className="text-[10px] text-rose-500 font-medium">
                                매칭 {sm.mutualMatchCount}명 ({sm.topMutualScore}점)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Rarity & Consistency */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {sm ? (
                            <div className="space-y-0.5">
                              <span className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold">
                                상위 {sm.rarityPercent}%
                              </span>
                              <div className="text-[10px] text-slate-400">
                                일치도 {sm.preferenceConsistency}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Admin Notes preview */}
                        <td className="py-3 px-3.5 max-w-[150px] truncate text-[11px] text-slate-600">
                          {r.adminNotes ? (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {r.adminNotes}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(r)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>상세</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRequestDelete(r, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-70 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* 3. Single Record Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white text-center">참여자 데이터 삭제</h3>
            <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed">
              <strong className="text-slate-200">
                {recordToDelete.leadInfo?.name || `참여자(${recordToDelete.id.slice(-6)})`}
              </strong>{' '}
              고객의 분석 결과 및 상담 요청 정보를 정말로 삭제하시겠습니까?
            </p>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 my-4 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>등록일시:</span>
                <span className="text-slate-300">
                  {new Date(recordToDelete.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>프로필:</span>
                <span className="text-slate-300">
                  {recordToDelete.selfProfile
                    ? `${recordToDelete.selfProfile.gender} · ${recordToDelete.selfProfile.age}세 · ${recordToDelete.selfProfile.occupationGroup}`
                    : '-'}
                </span>
              </div>
              {recordToDelete.leadInfo?.phone && (
                <div className="flex justify-between text-slate-400">
                  <span>연락처:</span>
                  <span className="text-rose-400 font-mono font-bold">
                    {recordToDelete.leadInfo.phone}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? '삭제 중...' : '데이터 삭제'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-70 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/40 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white text-center">전체 데이터 초기화</h3>
            <p className="text-xs text-slate-400 text-center mt-1.5 leading-relaxed">
              모든 참여자 정보({records.length}건) 및 상담 리드 목록이 완전히 삭제되며 복구할 수 없습니다. 계속 진행하시겠습니까?
            </p>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isDeleting}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={isDeleting}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? '초기화 중...' : '전체 초기화'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full User Detail Modal (상세보기 뷰어) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg">
                  {selectedRecord.leadInfo?.name ? selectedRecord.leadInfo.name[0] : '참'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedRecord.leadInfo?.name
                        ? `${selectedRecord.leadInfo.name} 고객 상세 리포트`
                        : `참여자 (${selectedRecord.id.slice(-6)}) 데이터`}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                        selectedRecord.leadStatus
                      )}`}
                    >
                      {selectedRecord.leadStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    등록일시: {new Date(selectedRecord.createdAt).toLocaleString('ko-KR')} · ID:{' '}
                    {selectedRecord.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Tabs in Modal */}
            <div className="flex items-center gap-2 bg-slate-50 px-6 py-2.5 border-b border-slate-200 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setDetailTab('lead')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'lead'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>1. 상담 관리 & 리드 정보</span>
              </button>

              <button
                onClick={() => setDetailTab('self')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'self'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>2. 본인 프로필 (나 알아보기)</span>
              </button>

              <button
                onClick={() => setDetailTab('ideal')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'ideal'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>3. 이상형 조건 설정</span>
              </button>

              <button
                onClick={() => setDetailTab('weights')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'weights'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>4. 10대 가중치 비교 (생각 vs 행동)</span>
              </button>

              <button
                onClick={() => setDetailTab('result')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'result'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>5. AI 진단 & 매칭 분석</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 text-xs">
              {/* TAB 1: Lead & Consultation Management */}
              {detailTab === 'lead' && (
                <div className="space-y-6">
                  {/* Lead Info Grid */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 space-y-3">
                      <h4 className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                        <PhoneCall className="w-4 h-4 text-rose-600" />
                        <span>고객 인적사항 & 상담 요청 정보</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">고객 성함</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {selectedRecord.leadInfo?.name || '(미입력)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">연락처</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-900 text-sm font-mono">
                              {selectedRecord.leadInfo?.phone || '(미입력)'}
                            </span>
                            {selectedRecord.leadInfo?.phone && (
                              <button
                                onClick={(e) => handleCopyPhone(selectedRecord.leadInfo!.phone, e)}
                                className="text-rose-600 hover:bg-rose-100 p-1 rounded"
                                title="복사"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">상담 희망시간</span>
                          <span className="font-semibold text-slate-800">
                            {selectedRecord.leadInfo?.preferredTime || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">개인정보 동의</span>
                          <span className="font-semibold text-emerald-700">
                            {selectedRecord.leadInfo?.consent ? '동의 완료' : '미동의'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Notes Form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-slate-700" />
                        <span>상담 상태 및 관리자 메모</span>
                      </h4>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            진행 상태 변경
                          </label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as ConsultationStatus)}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                          >
                            <option value="대기">대기 (신규 리드)</option>
                            <option value="상담예약">상담예약 (일정 조율)</option>
                            <option value="상담완료">상담완료 (회원 가입/진행)</option>
                            <option value="보류">보류</option>
                            <option value="미신청">미신청</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            상담 일지 / 특이사항 메모
                          </label>
                          <textarea
                            rows={3}
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="고객과의 통화 내용, 매칭 선호 사항, 다음 상담 일정 등을 기록하세요."
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{savingNotes ? '저장 중...' : '메모 및 상태 저장'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manager Phone Call Script Guide */}
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-5 rounded-2xl border border-rose-200 space-y-3">
                    <span className="font-bold text-rose-700 flex items-center gap-1.5 text-sm">
                      <Sparkles className="w-4 h-4" /> 커플매니저 추천 전화 안내 멘트 (Call Script)
                    </span>
                    <p className="text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-rose-100">
                      "{selectedRecord.leadInfo?.name || '고객'}님, 안녕하세요! 러브밸런스 AI 매칭
                      전문 커플매니저입니다. 테스트 결과를 검토해보니{' '}
                      <strong>
                        {selectedRecord.summary?.archetypeTitle || '안정 지향 현실주의자'}
                      </strong>{' '}
                      스타일로 분석되셨어요! 특히 이상형 희소도가{' '}
                      <span className="text-rose-600 font-bold">
                        상위 {selectedRecord.summary?.rarityPercent || 7.2}%
                      </span>
                      로 나타나, {selectedRecord.summary?.recommendedAdjustment || '조건 완화 팁'}을
                      반영한 프리미엄 맞춤 매칭 프로필을 준비해두었습니다. 편안하게 안내해 드릴게요."
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Self Profile (나 알아보기) */}
              {detailTab === 'self' && selectedRecord.selfProfile && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900 mb-3">기본 인적 정보</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">성별</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {selectedRecord.selfProfile.gender}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">나이</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {selectedRecord.selfProfile.age}세
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">신장</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {selectedRecord.selfProfile.height}cm
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">거주지</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {selectedRecord.selfProfile.region}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">직업군</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {selectedRecord.selfProfile.occupationGroup}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personality Traits (Big 5) */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-900 mb-3">
                      성격 5대 요인 (Big 5 Personality)
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.entries({
                        외향성: selectedRecord.selfProfile.personality.extroversion,
                        정서안정성: selectedRecord.selfProfile.personality.emotionalStability,
                        개방성: selectedRecord.selfProfile.personality.openness,
                        성실성: selectedRecord.selfProfile.personality.conscientiousness,
                        친화성: selectedRecord.selfProfile.personality.agreeableness,
                      }).map(([label, val]) => (
                        <div key={label} className="bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex justify-between font-semibold mb-1">
                            <span>{label}</span>
                            <span className="text-rose-600 font-bold">{val}점 / 100</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-rose-500 h-full rounded-full"
                              style={{ width: `${val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lifestyle & Marriage Values */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900">라이프스타일</h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">음주</span>
                          <span className="font-bold text-slate-800">
                            {selectedRecord.selfProfile.lifestyle.drinking}
                          </span>
                        </div>
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">흡연</span>
                          <span className="font-bold text-slate-800">
                            {selectedRecord.selfProfile.lifestyle.smoking}
                          </span>
                        </div>
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">운동 빈도</span>
                          <span className="font-bold text-slate-800">
                            {selectedRecord.selfProfile.lifestyle.exercise}
                          </span>
                        </div>
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">주말/여행 스타일</span>
                          <span className="font-bold text-slate-800">
                            {selectedRecord.selfProfile.lifestyle.travel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900">결혼관 & 연애 스타일</h4>
                      <div className="space-y-1.5">
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">결혼 의향 점수</span>
                          <span className="font-bold text-rose-600">
                            {selectedRecord.selfProfile.marriage.marriageIntent}점 / 100
                          </span>
                        </div>
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">자녀 계획</span>
                          <span className="font-bold text-slate-800">
                            {selectedRecord.selfProfile.marriage.children}
                          </span>
                        </div>
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">맞벌이 선호</span>
                          <span className="font-bold text-slate-800">
                            {selectedRecord.selfProfile.marriage.dualIncome}
                          </span>
                        </div>
                        <div className="flex justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-slate-500">가족 관계 중요도</span>
                          <span className="font-bold text-slate-800">
                            {selectedRecord.selfProfile.marriage.familyImportance}점
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Ideal Profile (이상형 조건) */}
              {detailTab === 'ideal' && selectedRecord.idealProfile && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-sm text-slate-900">이상형 필수 & 선호 조건표</h4>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">희망 연령 범위</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedRecord.idealProfile.ageMin}세 ~ {selectedRecord.idealProfile.ageMax}세
                        </span>
                        <span className="text-[10px] text-rose-600 block mt-0.5 font-semibold">
                          {selectedRecord.idealProfile.ageDealBreaker
                            ? '🚫 절대 불가(Deal-breaker)'
                            : '선호 조건'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">희망 최소 신장</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedRecord.idealProfile.heightMin}cm 이상
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          중요도: {selectedRecord.idealProfile.heightImportance}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">흡연 조건</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedRecord.idealProfile.smokingPreferred}
                        </span>
                        <span className="text-[10px] text-rose-600 block mt-0.5 font-semibold">
                          {selectedRecord.idealProfile.smokingDealBreaker
                            ? '🚫 흡연자 절대 불가'
                            : '무관'}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">음주 조건</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedRecord.idealProfile.drinkingPreferred}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">희망 자녀관</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedRecord.idealProfile.childrenPreferred}
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">맞벌이 선호</span>
                        <span className="font-bold text-slate-900 text-sm">
                          {selectedRecord.idealProfile.dualIncomePreferred}
                        </span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px] mb-1">희망 거주 지역</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedRecord.idealProfile.regions?.map((reg) => (
                            <span
                              key={reg}
                              className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold"
                            >
                              {reg}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[11px] mb-1">희망 직업군</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedRecord.idealProfile.occupations?.map((occ) => (
                            <span
                              key={occ}
                              className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold"
                            >
                              {occ}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: 10 Dimensions Weights Comparison */}
              {detailTab === 'weights' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        10대 영역 가중치 분석표 (생각했던 이상형 VS 실제 선택 행동)
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        총 100점 기준 비중 (%)
                      </span>
                    </div>

                    {/* 범례 표시 */}
                    <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
                        <span>생각 (회색)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
                        <span>행동 (빨간색)</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2">
                      {dimensionKeys.map((dim) => {
                        const meta = DIMENSION_LABELS[dim];
                        const expVal = Math.round(selectedRecord.explicitWeight?.[dim] ?? 0);
                        const impVal = Math.round(selectedRecord.implicitWeight?.[dim] ?? 0);
                        const diff = impVal - expVal;

                        return (
                          <div
                            key={dim}
                            className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5"
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-800 flex items-center gap-1">
                                <span>{meta.icon}</span>
                                <span>{meta.label}</span>
                              </span>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-slate-600">생각: {expVal}%</span>
                                <span className="text-rose-600 font-bold">행동: {impVal}%</span>
                                {diff !== 0 && (
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                      diff > 0
                                        ? 'bg-rose-100 text-rose-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}
                                  >
                                    {diff > 0 ? `+${diff}%` : `${diff}%`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {/* Explicit bar (생각) */}
                              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-slate-400 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(expVal * 2.5, 100)}%` }}
                                />
                              </div>
                              {/* Implicit bar (행동) */}
                              <div className="w-full bg-rose-100 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(impVal * 2.5, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: AI Simulation Result */}
              {detailTab === 'result' && selectedRecord.summary && (
                <div className="space-y-4">
                  {/* Archetype Banner */}
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-5 rounded-2xl text-white space-y-2">
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full inline-block">
                      AI 성향 아키타입
                    </span>
                    <h3 className="text-xl font-black">{selectedRecord.summary.archetypeTitle}</h3>
                    <p className="text-rose-100 text-xs leading-relaxed">
                      {selectedRecord.summary.archetypeDescription}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">이상형 자기이해도</span>
                      <span className="text-xl font-bold text-slate-900">
                        {selectedRecord.summary.preferenceConsistency}%
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {selectedRecord.summary.consistencyComment}
                      </p>
                    </div>

                    <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200">
                      <span className="text-purple-600 block text-[11px] font-bold">
                        이상형 희소도
                      </span>
                      <span className="text-xl font-bold text-purple-900">
                        상위 {selectedRecord.summary.rarityPercent}%
                      </span>
                      <p className="text-[10px] text-purple-700 mt-1">
                        150명 중 {selectedRecord.summary.rarityCount}명 부합
                      </p>
                    </div>

                    <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200">
                      <span className="text-rose-600 block text-[11px] font-bold">
                        쌍방 매칭 결과
                      </span>
                      <span className="text-xl font-bold text-rose-900">
                        {selectedRecord.summary.mutualMatchCount}명 매칭
                      </span>
                      <p className="text-[10px] text-rose-700 mt-1">
                        최고 일치도 {selectedRecord.summary.topMutualScore}점
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-900 block">내가 끌리는 핵심 유형</span>
                      <ul className="space-y-1 text-slate-700">
                        {selectedRecord.summary.attractedTypes?.map((t, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-900 block">
                        나에게 호감을 갖는 유형
                      </span>
                      <ul className="space-y-1 text-slate-700">
                        {selectedRecord.summary.attractedToUserTypes?.map((t, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">ID: {selectedRecord.id}</span>
                <button
                  type="button"
                  onClick={() => handleRequestDelete(selectedRecord)}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                  title="해당 참여자 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>이 데이터 삭제</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Cloud DB Setup & SQL Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-900/50">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">Supabase 다중 단말 클라우드 DB 연동</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSupabaseConnected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {isSupabaseConnected ? '연결 완료' : '미연동/로컬모드'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    서로 다른 스마트폰/PC에서 접속한 모든 참여자 데이터를 하나의 DB로 실시간 통합 관리합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800 text-xs">
              {/* Step 1 & 2 Instructions */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>3분 완성! Supabase 테이블 생성 방법</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-xs leading-relaxed">
                  <li>
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 underline font-semibold inline-flex items-center gap-1"
                    >
                      Supabase.com <ExternalLink className="w-3 h-3" />
                    </a>
                    에서 무료 계정 생성 후 <strong>New Project</strong>를 만듭니다.
                  </li>
                  <li>
                    Supabase 프로젝트 좌측 메뉴에서 <strong>SQL Editor</strong>를 클릭합니다.
                  </li>
                  <li>
                    아래의 <strong>[SQL 스크립트 복사]</strong> 버튼을 누르고 SQL Editor에 붙여넣은 뒤 <strong>[Run]</strong> 버튼을 누릅니다.
                  </li>
                  <li>
                    Supabase <strong>Project Settings ➔ API</strong>에서 <code>Project URL</code>과 <code>anon public key</code>를 복사해 아래에 입력하세요.
                  </li>
                </ol>
              </div>

              {/* SQL Copy Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Code className="w-4 h-4 text-indigo-600" />
                    테이블 스키마 자동 생성 SQL (test_submissions 및 consultations 테이블)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'SQL 복사 완료!' : 'SQL 스크립트 복사'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] max-h-36 overflow-y-auto leading-relaxed border border-slate-800 select-all">
                  <pre>{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>

              {/* Credentials Input */}
              <div className="space-y-3.5 border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-900 text-sm">Supabase API 키 정보 입력</h4>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    환경 변수(<code>VITE_SUPABASE_URL</code>) 또는 이 입력란에 저장할 수 있습니다.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    환경 변수(<code>VITE_SUPABASE_ANON_KEY</code>) 또는 이 입력란에 저장할 수 있습니다.
                  </p>
                </div>

                {supabaseTestResult && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2 text-xs font-semibold ${
                      supabaseTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {supabaseTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    )}
                    <span>{supabaseTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin' : ''}`} />
                <span>{isTestingSupabase ? '연결 테스트 중...' : '연결 상태 테스트'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSaveSupabaseConfig}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  설정 저장 & 동기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

