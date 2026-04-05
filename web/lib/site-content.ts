export type NavItem = {
  href: string;
  label: string;
};

export type WalletLinkPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  cardTitle: string;
  cardDescription: string;
  steps: string[];
  highlights: Array<{
    title: string;
    description: string;
  }>;
};

export const brandMenuItems: NavItem[] = [
  { href: '/about', label: '소개' },
  { href: '/bylaws', label: '회칙' },
];

export const navItems: NavItem[] = [
  { href: '/notices', label: '공지사항' },
  { href: '/activities', label: '활동' },
  { href: '/attendance', label: '출석 체크' },
];

export const adminNavItems: NavItem[] = [
  { href: '/admin/members', label: '멤버 관리' },
  { href: '/admin/activities', label: '활동 관리' },
  { href: '/admin/attendance', label: '출석 관리' },
];

export const noticeCategories = ['전체', '학술', '이벤트', '운영'] as const;

export const notices = [
  { id: 'pin', category: '중요', title: '2024 하반기 신입 회원 모집 일정 안내', author: 'HYBLOCK 운영진', date: '2024.08.15', pinned: true },
  { id: '124', category: '학술', title: '블록체인 인프라 보안 강화 세미나 자료 배포', author: '기술팀장', date: '2024.08.12' },
  { id: '123', category: '이벤트', title: '제4회 HYBLOCK 해커톤 참가자 모집 (9/1~9/15)', author: '이벤트기획팀', date: '2024.08.10' },
  { id: '122', category: '운영', title: '8월 정기 커뮤니티 데이 장소 변경 안내', author: '운영지원팀', date: '2024.08.05' },
  { id: '121', category: '학술', title: '스마트 컨트랙트 최적화 기법에 관한 연구 공유', author: '학술팀', date: '2024.07.28' },
  { id: '120', category: '운영', title: '개인정보 처리방침 개정 관련 사전 안내', author: '관리팀', date: '2024.07.20' },
];

export const activityFilters = ['전체', '기본 세션', '심화 세션', '해커톤', '기타 외부 활동'] as const;

export const activities = [
  {
    slug: 'layer2-scaling',
    category: '심화 세션',
    date: '2024.03.15',
    title: 'Ethereum Layer 2 Scaling Solutions Research',
    description: '롤업 솔루션의 아키텍처 분석과 실제 구현 사례를 정리한 연구 세션입니다.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'hackathon',
    category: '해커톤',
    date: '2024.02.20',
    title: 'KB-Blockchain Finance Hackathon Participation',
    description: '분산 신원 증명 기반 자산 관리 프로젝트를 설계하고 데모까지 완성했습니다.',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'cryptography',
    category: '기본 세션',
    date: '2024.01.10',
    title: 'Cryptography Fundamentals for Web3',
    description: '해시 함수와 공개키 암호학 등 블록체인의 핵심 개념을 다룬 기초 세션입니다.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'buidl-asia',
    category: '기타 외부 활동',
    date: '2023.12.05',
    title: 'Buidl Asia 2023 Networking Night',
    description: '국내외 프로젝트 팀과 교류하며 학회의 연구 방향과 협업 기회를 확장했습니다.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'security-audit',
    category: '심화 세션',
    date: '2023.11.18',
    title: 'Solidity Security & Audit Workshop',
    description: '정적 분석 도구와 실제 취약점 사례를 중심으로 스마트 컨트랙트 보안을 실습했습니다.',
    image: 'https://images.unsplash.com/photo-1518186233392-c232efbf2373?auto=format&fit=crop&w=1200&q=80',
  },
  {
    slug: 'defi-architecture',
    category: '심화 세션',
    date: '2023.10.22',
    title: 'DeFi Protocol Architecture Deep Dive',
    description: '주요 디파이 프로토콜의 경제 모델과 시스템 설계를 비교 분석했습니다.',
    image: 'https://images.unsplash.com/photo-1640161704729-cbe966a08476?auto=format&fit=crop&w=1200&q=80',
  },
];

export const homeNotices = [
  { date: '2024.11.02', title: 'Autumn Research Seminar: Layer 2 Finality Analysis', tag: 'Academic' },
  { date: '2024.10.28', title: 'Society Recruitment Drive: Winter 2024 Cohort', tag: 'General' },
  { date: '2024.10.15', title: 'Participation in Global Block Summit - Seoul', tag: 'External' },
];

