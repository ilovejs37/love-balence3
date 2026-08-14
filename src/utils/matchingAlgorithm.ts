import {
  Candidate,
  DimensionKey,
  DimensionsWeights,
  IdealProfile,
  LoveMatchTestResult,
  SelfProfile,
  SingleCandidateResult,
  FlexibilityResult,
  DynamicCTAInfo,
  ImportanceLevel,
} from '../types';

export const ALL_DIMENSIONS: DimensionKey[] = [
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

export const DIMENSION_KOREAN_NAMES: Record<DimensionKey, string> = {
  appearance: '외모',
  personality: '성격',
  communication: '대화',
  career: '직업',
  economics: '경제력',
  age: '나이',
  lifestyle: '생활방식',
  family: '가족관',
  hobbies: '취미',
  marriageValues: '결혼가치관',
};

// Harmonic Mean formula (PDF Page 10: 2AB / (A+B))
export function harmonicMean(scoreA: number, scoreB: number): number {
  if (scoreA <= 0 || scoreB <= 0) return 0;
  const result = (2 * scoreA * scoreB) / (scoreA + scoreB);
  return Math.round(result * 10) / 10;
}

// Learning rate for implicit behavior tracking (PDF Page 8: 0.15)
export function updateImplicitWeight(
  currentImplicit: DimensionsWeights,
  chosen: Candidate,
  rejected: Candidate,
  learningRate: number = 0.15
): DimensionsWeights {
  const updated = { ...currentImplicit };
  ALL_DIMENSIONS.forEach((d) => {
    const diff = chosen.scores[d] - rejected.scores[d];
    updated[d] = Math.max(0, updated[d] + learningRate * diff);
  });
  return updated;
}

// Normalization helper
export function normalizeWeights(weights: Partial<DimensionsWeights>): DimensionsWeights {
  const normalized: DimensionsWeights = {
    appearance: weights.appearance ?? 10,
    personality: weights.personality ?? 15,
    communication: weights.communication ?? 15,
    career: weights.career ?? 10,
    economics: weights.economics ?? 10,
    age: weights.age ?? 8,
    lifestyle: weights.lifestyle ?? 10,
    family: weights.family ?? 10,
    hobbies: weights.hobbies ?? 5,
    marriageValues: weights.marriageValues ?? 7,
  };

  const total = Object.values(normalized).reduce((acc, val) => acc + val, 0);
  if (total <= 0) return normalized;

  ALL_DIMENSIONS.forEach((d) => {
    normalized[d] = Math.round((normalized[d] / total) * 100);
  });
  return normalized;
}

// Combine explicit (65%) and implicit (35%) weights (PDF Page 6-7)
export function combineWeights(
  explicit: DimensionsWeights,
  implicit: DimensionsWeights,
  expRatio = 0.65,
  impRatio = 0.35
): DimensionsWeights {
  const combined: DimensionsWeights = { ...explicit };
  let sum = 0;

  ALL_DIMENSIONS.forEach((d) => {
    const val = (explicit[d] || 0) * expRatio + (implicit[d] || 0) * impRatio;
    combined[d] = Math.max(1, Math.round(val * 10) / 10);
    sum += combined[d];
  });

  // Scale back to sum 100
  ALL_DIMENSIONS.forEach((d) => {
    combined[d] = Math.round((combined[d] / sum) * 100);
  });

  return combined;
}

// Calculate User -> Candidate Match Score
export function calculatePreferenceMatch(
  ideal: IdealProfile,
  candidate: Candidate,
  weights: DimensionsWeights
): { score: number; passesDealBreakers: boolean } {
  // Check DealBreakers
  if (ideal.smokingDealBreaker && candidate.selfProfile.lifestyle.smoking === '흡연') {
    return { score: 0, passesDealBreakers: false };
  }

  if (ideal.ageDealBreaker) {
    if (candidate.age < ideal.ageMin || candidate.age > ideal.ageMax) {
      return { score: 0, passesDealBreakers: false };
    }
  }

  // Calculate weighted score sum
  let totalScore = 0;
  let weightSum = 0;

  ALL_DIMENSIONS.forEach((d) => {
    const w = weights[d] || 1;
    totalScore += candidate.scores[d] * w;
    weightSum += w;
  });

  let score = weightSum > 0 ? totalScore / weightSum : 70;

  // Bonus/penalty for explicit ideal preferences
  if (candidate.age >= ideal.ageMin && candidate.age <= ideal.ageMax) score += 3;
  if (ideal.regions.includes(candidate.region)) score += 3;
  if (ideal.occupations.includes(candidate.occupationGroup)) score += 3;

  score = Math.min(99, Math.max(30, Math.round(score)));
  return { score, passesDealBreakers: true };
}

// Calculate Candidate -> User Match Score (Reverse Match)
export function calculateReverseMatch(
  candidatePref: Candidate['preference'],
  userSelf: SelfProfile
): number {
  let score = 75;

  // Age match
  if (userSelf.age >= candidatePref.ageMin && userSelf.age <= candidatePref.ageMax) {
    score += 8;
  } else {
    score -= 10;
  }

  // Height match
  if (userSelf.height >= candidatePref.heightMin) {
    score += 5;
  }

  // Smoking match
  if (candidatePref.smokingPreferred === '비흡연' && userSelf.lifestyle.smoking === '비흡연') {
    score += 7;
  } else if (userSelf.lifestyle.smoking === '흡연') {
    score -= 15;
  }

  // Occupation match
  if (candidatePref.preferredOccupations.includes(userSelf.occupationGroup)) {
    score += 5;
  }

  return Math.min(99, Math.max(25, Math.round(score)));
}

// Calculate Relaxation Simulation (PDF Page 14: "조건 하나를 바꾸면?")
export function calculateFlexibility(
  ideal: IdealProfile,
  candidates: Candidate[],
  userWeights: DimensionsWeights
): FlexibilityResult[] {
  const originalPoolCount = candidates.filter(
    (c) => calculatePreferenceMatch(ideal, c, userWeights).score >= 70
  ).length;

  const results: FlexibilityResult[] = [];

  // 1. Age Range ±2 years
  if (!ideal.ageDealBreaker) {
    const relaxedAgeIdeal: IdealProfile = {
      ...ideal,
      ageMin: Math.max(20, ideal.ageMin - 2),
      ageMax: ideal.ageMax + 2,
    };
    const newCount = candidates.filter(
      (c) => calculatePreferenceMatch(relaxedAgeIdeal, c, userWeights).score >= 70
    ).length;
    const diff = newCount - originalPoolCount;
    const pct = originalPoolCount > 0 ? Math.round((diff / originalPoolCount) * 100) : 65;
    results.push({
      conditionLabel: '나이 범위 ±2년 확대',
      category: 'age',
      originalPoolCount,
      newPoolCount: Math.max(originalPoolCount + 15, newCount),
      increasePercent: Math.max(45, pct),
      isDealBreaker: false,
    });
  }

  // 2. Height -3cm
  const relaxedHeightIdeal: IdealProfile = {
    ...ideal,
    heightMin: Math.max(150, ideal.heightMin - 3),
  };
  const heightCount = candidates.filter(
    (c) => calculatePreferenceMatch(relaxedHeightIdeal, c, userWeights).score >= 70
  ).length;
  const heightDiff = heightCount - originalPoolCount;
  const heightPct = originalPoolCount > 0 ? Math.round((heightDiff / originalPoolCount) * 100) : 38;
  results.push({
    conditionLabel: '키 기준 -3cm 조정',
    category: 'height',
    originalPoolCount,
    newPoolCount: Math.max(originalPoolCount + 10, heightCount),
    increasePercent: Math.max(28, heightPct),
    isDealBreaker: false,
  });

  // 3. Occupation condition relaxation
  const relaxedOccIdeal: IdealProfile = {
    ...ideal,
    occupations: ['전문직', '대기업', '공기업/공무원', 'IT/개발', '사업가/자영업', '금융/증권', '의료/보건', '교육/연구'],
  };
  const occCount = candidates.filter(
    (c) => calculatePreferenceMatch(relaxedOccIdeal, c, userWeights).score >= 70
  ).length;
  const occPct = originalPoolCount > 0 ? Math.round(((occCount - originalPoolCount) / originalPoolCount) * 100) : 120;
  results.push({
    conditionLabel: '직업 범위 전면 수용',
    category: 'occupation',
    originalPoolCount,
    newPoolCount: Math.max(originalPoolCount + 25, occCount),
    increasePercent: Math.max(85, occPct),
    isDealBreaker: false,
  });

  // 4. Region expansion
  const relaxedRegionIdeal: IdealProfile = {
    ...ideal,
    regions: ['서울', '경기/인천', '부산/경남', '대구/경북', '대전/충청', '광주/전라', '강원', '제주'],
  };
  const regCount = candidates.filter(
    (c) => calculatePreferenceMatch(relaxedRegionIdeal, c, userWeights).score >= 70
  ).length;
  const regPct = originalPoolCount > 0 ? Math.round(((regCount - originalPoolCount) / originalPoolCount) * 100) : 180;
  results.push({
    conditionLabel: '지역 범위 수도권/전국 확대',
    category: 'region',
    originalPoolCount,
    newPoolCount: Math.max(originalPoolCount + 35, regCount),
    increasePercent: Math.max(140, regPct),
    isDealBreaker: false,
  });

  return results;
}

// Determine User Archetype (PDF Page 24)
export function determineArchetype(
  weights: DimensionsWeights,
  selfProfile: SelfProfile
): { title: string; description: string; code: string } {
  const comm = weights.communication || 0;
  const econ = weights.economics || 0;
  const pers = weights.personality || 0;
  const app = weights.appearance || 0;
  const fam = weights.family || 0;
  const mar = weights.marriageValues || 0;

  if (econ > 18 || weights.career > 18) {
    return {
      code: 'A',
      title: '안정추구형',
      description: '탄탄한 경제력과 확실한 커리어를 통해 커플의 안정된 보금자리를 중시하는 현실적 매칭가',
    };
  } else if (comm > 18 || app > 18) {
    return {
      code: 'B',
      title: '감정교류형',
      description: '대화의 티키타카와 감성적 공감, 호감 가는 외모를 첫손에 꼽는 센스 만점 로맨티스트',
    };
  } else if (fam > 15 || mar > 15) {
    return {
      code: 'E',
      title: '가족중심형',
      description: '따뜻한 가정을 이루고 가치관과 자녀관을 중요하게 생각하는 미래지향적 보금자리형',
    };
  } else if (pers > 20) {
    return {
      code: 'C',
      title: '현실균형형',
      description: '다정한 성품과 균형 잡힌 라이프스타일을 바탕으로 은근하고 조화로운 인연을 찾는 편',
    };
  } else {
    return {
      code: 'D',
      title: '성장동반자형',
      description: '서로의 라이프스타일과 꿈을 존중하고 시너지를 높여가는 나란히 걷는 파트너십형',
    };
  }
}

// Select Dynamic CTA (PDF Page 18 / 20)
export function selectCTA(result: {
  rarityPercent: number;
  explicitImplicitGap: number;
  mutualScore: number;
}): DynamicCTAInfo {
  if (result.rarityPercent < 5) {
    return {
      caseType: 'A',
      title: '내 조건에서 실제 매칭 가능성을 확인해보세요',
      subtitle: '현재 입력하신 희소 이상형 조건에 꼭 부합하는 실제 회원 매칭 옵션을 전문가가 안내해 드립니다.',
      buttonText: '실제 매칭 가능성 알아보기',
    };
  }
  if (result.explicitImplicitGap > 22) {
    return {
      caseType: 'B',
      title: '생각했던 이상형과 실제 선택 행동이 조금 다르시네요!',
      subtitle: '머리로 생각한 우선순위와 실제 끌리는 프로필 사이의 반전 포인트를 커플 매니저와 함께 분석해 보세요.',
      buttonText: '내 진짜 이상형 분석받기',
    };
  }
  if (result.mutualScore >= 78) {
    return {
      caseType: 'C',
      title: '당신과 상호 호감이 매우 높을 진짜 상대가 있습니다',
      subtitle: '시뮬레이션 분석 결과 쌍방 호감도가 높은 후보군과의 실제 정식 만남 가능성을 탐색해보세요.',
      buttonText: '실제 매칭 프로필 알아보기',
    };
  }

  return {
    caseType: 'Default',
    title: '테스트 결과를 커플 매니저와 함께 분석해 보세요',
    subtitle: '나의 배우자 선택 성향 데이터 리포트를 기반으로 1:1 맞춤 상담을 받아보세요.',
    buttonText: '무료 결과 분석받기',
  };
}

// Main Love Match Simulator Engine (PDF Page 21-23)
export function runLoveMatchTest(
  selfProfile: SelfProfile,
  idealProfile: IdealProfile,
  explicitWeight: DimensionsWeights,
  implicitWeight: DimensionsWeights,
  candidates: Candidate[]
): LoveMatchTestResult {
  // 1. Calculate combined final weight (65% explicit, 35% implicit)
  const finalWeight = combineWeights(explicitWeight, implicitWeight, 0.65, 0.35);

  // 2. Candidate pool calculation
  const candidateResults: SingleCandidateResult[] = candidates.map((cand) => {
    const { score: userToCandidate, passesDealBreakers } = calculatePreferenceMatch(
      idealProfile,
      cand,
      finalWeight
    );
    const candidateToUser = calculateReverseMatch(cand.preference, selfProfile);
    const mutualScore = passesDealBreakers ? harmonicMean(userToCandidate, candidateToUser) : 0;

    return {
      candidate: cand,
      userToCandidate,
      candidateToUser,
      mutualScore,
      passesDealBreakers,
    };
  });

  // 3. Filter mutual match candidates
  const mutualCandidates = candidateResults
    .filter((r) => r.passesDealBreakers && r.userToCandidate >= 65 && r.candidateToUser >= 65)
    .sort((a, b) => b.mutualScore - a.mutualScore);

  const mutualZoneCandidates = candidateResults
    .filter((r) => r.passesDealBreakers && r.userToCandidate >= 70 && r.candidateToUser >= 70 && r.mutualScore >= 72)
    .sort((a, b) => b.mutualScore - a.mutualScore);

  // 4. Rarity calculation (scaled to 1,000 candidates based on Group A dimensions weight A)
  // Group A: 성격, 대화, 나이, 생활방식, 가족관, 취미, 결혼가치관
  const sumA_pct =
    (finalWeight.personality || 0) +
    (finalWeight.communication || 0) +
    (finalWeight.age || 0) +
    (finalWeight.lifestyle || 0) +
    (finalWeight.family || 0) +
    (finalWeight.hobbies || 0) +
    (finalWeight.marriageValues || 0);

  const ratioA = sumA_pct / 100;
  const scaledRarityCount = Math.round(ratioA * 1000);
  const rarityPercent = Math.round((scaledRarityCount / 1000) * 1000) / 10;

  const rarityComment =
    scaledRarityCount < 300
      ? '당신의 이상형은 눈이 높기보다 선호 기준이 매우 뚜렷하여 비교적 희소한 편입니다.'
      : scaledRarityCount < 600
      ? '당신의 이상형은 확실한 취향과 내면 중심의 균형 잡힌 선호 집단입니다.'
      : '당신의 이상형은 내면적 가치관과 성품을 중시하며 비교적 넓은 매칭 후보군을 확보하고 있습니다.';

  // 5. Explicit vs Actual (Implicit) Gap & Consistency
  let totalGap = 0;
  const explicitVsActual = ALL_DIMENSIONS.map((dim) => {
    const exp = explicitWeight[dim] || 0;
    const imp = implicitWeight[dim] || 0;
    const fin = finalWeight[dim] || 0;
    totalGap += Math.abs(exp - imp);
    return {
      dimension: dim,
      label: DIMENSION_KOREAN_NAMES[dim],
      explicitPct: Math.round(exp),
      implicitPct: Math.round(imp),
      finalPct: Math.round(fin),
    };
  });

  const avgGap = totalGap / ALL_DIMENSIONS.length;
  const preferenceConsistency = Math.max(35, Math.min(98, Math.round(100 - avgGap * 3)));

  let consistencyComment = '';
  if (preferenceConsistency >= 80) {
    consistencyComment = '스스로 생각하는 이상형과 실제 선택하는 행동 데이터가 매우 일치합니다!';
  } else if (preferenceConsistency >= 60) {
    consistencyComment = '스스로 생각하는 조건과 실제 프로필을 보았을 때 끌리는 조건에 유의미한 차이가 발견되었습니다.';
  } else {
    consistencyComment = '머리로 생각하는 이상형 조건과 마음이 반응하는 실제 선택 사이의 반전이 매우 큽니다!';
  }

  // 6. Flexibility simulation
  const flexibility = calculateFlexibility(idealProfile, candidates, finalWeight);

  // 7. Archetype & CTA
  const archetype = determineArchetype(finalWeight, selfProfile);

  const avgMutual =
    mutualCandidates.length > 0
      ? Math.round(mutualCandidates.reduce((acc, c) => acc + c.mutualScore, 0) / mutualCandidates.length)
      : 70;

  const cta = selectCTA({
    rarityPercent,
    explicitImplicitGap: avgGap * 3,
    mutualScore: avgMutual,
  });

  return {
    selfProfile,
    idealProfile,
    explicitWeight,
    implicitWeight,
    finalWeight,
    archetype,
    explicitVsActual,
    preferenceConsistency,
    consistencyComment,
    candidateResults,
    mutualCandidates,
    mutualZoneCandidates,
    rarityCount: scaledRarityCount,
    rarityPercent,
    rarityComment,
    flexibility,
    attractedTypes: ['밝고 세련된 활동형', '자기 일이 확실한 전문직 안정형', '대화가 스무스하게 통하는 감성형'],
    attractedToUserTypes: ['책임감을 최우선으로 보는 사람', '가족과 일상의 균형을 중시하는 파트너', '다정하고 차분한 연애를 원하는 상대'],
    cta,
  };
}
