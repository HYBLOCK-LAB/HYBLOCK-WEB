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

export type ActivityGalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  height: number;
};

export const brandMenuItems: NavItem[] = [
  { href: '/about', label: '소개' },
  { href: '/bylaws', label: '회칙' },
];

export const navItems: NavItem[] = [
  { href: '/notices', label: '공지사항' },
  { href: '/activities', label: '활동' },
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
];

export const mockActivityGalleryPhotos: ActivityGalleryPhoto[] = [
  { id: 'a1', src: '/Album/lbank.jpeg', alt: 'LBank 세션', height: 800 },
  { id: 'a2', src: '/Album/하블밤2.jpg', alt: '하블밤 행사', height: 800 },
  { id: 'a3', src: '/Album/하블밤3.jpg', alt: '하블밤 단체사진', height: 800 },
  { id: 'a4', src: '/Album/하블밥1.jpg', alt: '하블밥 모임', height: 800 },
  { id: 'a5', src: '/Album/엑셀라1.jpeg', alt: '엑셀라 세션 1', height: 800 },
  { id: 'a6', src: '/Album/엑셀라2.jpeg', alt: '엑셀라 세션 2', height: 800 },
  { id: 'a7', src: '/Album/엑셀라3.jpeg', alt: '엑셀라 세션 3', height: 800 },
  { id: 'a8', src: '/Album/KakaoTalk_20260330_123322826.jpg', alt: '활동 사진 1', height: 800 },
  { id: 'a9', src: '/Album/KakaoTalk_20260330_123413866.jpg', alt: '활동 사진 2', height: 800 },
  { id: 'a10', src: '/Album/image.png', alt: '활동 사진 3', height: 800 },
  { id: 'a11', src: '/Album/image (1).png', alt: '활동 사진 4', height: 800 },
  { id: 'a12', src: '/Album/image (2).png', alt: '활동 사진 5', height: 800 },
  { id: 'a13', src: '/Album/image (3).png', alt: '활동 사진 6', height: 800 },
  { id: 'a14', src: '/Album/image (4).png', alt: '활동 사진 7', height: 800 },
  { id: 'a15', src: '/Album/image (5).png', alt: '활동 사진 8', height: 800 },
  { id: 'a16', src: '/Album/KakaoTalk_20260128_154618954_08.jpg', alt: '활동 사진 9', height: 800 },
  { id: 'a17', src: '/Album/KakaoTalk_20260407_194115929_01.jpg', alt: '활동 사진 10', height: 800 },
  { id: 'a18', src: '/Album/KakaoTalk_20260407_194115929_05.jpg', alt: '활동 사진 11', height: 800 },
  { id: 'a19', src: '/Album/KakaoTalk_20260407_194115929_06.jpg', alt: '활동 사진 12', height: 800 },
  { id: 'a20', src: '/Album/KakaoTalk_20260407_194115929_07.jpg', alt: '활동 사진 13', height: 800 },
  { id: 'a21', src: '/Album/KakaoTalk_20260407_194115929_08.jpg', alt: '활동 사진 14', height: 800 },
  { id: 'a22', src: '/Album/KakaoTalk_20260407_194115929_09.jpg', alt: '활동 사진 15', height: 800 },
  { id: 'a23', src: '/Album/KakaoTalk_20260407_194115929_11.jpg', alt: '활동 사진 16', height: 800 },
  { id: 'a24', src: '/Album/KakaoTalk_20260407_194115929_12.jpg', alt: '활동 사진 17', height: 800 },
  { id: 'a25', src: '/Album/KakaoTalk_20260407_194115929_14.jpg', alt: '활동 사진 18', height: 800 },
  { id: 'a26', src: '/Album/KakaoTalk_20260407_194115929_15.jpg', alt: '활동 사진 19', height: 800 },
  { id: 'a27', src: '/Album/KakaoTalk_20260407_194115929_18.jpg', alt: '활동 사진 20', height: 800 },
  { id: 'a28', src: '/Album/KakaoTalk_20260407_194115929_20.jpg', alt: '활동 사진 21', height: 800 },
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
  {
    year: '2022',
    title: '하이블록 설립',
    description: 'HYBLOCK은 2022년 3월,\n블록체인 기술과 산업에 대한\n깊이 있는 이해를 공유하기 위해\n설립되었습니다.',
    side: 'right',
  },
  {
    year: '2023',
    title: '학습 체계화',
    description: '정기 세미나와 스터디\n운영 체계를 통해,\n학회원들이 단계적으로\n성장할 수 있는 학습\n구조를 구축했습니다.',
    side: 'left',
  },
  {
    year: '2024',
    title: '대외 활동 확대',
    description: '외부 연사 초청 연합 세션과 XRPL Ledger\nHackathon을 시작으로 학회의 대외 활동을\n본격적으로 확대했습니다.',
    side: 'right',
  },
  {
    year: '2025',
    title: '대외 신뢰 확보',
    description: '정기 세션을 안정적으로\n운영하고, 외부 해커톤에서\n다수의 수상을 기록하며\n학회 활동을 지속적으로\n이어갔습니다',
    side: 'left',
  },
  {
    year: '2026',
    title: "What's next?",
    description: '기업 협력 프로젝트, 대외 홍보 채널 확대,\n타 학회 간 교류를 시작으로 활발할 활동을\n이어갈 계획입니다.',
    side: 'right',
  },
] as const;
