import React, { useState } from 'react';
import { SelfProfile } from '../types';
import { SELF_QUESTIONS } from '../data/questionsData';
import { User, MapPin, Briefcase, Ruler, ArrowRight, Check } from 'lucide-react';

interface Step1SelfProfileProps {
  onComplete: (profile: SelfProfile) => void;
}

const REGIONS = ['서울', '경기/인천', '부산/경남', '대구/경북', '대전/충청', '광주/전라', '강원', '제주'];
const OCCUPATIONS = ['전문직', '대기업', '공기업/공무원', 'IT/개발', '사업가/자영업', '금융/증권', '의료/보건', '교육/연구', '기타'];

export const Step1SelfProfile: React.FC<Step1SelfProfileProps> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [profile, setProfile] = useState<SelfProfile>({
    age: 32,
    gender: '남성',
    region: '서울',
    height: 177,
    occupationGroup: '대기업',
    personality: {
      extroversion: 65,
      emotionalStability: 75,
      openness: 70,
      conscientiousness: 80,
      agreeableness: 80,
    },
    lifestyle: {
      drinking: '가끔',
      smoking: '비흡연',
      exercise: '주 1~2회',
      travel: '가끔여행',
    },
    marriage: {
      marriageIntent: 90,
      children: '원함',
      dualIncome: '필수선호',
      familyImportance: 80,
    },
    relationship: {
      communication: 85,
      affectionExpression: 75,
      independence: 70,
      stability: 85,
    },
  });

  const question = SELF_QUESTIONS[currentQuestionIndex];

  const handleBasicComplete = () => {
    setCurrentQuestionIndex(1);
  };

  const handleOptionSelect = (patch: any) => {
    setProfile((prev) => {
      const updated = { ...prev };
      if (patch.personality) updated.personality = { ...prev.personality, ...patch.personality };
      if (patch.lifestyle) updated.lifestyle = { ...prev.lifestyle, ...patch.lifestyle };
      if (patch.marriage) updated.marriage = { ...prev.marriage, ...patch.marriage };
      if (patch.relationship) updated.relationship = { ...prev.relationship, ...patch.relationship };
      return updated;
    });

    if (currentQuestionIndex < SELF_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onComplete(profile);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Step Banner */}
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 font-semibold text-xs rounded-full mb-2">
          STEP 1. 나의 기본 정보 & 성향 파악
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          MATCH ME!!
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          간단한 질문에 답하는 동안 당신의 매칭 성향을 분석합니다
        </p>
      </div>

      {/* Basic Profile Setup Card (Question Index 0) */}
      {currentQuestionIndex === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-rose-500" /> 기본 인적 사항
          </h3>

          <div className="space-y-5">
            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">성별</label>
              <div className="grid grid-cols-2 gap-3">
                {(['남성', '여성'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, gender: g }))}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                      profile.gender === g
                        ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Age & Height */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>나이 (만)</span>
                  <span className="text-rose-600 font-bold">{profile.age}세</span>
                </label>
                <input
                  type="range"
                  min={23}
                  max={55}
                  value={profile.age}
                  onChange={(e) => setProfile((p) => ({ ...p, age: parseInt(e.target.value) }))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" /> 신장</span>
                  <span className="text-rose-600 font-bold">{profile.height}cm</span>
                </label>
                <input
                  type="range"
                  min={150}
                  max={195}
                  value={profile.height}
                  onChange={(e) => setProfile((p) => ({ ...p, height: parseInt(e.target.value) }))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 거주 지역
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, region: r }))}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                      profile.region === r
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Occupation Group */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> 직업군
              </label>
              <div className="grid grid-cols-3 gap-2">
                {OCCUPATIONS.map((occ) => (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, occupationGroup: occ }))}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                      profile.occupationGroup === occ
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBasicComplete}
            className="w-full mt-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2"
          >
            <span>다음 질문 진행하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Card Question Mode */
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
            <span>질문 {currentQuestionIndex} / {SELF_QUESTIONS.length - 1}</span>
            <span className="text-rose-600 font-semibold">{question.category}</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">{question.title}</h3>
          {question.subtitle && <p className="text-xs text-slate-500 mb-5">{question.subtitle}</p>}

          <div className="space-y-3">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleOptionSelect(opt.patch)}
                className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all group flex items-start justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-800 group-hover:text-rose-700">
                    {opt.label}
                  </div>
                  {opt.description && (
                    <p className="text-xs text-slate-500 mt-1">{opt.description}</p>
                  )}
                </div>
                <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-rose-500 group-hover:bg-rose-500 flex items-center justify-center text-white text-xs transition-colors shrink-0 mt-0.5">
                  <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
