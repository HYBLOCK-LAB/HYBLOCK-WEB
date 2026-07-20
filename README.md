# HYBLOCK

HYBLOCK 학회 공식 웹사이트와 운영 도구를 함께 관리하는 저장소다. 공개 홈페이지뿐 아니라 회원 가입·인증, 세션/출석 운영, EAS 증명 발급, SBT 수료증 발급까지 포함한다.

> 문서 기준일: 2026-07-17. 문서의 “현재”는 저장소에 커밋된 소스와 마이그레이션을 기준으로 한다.

## 현재 구현 범위

- 공개 사이트: 소개, 회칙, 공지 목록/검색/상세, 활동 사진, 개인정보처리방침, 이용약관
- 회원: Google OAuth, Google 계정-지갑 연동, 지갑 서명 로그인, 지갑 기반 회원 가입, 마이페이지
- 출석: 세션 생성/활성화, 6자리 출석 코드, 45초 개인 QR, 관리자 카메라·이미지 QR 스캔, 출석 상태 수동 보정
- 관리자: 회원 산출물 상태, 공지, 활동/세션, 출석, EAS 증명 관리
- 블록체인: `HyblockIssuer`를 통한 EAS 증명 발급, 서버 소유자 지갑을 통한 `HyblockSBT` 민팅

## 저장소 구성

| 경로 | 역할 |
| --- | --- |
| `web` | Next.js App Router 기반 공개·회원·관리자 웹과 Route Handlers |
| `database` | Supabase Postgres 마이그레이션과 스키마 문서 |
| `eas` | Foundry 기반 Solidity 컨트랙트, 배포 스크립트, 테스트 |
| `docs` | 전체 아키텍처, 기술 스택, 플로우, 운영 문서 |

## 빠른 시작

### Web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Supabase 마이그레이션과 Google OAuth redirect URL, Reown project ID, Upstash Redis, 체인 관련 환경변수를 먼저 준비해야 전체 기능을 사용할 수 있다. 상세 순서는 [운영 가이드](docs/OPERATIONS.md)를 참고한다.

### Contracts

```bash
git submodule update --init --recursive
cd eas
cp .env.example .env
forge build
forge test
```

## 문서

- [아키텍처](docs/ARCHITECTURE.md)
- [현재 기술 스택](docs/TECH_STACK.md)
- [사용자·운영 플로우](docs/FLOWS.md)
- [운영 및 배포 가이드](docs/OPERATIONS.md)
- [디자인 시스템](docs/DESIGN_SYSTEM.md)
- [Web 패키지](web/README.md)
- [지갑 세션과 QR 출석](web/docs/wallet-session-and-qr-attendance.md)
- [DB 스키마](database/docs/Schema.md)
- [DB 구현 가이드](database/docs/IMPLEMENTATION_GUIDE.md)
- [스마트 컨트랙트](eas/docs/contracts.md)

## 현재 구현에서 구분해야 할 것

- `assignment` 테이블 마이그레이션은 남아 있지만 웹 런타임은 산출물 판정에 `member.has_assignment`를 사용한다.
- `ActivityTracker`와 `HyblockResolver`는 컨트랙트/배포 코드에 포함되지만 웹에서 활동 데이터를 동기화하거나 직접 호출하는 파이프라인은 없다.
- 공개 활동 사진과 홈의 요약 공지는 정적 데이터다. `/notices`와 관리자 공지 화면만 Supabase `notice` 테이블을 사용한다.
- 관리자 권한과 SBT 민팅은 Google 세션이 아니라 서버의 지갑 세션 쿠키를 기준으로 한다.
