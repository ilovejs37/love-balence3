import React, { useState } from 'react';
import { LoveMatchTestResult, LeadConsultation, ConsultationPayload } from '../types';
import { X, CheckCircle2, PhoneCall, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ConsultationModalProps {
  result: LoveMatchTestResult;
  isOpen: boolean;
  onClose: () => void;
  onSaveLead?: (lead: LeadConsultation) => void;
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  result,
  isOpen,
  onClose,
  onSaveLead,
}) => {
  const [lead, setLead] = useState<LeadConsultation>({
    name: '',
    phone: '',
    preferredTime: '평일 오후 2시~6시',
    consent: true,
  });

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.name || !lead.phone) return;

    if (onSaveLead) {
      onSaveLead(lead);
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    setSubmitted(true);
  };

  // Structured payload generated for the manager (PDF Page 19-20)
  const managerPayload: ConsultationPayload = {
    customer: {
      name: lead.name || '성진',
      phone: lead.phone || '010-XXXX-XXXX',
      age: result.selfProfile.age,
      gender: result.selfProfile.gender,
      region: result.selfProfile.region,
      preferredTime: lead.preferredTime,
    },
    relationshipIntent: result.selfProfile.marriage.marriageIntent,
    topPriorities: result.explicitVsActual.slice(0, 3).map((item) => item.label),
    dealBreakers: result.idealProfile.smokingDealBreaker ? ['흡연자 절대 불가'] : [],
    explicitPreference: result.explicitWeight,
    behavioralPreference: result.implicitWeight,
    preferredType: result.attractedTypes[0],
    mutualType: result.attractedToUserTypes[0],
    rarity: result.rarityPercent,
    recommendedAdjustment: '연령범위 +2년 확장 권장',
    testCompletion: 100,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-5 text-white flex items-start justify-between">
          <div>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
              VIP 1:1 커플매니저 매칭 분석
            </span>
            <h3 className="text-lg font-bold">{result.cta.title}</h3>
            <p className="text-xs text-rose-100 mt-1">{result.cta.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              상담 신청이 완료되었습니다!
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              분석된 매칭 성향 리포트 데이터가 담당 전문 커플 매니저에게 전달되었습니다. 희망하신 시간에 맞춰 따뜻하게 연락드리겠습니다.
            </p>

            {/* Manager Script Preview */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 space-y-2">
              <span className="font-bold text-rose-600 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5" /> 커플매니저 전화 안내 멘트 예시
              </span>
              <p className="italic bg-white p-2.5 rounded-lg border border-slate-200">
                "{lead.name}님, 테스트 결과를 확인해 보니 처음에는 {managerPayload.topPriorities[0]} 조건을 가장 중요하게 선택하셨지만, 실제 프로필 선택에서는 대화 스타일과 첫인상의 영향도 크게 나타났어요! 맞춤 추천을 안내해 드릴게요."
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors"
            >
              확인 및 닫기
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-xs text-slate-500 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                상담에 꼭 필요한 최소 3개 항목만 입력받습니다. (추가 질문 없음)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">성함</label>
              <input
                type="text"
                required
                placeholder="홍길동"
                value={lead.name}
                onChange={(e) => setLead({ ...lead, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">연락처</label>
              <input
                type="tel"
                required
                placeholder="010-1234-5678"
                value={lead.phone}
                onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">상담 가능 시간</label>
              <select
                value={lead.preferredTime}
                onChange={(e) => setLead({ ...lead, preferredTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-rose-500"
              >
                <option value="평일 오전 10시~12시">평일 오전 10시~12시</option>
                <option value="평일 오후 2시~6시">평일 오후 2시~6시</option>
                <option value="평일 저녁 6시~8시">평일 저녁 6시~8시</option>
                <option value="주말 시간대 상관없음">주말 시간대 상관없음</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <input
                type="checkbox"
                id="consent"
                checked={lead.consent}
                onChange={(e) => setLead({ ...lead, consent: e.target.checked })}
                className="accent-rose-500"
              />
              <label htmlFor="consent" className="cursor-pointer">
                개인정보 수집 및 상담 안내에 동의합니다.
              </label>
            </div>

            <button
              type="submit"
              disabled={!lead.consent || !lead.name || !lead.phone}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              <Send className="w-4 h-4" />
              <span>{result.cta.buttonText}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
