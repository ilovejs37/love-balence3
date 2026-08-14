import { DimensionKey } from '../types';

export const DIMENSION_LABELS: Record<DimensionKey, { label: string; icon: string; description: string }> = {
  appearance: { label: '외모/비주얼', icon: '✨', description: '첫인상, 세련미, 체형, 호감형 외모' },
  personality: { label: '성격/인성', icon: '😊', description: '다정함, 배려심, 밝고 따뜻한 성품' },
  communication: { label: '대화/소통', icon: '💬', description: '티키타카, 유머감각, 공감 능력, 대화 스타일' },
  career: { label: '직업/전문성', icon: '💼', description: '직업의 안정성, 사회적 위치, 성장 가능성' },
  economics: { label: '경제력/자산', icon: '💰', description: '소득 수준, 경제관념, 자산 형성 및 안정감' },
  age: { label: '나이/연령대', icon: '🎂', description: '나이 차이, 연상/연하/동갑 선호도' },
  lifestyle: { label: '생활방식/음주흡연', icon: '🍷', description: '주말 일상, 운동, 여행, 음주 및 식습관' },
  family: { label: '가족관/자녀', icon: '🏡', description: '가족과의 관계, 자녀관, 효도 및 가치관' },
  hobbies: { label: '취미/관심사', icon: '🎨', description: '함께 즐기는 문화생활, 활동, 개인 취향' },
  marriageValues: { label: '결혼가치관/맞벌이', icon: '💍', description: '맞벌이 여부, 경제권, 미래 삶의 지향점' },
};

export interface SelfQuestionCard {
  id: string;
  category: '기본' | '성격' | '라이프' | '결혼관' | '소통';
  title: string;
  subtitle?: string;
  options: {
    label: string;
    description?: string;
    patch: any;
  }[];
}

export const SELF_QUESTIONS: SelfQuestionCard[] = [
  {
    id: 'gender_age',
    category: '기본',
    title: '성별과 나이를 선택해 주세요',
    subtitle: '정확한 매칭 시뮬레이션을 위해 필요합니다',
    options: [], // Custom interactive component for Gender, Age, Height, Region, Occupation
  },
  {
    id: 'weekend_style',
    category: '라이프',
    title: '주말에 가장 선호하는 휴식 방식은?',
    subtitle: '당신의 일상 라이프스타일 패턴을 파악합니다',
    options: [
      {
        label: '🏠 집에서 편안하게 유튜브/영화 보며 쉬기',
        description: '아늑하고 독립적인 시간 선호',
        patch: {
          personality: { extroversion: 35, agreeableness: 75 },
          lifestyle: { travel: '집돌이/집순이' },
        },
      },
      {
        label: '☕️ 감성 맛집이나 카페 탐방하기',
        description: '트렌디하고 소소한 미식 탐방',
        patch: {
          personality: { extroversion: 65, openness: 80 },
          lifestyle: { travel: '가끔여행' },
        },
      },
      {
        label: '🏃‍♂️ 러닝, 테니스, 헬스 등 활발하게 운동하기',
        description: '자기관리와 에너지를 채우는 시간',
        patch: {
          personality: { extroversion: 80, conscientiousness: 85 },
          lifestyle: { exercise: '주 3회 이상' },
        },
      },
      {
        label: '✈️ 근교나 해외로 드라이브/여행 떠나기',
        description: '새로운 장소와 경험을 즐김',
        patch: {
          personality: { extroversion: 85, openness: 90 },
          lifestyle: { travel: '여행마니아' },
        },
      },
      {
        label: '🍻 친구들과 모여 수다 떨고 맛있는 거 먹기',
        description: '친목과 사교를 통한 스트레스 해소',
        patch: {
          personality: { extroversion: 90, agreeableness: 80 },
          lifestyle: { drinking: '가끔' },
        },
      },
    ],
  },
  {
    id: 'communication_style',
    category: '소통',
    title: '연인과 연애할 때 가장 중요한 대화 스타일은?',
    options: [
      {
        label: '🤝 솔직하고 다정한 공감형 대화',
        description: '서로의 감정을 살뜰히 챙기고 다독여주는 관계',
        patch: {
          relationship: { communication: 90, affectionExpression: 85 },
          personality: { agreeableness: 90 },
        },
      },
      {
        label: '⚡️ 센스 있고 티키타카가 잘 통하는 유머형 대화',
        description: '같이 있으면 끊임없이 웃고 즐거운 대화',
        patch: {
          relationship: { communication: 95, affectionExpression: 70 },
          personality: { extroversion: 75, openness: 85 },
        },
      },
      {
        label: '🛡 차분하고 논리적으로 문제를 해결하는 안정형 대화',
        description: '감정 소비 없이 서로 존중하며 건설적 의견 나누기',
        patch: {
          relationship: { communication: 80, stability: 90 },
          personality: { emotionalStability: 90, conscientiousness: 85 },
        },
      },
    ],
  },
  {
    id: 'drinking_smoking',
    category: '라이프',
    title: '음주 및 흡연 습관은 어떻게 되시나요?',
    options: [
      {
        label: '🚭 비흡연 / 🍷 음주는 기분 좋은 가끔 정도',
        patch: { lifestyle: { smoking: '비흡연', drinking: '가끔' } },
      },
      {
        label: '🚭 완전 비흡연 / 🥤 술도 거의 안 마심',
        patch: { lifestyle: { smoking: '비흡연', drinking: '전혀안함' } },
      },
      {
        label: '🚬 흡연 / 🍺 음주는 가끔 또는 자주',
        patch: { lifestyle: { smoking: '흡연', drinking: '자주' } },
      },
    ],
  },
  {
    id: 'marriage_future',
    category: '결혼관',
    title: '결혼 후 맞벌이 및 자녀 계획에 대한 생각은?',
    options: [
      {
        label: '👫 서로 커위어를 존중하는 맞벌이 선호 + 👶 자녀 꼭 원함',
        patch: { marriage: { dualIncome: '필수선호', children: '원함', marriageIntent: 95 } },
      },
      {
        label: '🏡 경제적 상황에 따른 유연한 선택 + 👶 자녀 자연스럽게',
        patch: { marriage: { dualIncome: '상관없음', children: '원함', marriageIntent: 90 } },
      },
      {
        label: '🥂 딩크(자녀 없이 둘만의 오붓한 행복) or 융통성 있게',
        patch: { marriage: { dualIncome: '필수선호', children: '원치않음', marriageIntent: 85 } },
      },
    ],
  },
  {
    id: 'family_value',
    category: '결혼관',
    title: '양가 부모님 및 가족과의 관계에 대한 가치관은?',
    options: [
      {
        label: '❤️ 가족 관계와 효도를 매우 중요하게 생각함',
        patch: { marriage: { familyImportance: 90 } },
      },
      {
        label: '⚖️ 부모님께 예의를 다하되, 우리 두 사람의 독립된 가정이 최우선',
        patch: { marriage: { familyImportance: 75 }, relationship: { independence: 80 } },
      },
    ],
  },
];