export const upcomingActivities = [
  { title: 'HYBLOCK GENESIS HACK 24', subtitle: 'December 15-17', type: 'feature' as const },
  { title: 'Weekly Study: Rust & Sol', subtitle: 'Mastering high-performance blockchain languages.', type: 'wide' as const },
  { title: 'Networking Night', subtitle: 'Builders and researchers meetup.', type: 'compact' as const },
  { title: 'Member Showcase', subtitle: 'Showcasing Q4 Projects', type: 'compactOutline' as const },
];

export const aboutVision =
  '하이블록은 Web3 시대를 배경으로 블록체인이 주도할 새로운 환경을 인식하고, 그 변화의 흐름을 이끌 통찰을 공유하는 모임입니다.';

export const aboutHeroImage = {
  src: '',
  alt: 'HYBLOCK 활동 사진',
};

export const walletLinkPageContent: WalletLinkPageContent = {
  eyebrow: 'Wallet',
  title: '지갑 연동',
  description: '계정에 지갑을 연결합니다.',
  cardTitle: '지갑 연결',
  cardDescription: '원하는 지갑을 연결하고 계정에 저장하세요.',
  steps: [
    '로그인',
    '지갑 연결',
    '서명 확인',
  ],
  highlights: [
    {
      title: '선택 사항',
      description: '회원가입 중 건너뛰고 나중에 연결할 수 있습니다.',
    },
    {
      title: '재연동 가능',
      description: '로그인 후 다시 연결하거나 변경할 수 있습니다.',
    },
    {
      title: '커스텀 가능',
      description: '문구와 레이아웃은 분리된 컴포넌트로 관리됩니다.',
    },
  ],
};

export const aboutValues = [
  {
    number: '01',
    title: 'Sharing',
    description: '개인의 학습에 그치지 않고, 지식·경험·통찰을 구성원 간에 공유하며 함께 성장하는 문화를 지향합니다.',
  },
  {
    number: '02',
    title: 'Insight',
    description: 'Web3와 블록체인 기술의 변화 흐름을 구조적으로 이해하고, 그 의미를 해석하는 관점을 중시합니다.',
  },
  {
    number: '03',
    title: 'Engagements',
    description: '프로젝트와 리서치를 통해 Web3 생태계에 능동적으로 참여하며, 학습을 통해 실제 경험과 의미 있는 기여로 연결합니다.',
  },
];

export const aboutHistory = [
  { year: '2024', description: 'HYBLOCK 5기 활동 개시 및 대외 협력 파트너십 강화' },
  { year: '2023', description: 'KBW Side Event 주최 및 다수의 해커톤 수상' },
  { year: '2022', description: '한양대학교 중앙학회 승격 및 학술 세미나 정례화' },
];

export const bylaws = [
  {
    title: '제1장 총칙',
    items: [
      '제1조 (명칭) 본 단체는 한양대학교 블록체인 학회 HYBLOCK이라 칭한다.',
      '제2조 (목적) 본 회는 블록체인 기술에 대한 학술적 탐구와 개발 실습을 통해 회원들의 역량을 강화한다.',
      '제3조 (활동) 정기 세미나, 기술 워크숍, 프로젝트 개발, 외부 네트워킹 등의 활동을 수행한다.',
    ],
  },
  {
    title: '제2장 회원',
    items: [
      '제4조 (자격) 본 회의 회원은 블록체인에 관심이 있는 한양대학교 재학생 및 휴학생으로 구성된다.',
      '제5조 (권리와 의무) 회원은 모든 활동에 참여할 권리와 회칙 준수의 의무를 가진다.',
      '제6조 (탈퇴 및 제명) 정당한 사유 없는 장기 불참 또는 명예 훼손 시 운영위원회 의결로 제명할 수 있다.',
    ],
  },
  {
    title: '제3장 조직',
    items: [
      '제7조 (운영위원회) 학회장, 부학회장, 총무 및 각 팀장을 포함한 운영위원회를 둔다.',
      '제8조 (선출) 운영위원은 학기 말 총회를 통해 민주적 절차에 따라 선출한다.',
    ],
  },
];
