import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Step1SelfProfile } from './components/Step1SelfProfile';
import { Step2IdealProfile } from './components/Step2IdealProfile';
import { Step3Auction } from './components/Step3Auction';
import { Step4DatingGame } from './components/Step4DatingGame';
import { Step5SimulationLoading } from './components/Step5SimulationLoading';
import { Step6ResultReport } from './components/Step6ResultReport';
import { AdminDashboard } from './components/AdminDashboard';

import {
  SelfProfile,
  IdealProfile,
  DimensionsWeights,
  LoveMatchTestResult,
  LeadConsultation,
} from './types';
import { generateCandidatePool } from './data/mockCandidates';
import { runLoveMatchTest } from './utils/matchingAlgorithm';
import {
  getOrCreateSessionId,
  resetSessionId,
  saveRecord,
  fetchRecords,
} from './services/storageService';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [pendingLeadsCount, setPendingLeadsCount] = useState(0);

  // State data collected through steps
  const [selfProfile, setSelfProfile] = useState<SelfProfile | null>(null);
  const [idealProfile, setIdealProfile] = useState<IdealProfile | null>(null);
  const [explicitWeight, setExplicitWeight] = useState<DimensionsWeights | null>(null);
  const [implicitWeight, setImplicitWeight] = useState<DimensionsWeights | null>(null);
  const [testResult, setTestResult] = useState<LoveMatchTestResult | null>(null);

  // Check URL hash for admin mode on initial load
  useEffect(() => {
    if (window.location.hash === '#admin') {
      setIsAdminOpen(true);
    }

    const checkPendingCount = async () => {
      try {
        const records = await fetchRecords();
        const pending = records.filter((r) => r.leadStatus === '대기').length;
        setPendingLeadsCount(pending);
      } catch (err) {
        console.error(err);
      }
    };
    checkPendingCount();
  }, []);

  // Determine opposite gender for matching candidates
  const targetCandidateGender = selfProfile?.gender === '남성' ? '여성' : (selfProfile?.gender === '여성' ? '남성' : undefined);

  // Generate candidate pool matching opposite gender
  const candidatePool = useMemo(() => {
    return generateCandidatePool(150, targetCandidateGender);
  }, [targetCandidateGender]);

  const handleStep1Complete = (profile: SelfProfile) => {
    setSelfProfile(profile);
    saveRecord({
      id: getOrCreateSessionId(),
      completionStep: 1,
      selfProfile: profile,
    });
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep2Complete = (ideal: IdealProfile) => {
    setIdealProfile(ideal);
    saveRecord({
      id: getOrCreateSessionId(),
      completionStep: 2,
      idealProfile: ideal,
    });
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep3Complete = (explicit: DimensionsWeights) => {
    setExplicitWeight(explicit);
    saveRecord({
      id: getOrCreateSessionId(),
      completionStep: 3,
      explicitWeight: explicit,
    });
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep4Complete = (implicit: DimensionsWeights) => {
    setImplicitWeight(implicit);
    saveRecord({
      id: getOrCreateSessionId(),
      completionStep: 4,
      implicitWeight: implicit,
    });
    setCurrentStep(5);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStep5SimulationComplete = () => {
    if (selfProfile && idealProfile && explicitWeight && implicitWeight) {
      const result = runLoveMatchTest(
        selfProfile,
        idealProfile,
        explicitWeight,
        implicitWeight,
        candidatePool
      );
      setTestResult(result);

      // Persist complete simulation result
      saveRecord({
        id: getOrCreateSessionId(),
        completionStep: 6,
        hasCompletedTest: true,
        selfProfile,
        idealProfile,
        explicitWeight,
        implicitWeight,
        summary: {
          archetypeTitle: result.archetype.title,
          archetypeCode: result.archetype.code,
          archetypeDescription: result.archetype.description,
          preferenceConsistency: result.preferenceConsistency,
          consistencyComment: result.consistencyComment,
          rarityPercent: result.rarityPercent,
          rarityCount: result.rarityCount,
          rarityComment: result.rarityComment,
          mutualMatchCount: result.mutualCandidates.length,
          topMutualScore: result.mutualCandidates[0]?.mutualScore || 0,
          attractedTypes: result.attractedTypes,
          attractedToUserTypes: result.attractedToUserTypes,
          recommendedAdjustment: result.flexibility[0]?.conditionLabel || '연령 범위 확장 권장',
          ctaTitle: result.cta.title,
          ctaButtonText: result.cta.buttonText,
        },
      });
    }
    setCurrentStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveLead = async (lead: LeadConsultation) => {
    await saveRecord({
      id: getOrCreateSessionId(),
      hasLeadConsultation: true,
      leadStatus: '대기',
      leadInfo: {
        name: lead.name,
        phone: lead.phone,
        preferredTime: lead.preferredTime,
        consent: lead.consent,
        submittedAt: new Date().toISOString(),
      },
    });
    setPendingLeadsCount((prev) => prev + 1);
  };

  const handleReset = () => {
    resetSessionId();
    setSelfProfile(null);
    setIdealProfile(null);
    setExplicitWeight(null);
    setImplicitWeight(null);
    setTestResult(null);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-rose-500 selection:text-white">
      <Header
        currentStep={currentStep}
        totalSteps={6}
        onReset={handleReset}
        onOpenAdmin={() => setIsAdminOpen(true)}
        pendingLeadsCount={pendingLeadsCount}
      />

      <main className="pb-16">
        {currentStep === 1 && <Step1SelfProfile onComplete={handleStep1Complete} />}

        {currentStep === 2 && <Step2IdealProfile onComplete={handleStep2Complete} />}

        {currentStep === 3 && <Step3Auction onComplete={handleStep3Complete} />}

        {currentStep === 4 && explicitWeight && (
          <Step4DatingGame
            candidates={candidatePool}
            explicitWeight={explicitWeight}
            onComplete={handleStep4Complete}
          />
        )}

        {currentStep === 5 && (
          <Step5SimulationLoading onComplete={handleStep5SimulationComplete} />
        )}

        {currentStep === 6 && testResult && (
          <Step6ResultReport
            result={testResult}
            onRestart={handleReset}
            onSaveLead={handleSaveLead}
          />
        )}
      </main>

      {/* Admin Dashboard Modal */}
      {isAdminOpen && (
        <AdminDashboard
          onClose={() => {
            setIsAdminOpen(false);
            if (window.location.hash === '#admin') {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
          onRecordsChange={async () => {
            try {
              const records = await fetchRecords();
              const pending = records.filter((r) => r.leadStatus === '대기').length;
              setPendingLeadsCount(pending);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
    </div>
  );
}
