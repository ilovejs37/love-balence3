import { Candidate, DimensionKey, SelfProfile } from '../types';

const MALE_NAMES = [
  '민준', '서준', '도윤', '예준', '시우', '주원', '하준', '지호', '지후', '준서',
  '준우', '현우', '도현', '건우', '우진', '지훈', '유준', '선우', '서진', '민재',
  '현준', '연우', '유찬', '정우', '시현', '승우', '승현', '민성', '지환', '승민'
];

const FEMALE_NAMES = [
  '서연', '서윤', '지우', '서현', '하은', '하윤', '민서', '지유', '윤서', '채원',
  '지민', '수아', '지아', '다은', '은서', '예은', '수현', '유나', '예린', '시은',
  '지원', '소율', '아린', '유진', '혜원', '채은', '지은', '나은', '가은', '민지'
];

const REGIONS = ['서울', '경기/인천', '부산/경남', '대구/경북', '대전/충청', '광주/전라', '강원', '제주'];

const OCCUPATION_GROUPS = [
  { group: '전문직', details: ['의사', '변호사', '회계사', '변리사', '약사'] },
  { group: '대기업', details: ['IT 기획자', '전략기획', '마케터', '연구원', '금융/재무'] },
  { group: '공기업/공무원', details: ['공기업 과장', '7급 공무원', '교사', '공공기관 연구원'] },
  { group: 'IT/개발', details: ['수석 개발자', 'AI 엔지니어', '프로덕트 매니저', '데이터 사이언티스트'] },
  { group: '사업가/자영업', details: ['스타트업 대표', 'F&B 사업가', '전문 프랜차이즈 운영'] },
  { group: '금융/증권', details: ['펀드매니저', '자산관리사', '투자심사역'] },
  { group: '의료/보건', details: ['치과의사', '한의사', '간호사', '물리치료사'] },
  { group: '교육/연구', details: ['대학교수', '연구원', '교육컨설턴트'] },
];

const QUOTES = [
  '서로의 일상을 따뜻하게 채워줄 인연을 기다립니다.',
  '같이 있으면 웃음이 끊이지 않는 다정한 대화가 좋아요.',
  '주말에는 함께 운동하거나 예쁜 카페 드라이브 가는 것을 좋아해요.',
  '서로의 성장을 응원하고 든든한 울타리가 되어주고 싶습니다.',
  '차분하지만 책임감 있고 깊이 있는 소통을 중요하게 여깁니다.',
  '밝은 에너지로 일상을 다채롭게 만들어가는 타입입니다.',
  '가족을 소중히 생각하며 함께 미래를 설계하고 싶어요.',
  '취향과 가치관을 존중하며 오래 함께할 조화로운 연인을 원합니다.',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateCandidatePool(count: number = 150, targetGender?: '남성' | '여성'): Candidate[] {
  const candidates: Candidate[] = [];

  for (let i = 0; i < count; i++) {
    const gender: '남성' | '여성' = targetGender ? targetGender : (i % 2 === 0 ? '남성' : '여성');
    const name = (gender === '남성' ? getRandomItem(MALE_NAMES) : getRandomItem(FEMALE_NAMES)) + ' 님';
    const age = getRandomInt(27, 43);
    const region = getRandomItem(REGIONS);
    const height = gender === '남성' ? getRandomInt(172, 186) : getRandomInt(158, 172);
    
    const occObj = getRandomItem(OCCUPATION_GROUPS);
    const occupationGroup = occObj.group;
    const occupationDetail = getRandomItem(occObj.details);

    const isNonSmoker = Math.random() > 0.15; // 85% non smoker
    const drinking: '전혀안함' | '가끔' | '자주' = Math.random() > 0.2 ? '가끔' : (Math.random() > 0.5 ? '전혀안함' : '자주');

    // Create unique dimension scores (0-100)
    const scores: Record<DimensionKey, number> = {
      appearance: getRandomInt(65, 98),
      personality: getRandomInt(70, 98),
      communication: getRandomInt(70, 99),
      career: getRandomInt(60, 98),
      economics: getRandomInt(60, 97),
      age: getRandomInt(70, 99),
      lifestyle: getRandomInt(65, 95),
      family: getRandomInt(70, 98),
      hobbies: getRandomInt(60, 95),
      marriageValues: getRandomInt(70, 98),
    };

    const selfProfile: SelfProfile = {
      age,
      gender,
      region,
      height,
      occupationGroup,
      personality: {
        extroversion: getRandomInt(40, 90),
        emotionalStability: getRandomInt(60, 95),
        openness: getRandomInt(50, 90),
        conscientiousness: getRandomInt(65, 95),
        agreeableness: getRandomInt(60, 95),
      },
      lifestyle: {
        drinking,
        smoking: isNonSmoker ? '비흡연' : '흡연',
        exercise: getRandomItem(['안함', '주 1~2회', '주 3회 이상']),
        travel: getRandomItem(['집돌이/집순이', '가끔여행', '여행마니아']),
      },
      marriage: {
        marriageIntent: getRandomInt(75, 98),
        children: getRandomItem(['원함', '상관없음', '원치않음']),
        dualIncome: getRandomItem(['필수선호', '상관없음']),
        familyImportance: getRandomInt(70, 95),
      },
      relationship: {
        communication: getRandomInt(70, 98),
        affectionExpression: getRandomInt(60, 95),
        independence: getRandomInt(50, 85),
        stability: getRandomInt(70, 98),
      },
    };

    const candidatePreference = {
      ageMin: gender === '남성' ? Math.max(24, age - 6) : Math.max(25, age - 2),
      ageMax: gender === '남성' ? age + 2 : age + 7,
      heightMin: gender === '남성' ? 155 : 170,
      smokingPreferred: '비흡연',
      preferredOccupations: ['전문직', '대기업', '공기업/공무원', 'IT/개발', '사업가/자영업', '금융/증권', '의료/보건', '교육/연구'],
      importanceWeights: {
        communication: getRandomInt(15, 30),
        personality: getRandomInt(15, 30),
        marriageValues: getRandomInt(10, 25),
        lifestyle: getRandomInt(10, 20),
        appearance: getRandomInt(10, 25),
        career: getRandomInt(5, 20),
      },
    };

    const badgeTags = [
      isNonSmoker ? '🚭 비흡연' : '🚬 흡연',
      `${region} 거주`,
      `${occupationGroup} (${occupationDetail})`,
      `키 ${height}cm`,
    ];
    if (scores.communication > 88) badgeTags.push('💬 대화왕');
    if (scores.appearance > 88) badgeTags.push('✨ 호감형 외모');
    if (scores.personality > 90) badgeTags.push('🥰 다정한 성품');
    if (scores.economics > 88) badgeTags.push('💎 탄탄한 경제력');

    candidates.push({
      id: `cand_${i + 1}`,
      name,
      age,
      gender,
      region,
      height,
      occupationGroup,
      occupationDetail,
      summaryQuote: getRandomItem(QUOTES),
      badgeTags,
      scores,
      selfProfile,
      preference: candidatePreference,
    });
  }

  return candidates;
}
