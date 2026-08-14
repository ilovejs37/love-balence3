import React, { useState } from 'react';
import { IdealProfile, ImportanceLevel } from '../types';
import { Heart, ShieldAlert, ArrowRight, Check } from 'lucide-react';

interface Step2IdealProfileProps {
  onComplete: (ideal: IdealProfile) => void;
}

const REGIONS = ['서울', '경기/인천', '부산/경남', '대구/경북', '대전/충청', '광주/전라', '강원', '제주'];
const ALL_OCCUPATIONS = ['전문직', '대기업', '공기업/공무원', 'IT/개발', '사업가/자영업', '금융/증권', '의료/보건', '교육/연구', '기타'];

export const Step2IdealProfile: React.FC<Step2IdealProfileProps> = ({ onComplete }) => {
  const [ideal, setIdeal] = useState<IdealProfile>({
    ageMin: 28,
    ageMax: 36,
    ageImportance: 'nice',
    ageDealBreaker: false,

    heightMin: 173,
    heightImportance: 'nice',

    regions: ['서울', '경기/인천'],
    regionImportance: 'nice',

    occupations: ['전문직', '대기업', '공기업/공무원', 'IT/개발'],
    occupationImportance: 'nice',

    smokingPreferred: '비흡연만',
    smokingDealBreaker: true, // 흡연자 절대 불가 (Page 3-4 example: dealBreaker)

    drinkingPreferred: '적당히',
    childrenPreferred: '원함',
    dualIncomePreferred: '맞벌이선호',

    priorityTraits: {
      warmth: 85,
      extroversion: 60,
      responsibility: 85,
      communication: 90,
    },
  });

  const toggleRegion = (r: string) => {
    setIdeal((prev) => {
      const exists = prev.regions.includes(r);
      const updated = exists ? prev.regions.filter((item) => item !== r) : [...prev.regions, r];
      return { ...prev, regions: updated.length === 0 ? ['서울'] : updated };
    });
  };

  const toggleOccupation = (occ: string) => {
    setIdeal((prev) => {
      const exists = prev.occupations.includes(occ);
      const updated = exists ? prev.occupations.filter((item) => item !== occ) : [...prev.occupations, occ];
      return { ...prev, occupations: updated.length === 0 ? ['대기업'] : updated };
    });
  };

  const ImportanceSelector = ({
    value,
    onChange,
  }: {
    value: ImportanceLevel;
    onChange: (val: ImportanceLevel) => void;
  }) => (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
      <button
        type="button"
        onClick={() => onChange('must')}
        className={`px-2 py-1 rounded-md transition-all ${
          value === 'must' ? 'bg-rose-500 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        ❤️ 꼭 중요함
      </button>
      <button
        type="button"
        onClick={() => onChange('nice')}
        className={`px-2 py-1 rounded-md transition-all ${
          value === 'nice' ? 'bg-amber-500 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        🙂 가능하면
      </button>
      <button
        type="button"
        onClick={() => onChange('any')}
        className={`px-2 py-1 rounded-md transition-all ${
          value === 'any' ? 'bg-slate-500 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        👌 상관없음
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 font-semibold text-xs rounded-full mb-2">
          STEP 2. 배우자에게 원하는 조건 (중요도 3단계 설정)
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          내 이상형의 필수 & 선호 조건
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          조건별 중요도를 설정해주세요. absolute deal-breaker는 필수조건으로 반영됩니다.
        </p>
      </div>

      <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        {/* Age Range */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <span>🎂 선호 연령대</span>
              <span className="text-rose-600 font-bold text-xs">
                만 {ideal.ageMin}세 ~ {ideal.ageMax}세
              </span>
            </label>
            <ImportanceSelector
              value={ideal.ageImportance}
              onChange={(val) => setIdeal((prev) => ({ ...prev, ageImportance: val }))}
            />
          </div>

          <div className="flex gap-4 items-center mt-3">
            <input
              type="range"
              min={22}
              max={50}
              value={ideal.ageMin}
              onChange={(e) =>
                setIdeal((p) => ({
                  ...p,
                  ageMin: Math.min(parseInt(e.target.value), p.ageMax - 1),
                }))
              }
              className="w-full accent-rose-500"
            />
            <span className="text-slate-400 text-xs">~</span>
            <input
              type="range"
              min={23}
              max={55}
              value={ideal.ageMax}
              onChange={(e) =>
                setIdeal((p) => ({
                  ...p,
                  ageMax: Math.max(parseInt(e.target.value), p.ageMin + 1),
                }))
              }
              className="w-full accent-rose-500"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
            <span className="text-slate-500">나이 범위 외 대상 제한 (Deal-Breaker)</span>
            <button
              type="button"
              onClick={() => setIdeal((p) => ({ ...p, ageDealBreaker: !p.ageDealBreaker }))}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                ideal.ageDealBreaker ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{ideal.ageDealBreaker ? '절대 양보 불가 (ON)' : '유연하게 적용 (OFF)'}</span>
            </button>
          </div>
        </div>

        {/* Height */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <span>📏 희망 최소 신장</span>
              <span className="text-rose-600 font-bold text-xs">{ideal.heightMin}cm 이상</span>
            </label>
            <ImportanceSelector
              value={ideal.heightImportance}
              onChange={(val) => setIdeal((prev) => ({ ...prev, heightImportance: val }))}
            />
          </div>
          <input
            type="range"
            min={155}
            max={190}
            value={ideal.heightMin}
            onChange={(e) => setIdeal((p) => ({ ...p, heightMin: parseInt(e.target.value) }))}
            className="w-full accent-rose-500 mt-2"
          />
        </div>

        {/* Smoking Dealbreaker (Page 3 PDF Example) */}
        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span>🚭 흡연 여부 조건</span>
            </label>
            <button
              type="button"
              onClick={() => setIdeal((p) => ({ ...p, smokingDealBreaker: !p.smokingDealBreaker }))}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                ideal.smokingDealBreaker ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{ideal.smokingDealBreaker ? '❤️ 흡연자 절대 불가 (필수조건)' : '상관없음'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500">
            필수조건(DealBreaker)으로 설정 시 흡연자 프로필은 매칭 가중치 계산 없이 즉시 제외됩니다.
          </p>
        </div>

        {/* Region */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-sm text-slate-800">📍 희망 지역</label>
            <ImportanceSelector
              value={ideal.regionImportance}
              onChange={(val) => setIdeal((prev) => ({ ...prev, regionImportance: val }))}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {REGIONS.map((r) => {
              const selected = ideal.regions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRegion(r)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                    selected ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 inline mr-1" />}
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Occupation */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-sm text-slate-800">💼 희망 직업군</label>
            <ImportanceSelector
              value={ideal.occupationImportance}
              onChange={(val) => setIdeal((prev) => ({ ...prev, occupationImportance: val }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {ALL_OCCUPATIONS.map((occ) => {
              const selected = ideal.occupations.includes(occ);
              return (
                <button
                  key={occ}
                  type="button"
                  onClick={() => toggleOccupation(occ)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                    selected ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {occ}
                </button>
              );
            })}
          </div>
        </div>

        {/* Complete button */}
        <button
          type="button"
          onClick={() => onComplete(ideal)}
          className="w-full mt-4 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2"
        >
          <span>100점 배우자 조건 경매로 이동</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
