import React, { useState } from 'react';
import { Candidate, DimensionsWeights } from '../types';
import { updateImplicitWeight } from '../utils/matchingAlgorithm';
import { Heart, ArrowRight, Star, Sparkles, HelpCircle } from 'lucide-react';

interface Step4DatingGameProps {
  candidates: Candidate[];
  explicitWeight: DimensionsWeights;
  onComplete: (implicitWeight: DimensionsWeights) => void;
}

export const Step4DatingGame: React.FC<Step4DatingGameProps> = ({
  candidates,
  explicitWeight,
  onComplete,
}) => {
  const [currentRound, setCurrentRound] = useState(1);
  const totalRounds = 8;

  const [implicitWeight, setImplicitWeight] = useState<DimensionsWeights>({ ...explicitWeight });

  // Get current pair
  const candidateA = candidates[(currentRound - 1) * 2] || candidates[0];
  const candidateB = candidates[(currentRound - 1) * 2 + 1] || candidates[1];

  const handleChoose = (chosen: Candidate, rejected: Candidate) => {
    const updated = updateImplicitWeight(implicitWeight, chosen, rejected, 0.15);
    setImplicitWeight(updated);

    if (currentRound < totalRounds) {
      setCurrentRound((prev) => prev + 1);
    } else {
      onComplete(updated);
    }
  };

  const RenderProfileCard = ({
    candidate,
    label,
    other,
  }: {
    candidate: Candidate;
    label: string;
    other: Candidate;
  }) => (
    <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-rose-400 transition-all shadow-xs flex flex-col justify-between h-full">
      <div>
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="w-8 h-8 rounded-full bg-rose-500 text-white font-black text-sm flex items-center justify-center shadow-xs">
            {label}
          </span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {candidate.region} · {candidate.age}세
          </span>
        </div>

        {/* Profile Info */}
        <div className="mb-4">
          <h4 className="font-bold text-lg text-slate-900">{candidate.name}</h4>
          <p className="text-xs font-semibold text-rose-600 mb-2">{candidate.occupationGroup} ({candidate.occupationDetail})</p>
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic">
            "{candidate.summaryQuote}"
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {candidate.badgeTags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-rose-50 text-rose-700 font-medium px-2 py-0.5 rounded-md border border-rose-100"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Dimension Star Ratings (PDF Page 7 Example) */}
        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">✨ 외모 호감도</span>
            <div className="flex text-amber-400">
              {Array.from({ length: Math.min(5, Math.ceil(candidate.scores.appearance / 20)) }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">💼 직업/경제력</span>
            <div className="flex text-amber-400">
              {Array.from({ length: Math.min(5, Math.ceil(candidate.scores.career / 20)) }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">😊 성격/대화</span>
            <div className="flex text-amber-400">
              {Array.from({ length: Math.min(5, Math.ceil(candidate.scores.personality / 20)) }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Select Button */}
      <button
        type="button"
        onClick={() => handleChoose(candidate, other)}
        className="w-full mt-5 py-3 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 font-bold text-sm rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
      >
        <Heart className="w-4 h-4 fill-current" />
        <span>이 프로필이 더 끌려요</span>
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Banner */}
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 bg-rose-100 text-rose-700 font-semibold text-xs rounded-full mb-2">
          STEP 4. 가상 소개팅 선택 게임 (실제 행동 측정)
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          두 사람 중 누구에게 더 끌리시나요?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          라운드 {currentRound} / {totalRounds}: 머리로 생각한 조건과 실제 직관적 끌림을 비교 분석합니다
        </p>
      </div>

      {/* Pairwise Profiles */}
      <div className="grid md:grid-cols-2 gap-4">
        <RenderProfileCard candidate={candidateA} label="A" other={candidateB} />
        <RenderProfileCard candidate={candidateB} label="B" other={candidateA} />
      </div>

      {/* Skip button */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => handleChoose(candidateA, candidateB)}
          className="text-xs text-slate-400 hover:text-slate-600 underline flex items-center gap-1 mx-auto"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>두 프로필 모두 비슷해요 (건너뛰기)</span>
        </button>
      </div>
    </div>
  );
};
