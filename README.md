# 비유니드 견적 시스템

## 프로젝트 개요
HP/Samsung/LG/Lenovo 등 IT 제품의 구매 및 렌탈 견적서를 작성·저장·공유하는 웹 앱.  
Supabase DB 연동, 로그인 기반 접근, 인쇄/PDF 출력 지원.

---

## 완료된 기능 (현재 버전)

### A. 구매 견적 (purchase.js + index.html)
- **A1** 스펙 드롭다운: 각 스펙 항목별 `<select>` 드롭다운 + 금액 `<input>` 나란히 배치
  - `CPU [i7-14세대 ▾] [200,000]` 형태, 선택 시 기본가격 자동입력
  - 금액 칸은 수기 수정 가능 (시장가 변동 대응)
  - 선택 안 함 → 해당 항목 0원, 스펙 요약에 미포함
- **A2** 기본가 수정 가능: `aq-base-price` 입력란 (기본가 + 스펙 합계 = 단가 자동계산)
- **A3** PC 카테고리만 스펙 표시: 노트북/데스크탑/워크스테이션/모바일워크스테이션
- **A4** 단가 자동계산: 기본가 + 각 스펙 금액 합 → 실시간 표시
- **A5** 스펙 미선택 시 기존 spec_summary 텍스트 유지
- **A6** 스펙 선택 시 자동 요약: `i7-14세대 / 32GB / 512GB NVMe / 내장 / Win11 Pro`
- **A7** info_url 초록 점 표시

### 카탈로그 정렬
- **최신순** (기본) / **가나다** / **가격↑** / **가격↓** / **분류** 버튼 정렬
- `setSortP(val)` 함수, `currentSortP` 전역변수

### 견적 품목 정렬
- 각 품목 좌측 ▲▼ 버튼으로 순서 변경 (`moveQuoteItem(idx, dir)`)
- 번호 자동 갱신

### B. 렌탈 견적 (rental.js + index.html)
- **B1** 렌탈 스펙 드롭다운: 구매와 동일한 드롭다운+금액칸 구조 (PC 카테고리만)
  - `rOnSpecDropdownChange()` → 기본가격 자동입력 + `rSelectedSpecPrices` 추적
  - `rOnSpecPriceInput()` → 수기 수정 반영
- **B2** 기존 구조 유지: 일/월 토글, 기간, 수량 등
- **B3** 스펙 드롭다운은 기간/수량 위에 배치
- **B4** 스펙 요약 견적서 출력

### C. 관리자 – 스펙 관리 탭 (purchase.js + index.html)
- 서브탭: 구매 제품 | 렌탈 제품 | **스펙 관리**
- 스펙 카테고리 CRUD (`spec_categories` 테이블)
- 스펙 옵션 CRUD (`spec_options` 테이블)

### D. 사용자 프로필 (config.js + index.html)
- 헤더 이메일 클릭 → 드롭다운 (내 정보 수정 / 비밀번호 변경 / 로그아웃)
- `user_profiles` 테이블 저장 (name, phone, dept, email)
- 최초 로그인 시 자동 생성
- 로그인 시 공급사 정보 자동 세팅 (f-sales-name, f-sales-phone 등)

### E. 견적서 출력 (purchase.js + rental.js)
- 스펙 요약: `i7-14세대 / 32GB / 512GB NVMe / 내장 / Win11 Pro` (라벨 없이 값만)
- 스펙 개별 금액 미표시 (단가에만 반영)

### F. 기존 변경사항
- F1 탑바 A안 (화이트, 언더라인 탭, 이모지 제거)
- F2 탭 이름: 관리자 → 제품 관리
- F3 로고 +10%
- F4 제품명 초록 점 (info_url)
- F5 가격 기호: ₩ → 원
- F6 feature 노란박스 → 연회색 텍스트
- F7 상세카드 줄간격 개선
- F8 LOGO_SRC 복원
- F9 모바일 로그아웃 버튼 수정
- F10 DB 쿼리 8초 타임아웃

---

## 모달 UI 구조 (구매 스펙 선택)

```
기본가  [1,850,000] 원  (수정 가능)
─────────────────────────────────
스펙 항목  |  선택             |  금액 (원)
CPU        [i7-14세대  ▾]     [200,000]
Memory     [32GB       ▾]     [100,000]
SSD        [512GB      ▾]     [ 50,000]
GPU        [내장       ▾]     [      0]
OS         [Win11 Pro  ▾]     [150,000]
─────────────────────────────────
단가    2,350,000 원  (기본가 + 스펙 합계 자동계산)
수량    [−] [2] [+]  개
─────────────────────────────────
합계 금액   4,700,000 원
```

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 전체 UI (로그인, 구매/렌탈/관리자 패널, 모달) |
| `purchase.js` | 구매견적 로직 (제품, 스펙, 견적, 관리자) |
| `rental.js` | 렌탈견적 로직 |
| `config.js` | Supabase 설정, 공통 함수, 프로필 |
| `style.css` | 전체 스타일 (반응형 포함) |
| `print.css` | 인쇄 전용 스타일 |
| `quote-view.html` | 공유 링크 견적서 뷰 |
| `qv-style.css` | quote-view 스타일 |
| `logo.png` | 로고 이미지 |

---

## DB 테이블

| 테이블 | 주요 컬럼 |
|---|---|
| `products` | id, category, brand, name, spec_summary, base_price, feature, info_url, is_active |
| `rental_products` | id, category, brand, name, spec, daily_price, monthly_price, info_url, is_active |
| `spec_categories` | id, name, sort_order, product_categories |
| `spec_options` | id, spec_category_id, name, price_delta, sort_order |
| `quotes` | id, quote_number, share_token, company_name, ... |
| `quote_items` | id, quote_id, product_name, spec_summary, unit_price, qty, sort_order |
| `user_profiles` | id, user_id, email, name, phone, dept |

### 필요 SQL (초기 설정)
```sql
-- user_profiles 컬럼 추가
alter table user_profiles add column if not exists user_id uuid references auth.users(id) unique;
alter table user_profiles add column if not exists dept text;
```

---

## 미구현 / 다음 권장 작업

- [ ] 렌탈 견적 품목 ▲▼ 정렬 버튼 (purchase와 동일하게 추가)
- [ ] 스펙 관리 탭 UI 완성 (카테고리/옵션 CRUD 폼)
- [ ] 프로필 모달 프론트엔드 완성 (내 정보 수정 폼)
- [ ] quote-view.html에서 스펙 요약 표시 검증

---

## 접속 URL
- 개발: 로컬 또는 Vercel Preview
- 프로덕션: https://buneed-estimate.vercel.app
