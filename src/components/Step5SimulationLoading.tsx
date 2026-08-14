import React, { useEffect, useState } from 'react';
import { Sparkles, Heart, Cpu } from 'lucide-react';

interface Step5SimulationLoadingProps {
  onComplete: () => void;
}

export const Step5SimulationLoading: React.FC<Step5SimulationLoadingProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('1,000명의 가상 후보 프로필 생성 중...');

  useEffect(() => {
    const messages = [
      '1,000명의 가상 후보 프로필 분석 중...',
      '명시적 이상형(65%)과 행동 데이터(35%) 가중치 시뮬레이션 중...',
      '조화평균(Harmonic Mean) 기반 쌍방 매칭률 산출 중...',
      '이상형 희소도 및 조건 완화 시뮬레이션 완료!',
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 400);
          return 100;
        }

        if (next === 25) setStatusMessage(messages[1]);
        if (next === 60) setStatusMessage(messages[2]);
        if (next === 90) setStatusMessage(messages[3]);

        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-rose-100 animate-ping opacity-75" />
        <div className="w-20 h-20 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-200 animate-bounce">
          <Heart className="w-10 h-10 fill-white" />
        </div>
      </div>

      <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center justify-center gap-1.5">
        <Sparkles className="w-5 h-5 text-rose-500" />
        <span>AI 매칭 알고리즘 가동 중</span>
      </h3>
      <p className="text-xs font-semibold text-rose-600 mb-6 h-5">{statusMessage}</p>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner mb-2">
        <div
          className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400 font-medium">
        <span>쌍방 매칭 분석</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
};
