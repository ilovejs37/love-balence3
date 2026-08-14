import React, { useState } from 'react';
import { LoveMatchTestResult, SingleCandidateResult, LeadConsultation, SelfProfile } from '../types';
import { ConsultationModal } from './ConsultationModal';
import {
  Sparkles,
  Heart,
  UserCheck,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  RotateCcw,
  Users,
} from 'lucide-react';

interface Step6ResultReportProps {
  result: LoveMatchTestResult;
  onRestart: () => void;
  onSaveLead?: (lead: LeadConsultation) => void;
}

// 나의 인기도 (1,000명 중 나를 픽할 후보 수) 계산 함수
const calculatePopularity = (profile?: SelfProfile) => {
  const base = 600;
  if (!profile) {
    return { count: base, percent: 60, popularCategories: [] };
  }

  let bonus = 0;
  const popularCategories: string[] = [];
  const { gender, age, occupationGroup, height } = profile;

  if (gender === '남성') {
    // 1) 나이: 28세부터 34세 (+50명)
    if (age >= 28 && age <= 34) {
      bonus += 50;
      popularCategories.push('나이');
    }
    // 직업: 전문직(+50), 공기업/공무원(+30), 교육/연구(+10)
    if (occupationGroup === '전문직' || occupationGroup === '공기업/공무원' || occupationGroup === '교육/연구') {
      if (occupationGroup === '전문직') bonus += 50;
      else if (occupationGroup === '공기업/공무원') bonus += 30;
      else if (occupationGroup === '교육/연구') bonus += 10;
      popularCategories.push('직업');
    }
    // 신장: 178~180 (+50명), 181~183 (+70명)
    if ((height >= 178 && height <= 180) || (height >= 181 && height <= 183)) {
      if (height >= 178 && height <= 180) bonus += 50;
      else bonus += 70;
      popularCategories.push('신장(키)');
    }
  } else {
    // 2) 여성의 경우
    // 나이: 25세부터 28세 (+50명), 29세부터 31세 (+30명)
    if (age >= 25 && age <= 28) {
      bonus += 50;
      popularCategories.push('나이');
    } else if (age >= 29 && age <= 31) {
      bonus += 30;
      popularCategories.push('나이');
    }
    // 직업: 전문직(+50), 공기업/공무원(+30), 교육/연구(+10)
    if (occupationGroup === '전문직' || occupationGroup === '공기업/공무원' || occupationGroup === '교육/연구') {
      if (occupationGroup === '전문직') bonus += 50;
      else if (occupationGroup === '공기업/공무원') bonus += 30;
      else if (occupationGroup === '교육/연구') bonus += 10;
      popularCategories.push('직업');
    }
    // 신장: 165부터 170 (+50명)
    if (height >= 165 && height <= 170) {
      bonus += 50;
      popularCategories.push('신장(키)');
    }
  }

  const total = Math.min(1000, base + bonus);
  const percent = Math.round((total / 1000) * 100);

  return {
    count: total,
    percent,
    popularCategories,
  };
};

