# HYBLOCK

HYBLOCK는 학회원 활동 데이터를 기반으로 EAS 증명을 발급하고, 조건을 충족한 회원에게 SBT 수료증을 발급하는 프로젝트다.

## 구성

- `web`: Next.js 기반 사용자/관리자 웹
- `eas`: Foundry 기반 스마트 컨트랙트
- `database`: Supabase 스키마 및 DB 문서

## 현재 구현 범위

- QR 기반 출석 체크
- Google OAuth 및 지갑 서명 로그인
- 관리자 페이지에서 EAS 증명 발급
- 학회원 페이지에서 SBT 발급

## 문서

주요 문서:
- [아키텍처](/home/jaeman/Codes/HYBLOCK-WEB/docs/ARCHITECTURE.md)
- [기술 스택](/home/jaeman/Codes/HYBLOCK-WEB/docs/TECH_STACK.md)
- [주요 플로우](/home/jaeman/Codes/HYBLOCK-WEB/docs/FLOWS.md)
- [운영 가이드](/home/jaeman/Codes/HYBLOCK-WEB/docs/OPERATIONS.md)
- [컨트랙트 상세](/home/jaeman/Codes/HYBLOCK-WEB/eas/docs/contracts.md)
- [DB 스키마 상세](/home/jaeman/Codes/HYBLOCK-WEB/database/docs/Schema.md)

## 빠른 시작

```bash
cd web
npm install
npm run dev
```

컨트랙트 테스트:

```bash
cd eas
forge build
forge test
```
