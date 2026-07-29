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

export type ActivityCategory = 'basic-session' | 'advanced-session' | 'hackathon' | 'external-activity';

export type ActivityFilter = 'all' | ActivityCategory;

export type LocalizedActivityText = {
  ko: string;
  en: string;
};

export type ActivityGalleryPhoto = {
  id: string;
  src: string;
  alt: LocalizedActivityText;
  title: LocalizedActivityText;
  date: string | null;
  category: ActivityCategory;
  height: number;
};

export type ActivityAlbum = {
  slug: string;
  title: LocalizedActivityText;
  description: LocalizedActivityText;
  date: string | null;
  category: ActivityCategory;
  coverPhotoId: string;
  coverPhoto: ActivityGalleryPhoto;
  photos: ActivityGalleryPhoto[];
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

export const activityFilters: ActivityFilter[] = [
  'all',
  'basic-session',
  'advanced-session',
  'hackathon',
  'external-activity',
];

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
  {
    id: 'a17',
    src: '/Album/KakaoTalk_20260407_194115929_01.jpg',
    alt: { ko: 'Monad Blitz 해커톤 2등 수상팀', en: 'Second-place team at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a18',
    src: '/Album/KakaoTalk_20260407_194115929_05.jpg',
    alt: { ko: 'Monad Blitz 해커톤 현장', en: 'Monad Blitz hackathon venue' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a19',
    src: '/Album/KakaoTalk_20260407_194115929_06.jpg',
    alt: { ko: 'Monad Blitz 해커톤 참가 활동', en: 'HYBLOCK members at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a20',
    src: '/Album/KakaoTalk_20260407_194115929_07.jpg',
    alt: { ko: 'Monad Blitz 해커톤 발표 현장', en: 'Presentation at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a21',
    src: '/Album/KakaoTalk_20260407_194115929_08.jpg',
    alt: { ko: 'Monad Blitz 해커톤 팀 활동', en: 'Team activity at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a22',
    src: '/Album/KakaoTalk_20260407_194115929_09.jpg',
    alt: { ko: 'Monad Blitz 해커톤 참가자들', en: 'Participants at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a23',
    src: '/Album/KakaoTalk_20260407_194115929_11.jpg',
    alt: { ko: 'Monad Blitz 해커톤 네트워킹', en: 'Networking at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a24',
    src: '/Album/KakaoTalk_20260407_194115929_12.jpg',
    alt: { ko: 'Monad Blitz 해커톤 시상 현장', en: 'Awards at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a25',
    src: '/Album/KakaoTalk_20260407_194115929_14.jpg',
    alt: { ko: 'Monad Blitz 해커톤 단체 사진', en: 'Group photo at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a26',
    src: '/Album/KakaoTalk_20260407_194115929_15.jpg',
    alt: { ko: 'Monad Blitz 해커톤 수상 기념 사진', en: 'Award celebration at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a27',
    src: '/Album/KakaoTalk_20260407_194115929_18.jpg',
    alt: { ko: 'Monad Blitz 해커톤 프로젝트 작업', en: 'Project work at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a28',
    src: '/Album/KakaoTalk_20260407_194115929_20.jpg',
    alt: { ko: 'Monad Blitz 해커톤 마무리', en: 'Closing moment at the Monad Blitz hackathon' },
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    date: '2026-04-07',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a8',
    src: '/Album/KakaoTalk_20260330_123322826.jpg',
    alt: { ko: '교내 해커톤 작업 현장', en: 'Team workspace during a campus hackathon' },
    title: { ko: '교내 해커톤', en: 'Campus Hackathon' },
    date: '2026-03-30',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a9',
    src: '/Album/KakaoTalk_20260330_123413866.jpg',
    alt: { ko: '교내 해커톤이 열린 한양대학교 건물', en: 'Hanyang University venue for a campus hackathon' },
    title: { ko: '교내 해커톤', en: 'Campus Hackathon' },
    date: '2026-03-30',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a16',
    src: '/Album/KakaoTalk_20260128_154618954_08.jpg',
    alt: { ko: '학회원들의 기본 세션 팀 활동', en: 'Members collaborating during a basic session' },
    title: { ko: '기본 세션 팀 활동', en: 'Basic Session Team Activity' },
    date: '2026-01-28',
    category: 'basic-session',
    height: 800,
  },
  {
    id: 'a10',
    src: '/Album/image.png',
    alt: { ko: 'Base Batch 해커톤 프로젝트 발표', en: 'Project presentation at the Base Batch hackathon' },
    title: { ko: 'Base Batch 해커톤', en: 'Base Batch Hackathon' },
    date: '2025-11-11',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a11',
    src: '/Album/image (1).png',
    alt: { ko: 'Base Batch 해커톤 발표 현장', en: 'Presentation stage at the Base Batch hackathon' },
    title: { ko: 'Base Batch 해커톤', en: 'Base Batch Hackathon' },
    date: '2025-11-11',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a12',
    src: '/Album/image (2).png',
    alt: { ko: 'Base Batch 해커톤 팀 활동', en: 'Team activity at the Base Batch hackathon' },
    title: { ko: 'Base Batch 해커톤', en: 'Base Batch Hackathon' },
    date: '2025-11-11',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a13',
    src: '/Album/image (3).png',
    alt: { ko: 'Base Batch 해커톤 프로젝트 시연', en: 'Project demo at the Base Batch hackathon' },
    title: { ko: 'Base Batch 해커톤', en: 'Base Batch Hackathon' },
    date: '2025-11-11',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a14',
    src: '/Album/image (4).png',
    alt: { ko: 'Base Batch 해커톤 참가자들', en: 'Participants at the Base Batch hackathon' },
    title: { ko: 'Base Batch 해커톤', en: 'Base Batch Hackathon' },
    date: '2025-11-11',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a15',
    src: '/Album/image (5).png',
    alt: { ko: 'Base Batch 해커톤 단체 사진', en: 'Group photo at the Base Batch hackathon' },
    title: { ko: 'Base Batch 해커톤', en: 'Base Batch Hackathon' },
    date: '2025-11-11',
    category: 'hackathon',
    height: 800,
  },
  {
    id: 'a5',
    src: '/Album/엑셀라1.jpeg',
    alt: { ko: 'Axelar와 Squid를 소개하는 심화 세션 발표', en: 'Advanced session presentation about Axelar and Squid' },
    title: { ko: 'Axelar 심화 세션', en: 'Axelar Advanced Session' },
    date: null,
    category: 'advanced-session',
    height: 800,
  },
  {
    id: 'a6',
    src: '/Album/엑셀라2.jpeg',
    alt: { ko: 'Axelar 심화 세션 발표 현장', en: 'Presentation at the Axelar advanced session' },
    title: { ko: 'Axelar 심화 세션', en: 'Axelar Advanced Session' },
    date: null,
    category: 'advanced-session',
    height: 800,
  },
  {
    id: 'a7',
    src: '/Album/엑셀라3.jpeg',
    alt: { ko: 'Axelar 심화 세션 단체 사진', en: 'Group photo from the Axelar advanced session' },
    title: { ko: 'Axelar 심화 세션', en: 'Axelar Advanced Session' },
    date: null,
    category: 'advanced-session',
    height: 800,
  },
  {
    id: 'a1',
    src: '/Album/lbank.jpeg',
    alt: { ko: 'LBank Labs 행사에 참여한 HYBLOCK 학회원들', en: 'HYBLOCK members at an LBank Labs event' },
    title: { ko: 'LBank Labs 외부 행사', en: 'LBank Labs Event' },
    date: null,
    category: 'external-activity',
    height: 800,
  },
  {
    id: 'a2',
    src: '/Album/하블밤2.jpg',
    alt: { ko: '하이블록의 밤 네트워킹 행사 단체 사진', en: 'Group photo at HYBLOCK Night' },
    title: { ko: '하이블록의 밤', en: 'HYBLOCK Night Networking' },
    date: null,
    category: 'external-activity',
    height: 800,
  },
  {
    id: 'a3',
    src: '/Album/하블밤3.jpg',
    alt: { ko: '하이블록의 밤 행사에 참여한 학회원들', en: 'Members at HYBLOCK Night' },
    title: { ko: '하이블록의 밤', en: 'HYBLOCK Night Networking' },
    date: null,
    category: 'external-activity',
    height: 800,
  },
  {
    id: 'a4',
    src: '/Album/하블밥1.jpg',
    alt: { ko: '하이블록의 밤 친목 모임 단체 사진', en: 'Group photo at HYBLOCK Night' },
    title: { ko: '하이블록의 밤', en: 'HYBLOCK Night Networking' },
    date: null,
    category: 'external-activity',
    height: 800,
  },
];

type ActivityAlbumDefinition = Omit<ActivityAlbum, 'coverPhoto' | 'photos'> & {
  photoIds: string[];
};

const activityAlbumDefinitions: ActivityAlbumDefinition[] = [
  {
    slug: 'monad-blitz-hackathon-2026',
    title: { ko: 'Monad Blitz 해커톤', en: 'Monad Blitz Hackathon' },
    description: {
      ko: 'HYBLOCK 학회원들이 Monad Blitz 해커톤에 참가해 프로젝트를 완성하고 2등을 수상한 기록입니다.',
      en: 'HYBLOCK members built a project at the Monad Blitz Hackathon and earned second place.',
    },
    date: '2026-04-07',
    category: 'hackathon',
    coverPhotoId: 'a17',
    photoIds: ['a17', 'a18', 'a19', 'a20', 'a21', 'a22', 'a23', 'a24', 'a25', 'a26', 'a27', 'a28'],
  },
  {
    slug: 'campus-hackathon-2026',
    title: { ko: '교내 해커톤', en: 'Campus Hackathon' },
    description: {
      ko: '한양대학교 교내 해커톤에서 팀을 구성하고 아이디어를 프로젝트로 발전시킨 활동 기록입니다.',
      en: 'A record of HYBLOCK members turning ideas into projects at a Hanyang University campus hackathon.',
    },
    date: '2026-03-30',
    category: 'hackathon',
    coverPhotoId: 'a8',
    photoIds: ['a8', 'a9'],
  },
  {
    slug: 'basic-session-team-activity-2026',
    title: { ko: '기본 세션 팀 활동', en: 'Basic Session Team Activity' },
    description: {
      ko: '기본 세션에서 학회원들이 팀별로 학습 내용을 공유하고 과제를 함께 수행한 기록입니다.',
      en: 'Members shared what they learned and worked together during a HYBLOCK basic session.',
    },
    date: '2026-01-28',
    category: 'basic-session',
    coverPhotoId: 'a16',
    photoIds: ['a16'],
  },
  {
    slug: 'base-batch-hackathon-2025',
    title: { ko: 'Base Batch 해커톤', en: 'Base Batch Hackathon' },
    description: {
      ko: 'Base Batch 해커톤에서 프로젝트를 개발하고 발표와 시연을 진행한 활동 기록입니다.',
      en: 'HYBLOCK members developed, presented, and demonstrated a project at the Base Batch Hackathon.',
    },
    date: '2025-11-11',
    category: 'hackathon',
    coverPhotoId: 'a10',
    photoIds: ['a10', 'a11', 'a12', 'a13', 'a14', 'a15'],
  },
  {
    slug: 'axelar-advanced-session',
    title: { ko: 'Axelar 심화 세션', en: 'Axelar Advanced Session' },
    description: {
      ko: 'Axelar와 Squid의 크로스체인 구조와 활용 사례를 다룬 심화 세션 기록입니다.',
      en: 'An advanced session exploring the cross-chain architecture and use cases of Axelar and Squid.',
    },
    date: null,
    category: 'advanced-session',
    coverPhotoId: 'a5',
    photoIds: ['a5', 'a6', 'a7'],
  },
  {
    slug: 'lbank-labs-event',
    title: { ko: 'LBank Labs 외부 행사', en: 'LBank Labs Event' },
    description: {
      ko: 'LBank Labs 외부 행사에 참여해 업계 관계자들과 교류한 활동 기록입니다.',
      en: 'A record of HYBLOCK members connecting with industry participants at an LBank Labs event.',
    },
    date: null,
    category: 'external-activity',
    coverPhotoId: 'a1',
    photoIds: ['a1'],
  },
  {
    slug: 'hyblock-night-networking',
    title: { ko: '하이블록의 밤', en: 'HYBLOCK Night Networking' },
    description: {
      ko: '학회원들이 한자리에 모여 활동 경험과 관심사를 나누고 친목을 다진 하이블록의 밤 기록입니다.',
      en: 'Members gathered at HYBLOCK Night to share experiences, interests, and build community.',
    },
    date: null,
    category: 'external-activity',
    coverPhotoId: 'a2',
    photoIds: ['a2', 'a3', 'a4'],
  },
];

function getActivityPhoto(photoId: string) {
  const photo = mockActivityGalleryPhotos.find((item) => item.id === photoId);

  if (!photo) {
    throw new Error(`Activity photo not found: ${photoId}`);
  }

  return photo;
}

export const activityAlbums: ActivityAlbum[] = activityAlbumDefinitions.map(({ photoIds, ...album }) => ({
  ...album,
  coverPhoto: getActivityPhoto(album.coverPhotoId),
  photos: photoIds.map(getActivityPhoto),
}));

export function getActivityAlbumBySlug(slug: string) {
  return activityAlbums.find((album) => album.slug === slug);
}

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
  description: '출석 체크와 회원 식별에 사용할 지갑을 계정에 연결합니다.',
  cardTitle: '지갑 연결',
  cardDescription: 'Google 로그인 후 출석을 사용하려면 지갑 연동이 필요합니다.',
  steps: [
    '로그인',
    '지갑 연결',
    '서명 확인',
  ],
  highlights: [
    {
      title: '출석용 연동',
      description: 'Google 로그인만으로 출석하려면 먼저 사용할 지갑을 계정에 연결해야 합니다.',
    },
    {
      title: '회원 식별 기준',
      description: '연동된 지갑 주소를 기준으로 회원 정보와 출석 QR이 연결됩니다.',
    },
    {
      title: '발급 기능',
      description: '증명 발급과 SBT 발급은 연동된 지갑 주소를 기준으로 진행됩니다.',
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
