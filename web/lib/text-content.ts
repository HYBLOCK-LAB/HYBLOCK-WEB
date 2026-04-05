export const textContent = {
  footer: {
    copyright: '© 2026 HYBLOCK Academic Club. All rights reserved.',
  },
  home: {
    aboutBlueprint: 'The Society Blueprint',
  },
  activities: {
    intro: '함께 배우고 성장하는 HYBLOCK은 다양한 활동 기록입니다.',
  },
  notices: {
    description: 'HYBLOCK 학술회의 주요 소식과 공지사항을 확인하세요. 운영, 학술, 이벤트 공지를 한 곳에서 관리합니다.',
  },
  about: {
    heroPlaceholderTitle: 'Photo Slot',
    heroPlaceholderDescription: '`site-content.ts`의 `aboutHeroImage.src`에 사진 경로를 넣으면 이 배경에 표시됩니다.',
  },
  bylaws: {
    intro: 'HYBLOCK은 학술적 탐구와 실천적 개발을 통해 블록체인 생태계의 미래를 선도하는 공동체입니다.',
    missionQuote: '"블록체인 기술의 대중화와 학술적 깊이를 더하여, 투명하고 공정한 디지털 사회의 초석을 다진다."',
    updatedAt: 'Last Updated: January 2024',
    closingNote: '이상의 회칙은 공포한 날로부터 즉시 시행하며, 개정 시 전체 회원의 2/3 이상의 출석과 과반수 찬성을 필요로 합니다.',
  },
  attendance: {
    description: '진행 중인 세션을 확인하고 QR 또는 수동 입력으로 출석을 완료할 수 있습니다.',
    liveSessionLabel: 'Live Session',
    liveSessionFallback: '진행 중인 세션 없음',
    liveSessionDescription: '현재 활성 세션만 출석 처리할 수 있습니다. 운영진이 세션을 열면 아래 입력 폼이 즉시 활성화됩니다.',
    manualCheckInLabel: 'Manual Check-In',
    manualCheckInTitle: '수동 출석',
    sessionNumber: (value: string) => `Session #${value}`,
    activeStatusHint: '지금 출석 가능',
    pendingStatusHint: '오픈 전',
  },
  auth: {
    noAccountPrefix: '계정이 없다면 ',
    hasAccountPrefix: '이미 가입했다면 ',
    loginCta: '로그인',
    signupCta: '회원가입',
    walletLoginMissingProjectId: '`NEXT_PUBLIC_REOWN_PROJECT_ID`를 설정해야 WalletConnect 모달이 동작합니다.',
    walletLinkMissingProjectId: '`NEXT_PUBLIC_REOWN_PROJECT_ID`를 설정해야 WalletConnect 모달이 동작합니다.',
  },
  walletLink: {
    currentAccountLabel: '현재 계정',
    loadingUser: '계정 확인 중',
    emptyLinkedWallet: '없음',
    loginRequired: '먼저 로그인하세요.',
    stepsLabel: '단계',
    connectedWalletLabel: '연결된 지갑',
    unknownNetwork: '알 수 없음',
  },
  walletLogin: {
    connectedWalletLabel: '연결된 지갑',
    unknownNetwork: '알 수 없음',
  },
} as const;
