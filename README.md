# 비유니드 견적 시스템

## 프로젝트 개요
HP, Samsung, LG, Lenovo 등 B2B IT 제품에 대한 **구매/렌탈 견적서**를 생성·저장·공유할 수 있는 웹 애플리케이션입니다.  
Supabase(인증 + DB) 기반의 정적 SPA (HTML + CSS + JS) 구조입니다.

---

## 주요 파일 구조

| 파일 | 설명 |
|------|------|
| `index.html` | 메인 앱 (로그인 + 구매/렌탈/관리자 패널) |
| `config.js` | 공통 설정, Supabase 초기화, 인증, 탭 전환, 프로필 기능 |
| `purchase.js` | 구매 견적 로직 (스펙 드롭다운, 스펙 관리 CRUD) |
| `rental.js` | 렌탈 견적 로직 (스펙 드롭다운 포함) |
| `style.css` | 전체 스타일 (구매/렌탈/관리자/프로필 포함) |
| `print.css` | 인쇄 전용 스타일 |
| `quote-view.html` | 공유 견적서 뷰 페이지 |
| `qv-style.css` | 공유 견적서 스타일 |
| `logo.png` | 비유니드 로고 |

---

## 완료된 기능

### A. 구매 견적 — 스펙 드롭다운 개편
- **A1** 스펙 선택: 카드 클릭 방식 → **드롭다운(select)** 방식으로 전환
- **A2** 기본가 수정 가능: `aq-base-price` 입력란 추가 (기본가 + 스펙 합계 = 단가 자동계산)
- **A3** PC 카테고리만 스펙 표시: `노트북 / 데스크탑 / 워크스테이션 / 모바일워크스테이션`
- **A4** 단가 자동계산: 기본가 + 선택 스펙 금액 합 = 단가
- **A5** 스펙 미선택 시: 기존 `spec_summary` 텍스트 그대로 사용
- **A6** 스펙 선택 시: `i7-14세대 / 32GB / 512GB NVMe / ...` (라벨 없이 값만 조합)
- **A7** `info_url` 제품명 옆 초록 점 유지

### B. 렌탈 견적 — 스펙 드롭다운 추가
- **B1** 렌탈 상세 카드에 스펙 드롭다운 추가 (PC 카테고리만)
- **B2** 기존 구조 유지 (일/월 토글, 기간, 수량 등)
- **B3** 스펙 드롭다운 → 일/월 토글 → 수량/기간/단가 순서
- **B4** 스펙 요약 견적서 출력 지원

### C. 관리자 — 스펙 관리 탭
- **C1** 관리자 서브탭: 구매 제품 | 렌탈 제품 | **스펙 관리**
- **C2** 스펙 항목(카테고리) CRUD: 이름, 정렬순서, 적용 카테고리
- **C3** 스펙 옵션 CRUD: 옵션 이름 + 추가 금액 + 정렬순서
- **C4** DB 연동: `spec_categories` + `spec_options` 테이블

### D. 사용자 프로필
- **D1** 헤더 이메일 클릭 → 드롭다운(내 정보 수정 / 비밀번호 변경 / 로그아웃)
- **D2** 내 정보 수정: 이름, 연락처, 부서 → `user_profiles` 테이블 저장
- **D3** 비밀번호 변경: `db.auth.updateUser({ password })` 사용
- **D4** 최초 로그인 시 프로필 자동 생성
- **D5** 로그인 시 `user_profiles` 조회 → 공급사 정보(이름/연락처/이메일/부서) 자동 세팅

### E. 견적서 출력
- **E1** 구매 견적서: 선택한 스펙만 `/` 구분 표시 (라벨 없이)
- **E2** 렌탈 견적서: 동일 형식
- **E3** 스펙별 개별 금액 미표시 (단가에만 반영)

### F. 기존 변경사항 유지
- F1 탑바 A안 (화이트, 언더라인 탭)
- F2 탭 이름: 관리자 → 제품 관리
- F3 로고 크기
- F4 제품명 초록 점 (info_url)
- F5 가격 기호: 원
- F6 feature 연회색 텍스트
- F7 상세카드 줄간격 개선
- F8 LOGO_SRC 복원
- F9 모바일 로그아웃 버튼 → 프로필 드롭다운으로 대체

---

## 진입점 / URI

| 경로 | 설명 |
|------|------|
| `/index.html` | 메인 앱 (로그인 필요) |
| `/quote-view.html?token={token}` | 구매 견적서 공유 뷰 |
| `/quote-view.html?token={token}&type=rental` | 렌탈 견적서 공유 뷰 |

---

## 데이터 모델 (Supabase)

| 테이블 | 주요 컬럼 |
|--------|-----------|
| `products` | id, name, brand, category, spec_summary, base_price, feature, info_url, is_active |
| `rental_products` | id, name, brand, category, spec_summary, daily_price, monthly_price, is_active |
| `spec_categories` | id, name, sort_order, product_categories(array) |
| `spec_options` | id, spec_category_id, name, price_delta, sort_order |
| `quotes` | id, quote_number, share_token, company_name, items, ... |
| `rental_quotes` | id, quote_number, share_token, company_name, items, ... |
| `quote_items` | id, quote_id, product_name, spec_summary, unit_price, qty, ... |
| `rental_quote_items` | id, quote_id, product_name, product_spec, unit_price, quantity, item_duration, ... |
| `user_profiles` | id, user_id, email, name, phone, dept |

---

## 다음 단계 권장사항

1. `user_profiles` 테이블 Supabase에 생성 (user_id uuid, email, name, phone, dept)
2. `spec_categories.product_categories` 컬럼 타입: `text[]` (배열)
3. logo.webp 파일 추가 (현재 logo.png만 있음)
4. OG 이미지 (og-image.png) 추가
