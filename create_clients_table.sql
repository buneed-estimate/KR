-- =====================================================
-- 비유니드 고객사(거래처) 테이블 생성 SQL
-- Supabase Dashboard → SQL Editor에 붙여넣고 실행하세요
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clients (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code          TEXT,                          -- ERP 거래처코드
  client_type          TEXT,                          -- 거래처구분
  company_name         TEXT NOT NULL,                 -- 회사명 (필수)
  biz_address          TEXT,                          -- 사업자 주소
  ceo_name             TEXT,                          -- 대표자명
  ceo_phone            TEXT,                          -- 대표전화
  delivery_address     TEXT,                          -- 배송지 주소
  contact_name         TEXT,                          -- 담당자명
  contact_phone        TEXT,                          -- 담당자 연락처
  contact_email        TEXT,                          -- 담당자 이메일
  biz_type             TEXT,                          -- 거래업종
  purchase_yn          TEXT,                          -- 매입구분
  trade_condition_buy  TEXT,                          -- 거래조건(구매)
  trade_condition_sell TEXT,                          -- 거래조건(판매)
  grade                TEXT,                          -- 업체등급
  sales_person         TEXT,                          -- 담당 영업사원
  memo                 TEXT,                          -- 메모
  is_active            BOOLEAN DEFAULT TRUE,          -- 활성 여부
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- client_code 검색 인덱스 (중복 허용 — upsert 미사용)
CREATE INDEX IF NOT EXISTS clients_client_code_idx
  ON public.clients (client_code)
  WHERE client_code IS NOT NULL AND client_code <> '';

-- 회사명 검색 인덱스
CREATE INDEX IF NOT EXISTS clients_company_name_idx
  ON public.clients (company_name);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS(Row Level Security) 설정: 인증된 사용자만 접근
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "clients_select" ON public.clients;
DROP POLICY IF EXISTS "clients_insert" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;
DROP POLICY IF EXISTS "clients_delete" ON public.clients;

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (auth.role() = 'authenticated');