export const Step6ResultReport: React.FC<Step6ResultReportProps> = ({
  result,
  onRestart,
  onSaveLead,
}) => {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<SingleCandidateResult | null>(null);

  const popularity = calculatePopularity(result.selfProfile);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Disclaimer Banner */}
      <div className="bg-slate-100 text-slate-600 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between border border-slate-200">
        <span className="flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>성향 및 입력조건을 이용한 시뮬레이션 결과입니다.</span>
        </span>
        <button
          onClick={onRestart}
          className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> 다시 테스트
        </button>
      </div>

      {/* Main Archetype Card (PDF Page 15) */}
      <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
          당신의 연애 & 배우자 선택 스타일
        </span>
        <h2 className="text-2xl sm:text-3xl font-black mb-2">{result.archetype.title}</h2>
        <p className="text-rose-100 text-sm leading-relaxed max-w-xl">{result.archetype.description}</p>
      </div>

      {/* Core Result 1 & 2: 내가 끌리는 사람 VS 나를 원하는 사람 (PDF Page 11, 12) */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* 내가 끌리는 사람 */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span>내가 끌리는 핵심 유형</span>
          </div>
          <ul className="space-y-2 text-xs">
            {result.attractedTypes.map((type, idx) => (
              <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/60 text-slate-800 font-medium">
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span>{type}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 나를 원하는 사람 */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <UserCheck className="w-4 h-4 text-rose-500" />
            <span>나에게 호감을 느낄 가능성이 높은 유형</span>
          </div>
          <ul className="space-y-2 text-xs">
            {result.attractedToUserTypes.map((type, idx) => (
              <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-800 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span>{type}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 👀 당신이 생각한 이상형 VS 실제 선택 (Explicit vs Implicit Gap) (PDF Page 16, 25) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>👀 생각했던 이상형 VS 실제 선택 행동</span>
          </h3>
          <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-full">
            자기이해도 {result.preferenceConsistency}%
          </span>
        </div>

        <p className="text-xs text-slate-600 italic bg-amber-50/70 p-3 rounded-xl border border-amber-100">
          "{result.consistencyComment}"
        </p>

        {/* 범례 안내 (회색: 생각, 빨간색: 행동) */}
        <div className="flex flex-wrap items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-2">
          <span className="font-semibold text-slate-700">막대별 항목 안내</span>
          <div className="flex items-center gap-3 font-medium">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-xs bg-slate-400 inline-block" />
              <span>생각 (회색)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
              <span>행동 (빨간색)</span>
            </div>
          </div>
        </div>

        {/* 항목별 막대 그래프 및 % 표시 */}
        <div className="space-y-3">
          {result.explicitVsActual.map((item) => (
            <div
              key={item.dimension}
              className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-100 space-y-2.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  {item.label}
                </span>
                {Math.abs(Math.round(item.implicitPct - item.explicitPct)) >= 4 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.implicitPct > item.explicitPct
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.implicitPct > item.explicitPct
                      ? `행동 비중 +${Math.round(item.implicitPct - item.explicitPct)}%p`
                      : `생각 비중 +${Math.round(item.explicitPct - item.implicitPct)}%p`}
                  </span>
                )}
              </div>

              {/* 막대 그래프 영역 */}
              <div className="space-y-2">
                {/* 1. 생각 (회색 막대) */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                      <span>생각</span>
                    </span>
                    <span className="font-bold text-slate-700">
                      {Math.round(item.explicitPct)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.explicitPct))}%` }}
                    />
                  </div>
                </div>

                {/* 2. 행동 (빨간색 막대) */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-rose-600 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>행동</span>
                    </span>
                    <span className="font-bold text-rose-600">
                      {Math.round(item.implicitPct)}%
                    </span>
                  </div>
                  <div className="w-full bg-rose-100/80 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.implicitPct))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🎯 나의 이상형은 몇 명 있을까? */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>🎯 나의 이상형은 몇 명 있을까?</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">시뮬레이션 스케일 데이터</span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">1,000명의 후보 중 부합 후보</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              약 {result.rarityCount}명 <span className="text-xs font-normal text-slate-400">({result.rarityPercent}%)</span>
            </div>
          </div>
          <div className="w-32 bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, result.rarityPercent))}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-slate-600">{result.rarityComment}</p>
      </div>

      {/* 🌟 나의 인기도 (1,000명 중 몇 명이 나를 픽할까?) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <span>나의 인기도(1,000명 중 몇 명이 나를 픽할까?)</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">이성 매력도 시뮬레이션</span>
        </div>

        <div className="bg-gradient-to-r from-indigo-50/70 to-purple-50/70 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-900 font-medium">1,000명의 이성 중 나를 선호할 예상 후보</div>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">
              약 {popularity.count}명 <span className="text-xs font-normal text-slate-500">({popularity.percent}%)</span>
            </div>
          </div>
          <div className="w-32 bg-indigo-100 h-3 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, popularity.percent))}%` }}
            />
          </div>
        </div>

        {popularity.popularCategories.length > 0 && (
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <p className="text-xs font-semibold text-indigo-900">
              당신은 <span className="text-indigo-600 font-bold">{popularity.popularCategories.join(', ')}</span> 항목에서 인기가 많습니다.
            </p>
          </div>
        )}
      </div>

      {/* 🔓 인연의 범위를 가장 크게 넓히는 조건 ("조건 하나를 바꾸면?" PDF Page 14, 16) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Sliders className="w-4 h-4 text-rose-500" />
            <span>🔓 인연의 범위를 가장 크게 넓히는 시뮬레이션</span>
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          단 하나의 조건만 살짝 완화해도 매칭 가능한 연인 후보가 대폭 증가합니다. (※ 필수조건(DealBreaker)은 자동 변경되지 않습니다)
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {result.flexibility.map((flex, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">{flex.conditionLabel}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  예상 후보: 약 {flex.newPoolCount}명
                </div>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                +{flex.increasePercent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mutual Match Zone Candidates Section (PDF Page 10, 12) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Mutual Match Zone (쌍방 매칭 호감 후보)</span>
            </h3>
            <p className="text-xs text-slate-500">조화평균(Harmonic Mean)을 거쳐 쌍방 만족도가 검증된 가상 매칭</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {result.mutualCandidates.slice(0, 4).map((candRes) => (
            <div
              key={candRes.candidate.id}
              onClick={() => setSelectedCandidate(candRes)}
              className="p-4 rounded-xl border border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/20 transition-all cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{candRes.candidate.name}</span>
                <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  쌍방 {candRes.mutualScore}점
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {candRes.candidate.region} · {candRes.candidate.age}세 · {candRes.candidate.occupationGroup}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t">
                <span>내가 선호: {candRes.userToCandidate}점</span>
                <span>상대가 선호: {candRes.candidateToUser}점</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic CTA Box (PDF Page 17, 18) */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-rose-200 space-y-4 text-center">
        <span className="bg-white/20 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider inline-block">
          NEXT STEP
        </span>
        <h3 className="text-xl sm:text-2xl font-black">{result.cta.title}</h3>
        <p className="text-xs sm:text-sm text-rose-100 max-w-lg mx-auto">
          {result.cta.subtitle}
        </p>

        <button
          onClick={() => setIsConsultationOpen(true)}
          className="w-full sm:w-auto px-8 py-4 bg-white text-rose-600 hover:bg-rose-50 font-black rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 text-base inline-flex items-center justify-center gap-2"
        >
          <span>{result.cta.buttonText}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Modal candidate detail view if clicked */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg">{selectedCandidate.candidate.name} 프로필 Detail</h4>
                <p className="text-xs text-slate-500">{selectedCandidate.candidate.occupationDetail}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 font-bold">✕</button>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <div>나이/지역: {selectedCandidate.candidate.age}세 / {selectedCandidate.candidate.region}</div>
              <div>신장: {selectedCandidate.candidate.height}cm</div>
              <div>한줄소개: "{selectedCandidate.candidate.summaryQuote}"</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-xs space-y-1">
              <div className="font-bold text-rose-700">쌍방 매칭 점수 산출</div>
              <div>나 → 상대 선호도: {selectedCandidate.userToCandidate}점</div>
              <div>상대 → 나 선호도: {selectedCandidate.candidateToUser}점</div>
              <div className="font-bold text-slate-800">조화평균(Harmonic Mean): {selectedCandidate.mutualScore}점</div>
            </div>
            <button
              onClick={() => setSelectedCandidate(null)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      <ConsultationModal
        result={result}
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        onSaveLead={onSaveLead}
      />
    </div>
  );
};
