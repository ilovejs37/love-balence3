import React, { useState } from 'react';
import { DimensionKey, DimensionsWeights } from '../types';
import { DIMENSION_LABELS } from '../data/questionsData';
import { ALL_DIMENSIONS } from '../utils/matchingAlgorithm';
import { Coins, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface Step3AuctionProps {
  onComplete: (explicitWeight: DimensionsWeights) => void;
}

const DEFAULT_ALLOCATION: DimensionsWeights = {
  appearance: 15,
  personality: 20,
  communication: 18,
  career: 8,
  economics: 10,
  age: 7,
  lifestyle: 8,
  family: 5,
  hobbies: 2,
  marriageValues: 7,
};

export const Step3Auction: React.FC<Step3AuctionProps> = ({ onComplete }) => {
  const [weights, setWeights] = useState<DimensionsWeights>(DEFAULT_ALLOCATION);

  const totalUsed = ALL_DIMENSIONS.reduce((sum, dim) => sum + (weights[dim] || 0), 0);
  const remainingPoints = 100 - totalUsed;

  const handleChange = (dim: DimensionKey, delta: number) => {
    setWeights((prev) => {
      const current = prev[dim] || 0;
      const target = current + delta;
      if (target < 0) return prev;
      if (delta > 0 && remainingPoints < delta) return prev; // Cannot exceed 100 total
      return { ...prev, [dim]: target };
    });
  };

  const handleSliderChange = (dim: DimensionKey, val: number) => {
    setWeights((prev) => {
      const current = prev[dim] || 0;
      const diff = val - current;
      if (diff > 0 && remainingPoints < diff) {
        return { ...prev, [dim]: current + remainingPoints };
      }
      return { ...prev, [dim]: Math.max(0, val) };
    });
  };

  const handleReset = () => {
    setWeights({
      appearance: 10,
      personality: 10,
      communication: 10,
      career: 10,
      economics: 10,
      age: 10,
      lifestyle: 10,
      family: 10,
      hobbies: 10,
      marriageValues: 10,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Banner */}
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-semibold text-xs rounded-full mb-2">
          STEP 3. 핵심 게임: 배우자 조건 100점 경매
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          당신에게 100포인트가 있습니다!
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          배우자를 선택한다면 어디에 몇 점을 가중치로 배분하시겠습니까? (합계 100점 필수)
        </p>
      </div>

      {/* Sticky Points Gauge Counter */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-md mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">남은 포인트</div>
            <div
              className={`text-2xl font-black ${
                remainingPoints === 0
                  ? 'text-emerald-600'
                  : remainingPoints > 0
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {remainingPoints} <span className="text-sm font-normal text-slate-500">/ 100pt</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-24 bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                remainingPoints === 0 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, totalUsed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Categories Allocator List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        {ALL_DIMENSIONS.map((dim) => {
          const meta = DIMENSION_LABELS[dim];
          const pts = weights[dim] || 0;

          return (
            <div key={dim} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <div>
                    <span className="font-bold text-sm text-slate-800">{meta.label}</span>
                    <span className="text-xs text-slate-400 ml-2 hidden sm:inline">{meta.description}</span>
                  </div>
                </div>

                {/* Counter buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleChange(dim, -1)}
                    disabled={pts <= 0}
                    className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-30 text-slate-700 font-bold text-sm flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-black text-rose-600 text-sm">
                    {pts}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChange(dim, 1)}
                    disabled={remainingPoints <= 0}
                    className="w-7 h-7 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:opacity-30 text-white font-bold text-sm flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={40}
                value={pts}
                onChange={(e) => handleSliderChange(dim, parseInt(e.target.value))}
                className="w-full accent-rose-500 h-1.5"
              />
            </div>
          );
        })}

        {/* Warning if points not equal to 100 */}
        {remainingPoints !== 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {remainingPoints > 0
                ? `아직 ${remainingPoints}포인트가 남아있습니다. 모두 배분해 주세요!`
                : `${Math.abs(remainingPoints)}포인트 초과되었습니다. 100점에 맞춰주세요.`}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={remainingPoints !== 0}
          onClick={() => onComplete(weights)}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:shadow-none text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 mt-4"
        >
          <span>가상 소개팅 프로필 선택 게임 시작</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
