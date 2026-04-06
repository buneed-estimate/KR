/* =====================================================
   clients.js — 고객사(거래처) 관리
   - Supabase 테이블: clients
   - CRUD (추가/수정/삭제)
   - ERP CSV 임포트 (EUC-KR)
   - Excel 다운로드
   - 고객사 선택 팝업 통합 (견적이력 + DB)
===================================================== */

/* ── 전역 헬퍼 ── */
function _setFieldVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

/* ── 상태 ── */
let _clients = [];          // 전체 로드된 목록
let _clientsFiltered = [];  // 검색 필터 결과
let _clientPage = 1;
const _clientPageSize = 30;
let _editingClientId = null;

/* ══════════════════════════════════════
   1. 목록 로드 & 렌더
══════════════════════════════════════ */
async function loadClients() {
  const body = document.getElementById('client-list-body');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;">로딩 중...</td></tr>';

  if (!db) { showToast('DB 연결 필요', 'error'); return; }

  const { data, error } = await db
    .from('clients')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) {
    const isTableMissing = error.message && error.message.includes('schema cache');
    if (isTableMissing) {
      body.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:40px;">
          <div style="color:#dc2626;font-weight:600;margin-bottom:8px;">⚠️ clients 테이블이 Supabase에 없습니다</div>
          <div style="font-size:12px;color:#64748b;line-height:1.8;">
            Supabase Dashboard → SQL Editor에서<br>
            <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">create_clients_table.sql</code> 파일의 내용을 실행해 주세요.
          </div>
        </td></tr>`;
      showToast('Supabase에 clients 테이블을 먼저 생성해 주세요', 'error');
    } else {
      showToast('불러오기 실패: ' + error.message, 'error');
    }
    return;
  }

  _clients = data || [];
  _clientsFiltered = [..._clients];
  _clientPage = 1;
  renderClientList();
}

function filterClients() {
  const q = (document.getElementById('client-search')?.value || '').toLowerCase().trim();
  _clientsFiltered = q
    ? _clients.filter(c =>
        (c.company_name || '').toLowerCase().includes(q) ||
        (c.contact_name || '').toLowerCase().includes(q) ||
        (c.contact_phone || '').includes(q) ||
        (c.sales_person || '').toLowerCase().includes(q)
      )
    : [..._clients];
  _clientPage = 1;
  renderClientList();
}

function renderClientList() {
  const body = document.getElementById('client-list-body');
  const countEl = document.getElementById('client-total-count');
  if (!body) return;

  if (countEl) countEl.textContent = _clientsFiltered.length.toLocaleString();

  const start = (_clientPage - 1) * _clientPageSize;
  const page = _clientsFiltered.slice(start, start + _clientPageSize);

  // 렌더 시 전체선택 체크박스 초기화
  const checkAll = document.getElementById('client-check-all');
  if (checkAll) checkAll.checked = false;
  _clientUpdateBulkBtn();

  if (!page.length) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8;">등록된 고객사가 없습니다</td></tr>';
    renderClientPagination();
    return;
  }

  body.innerHTML = page.map(c => `
    <tr>
      <td style="text-align:center;"><input type="checkbox" class="client-row-check" data-id="${c.id}" onchange="_clientUpdateBulkBtn()" style="width:15px;height:15px;cursor:pointer;"></td>
      <td>
        <div style="font-weight:600;color:#1B3A6B;">${esc(c.company_name)}</div>
        ${c.client_code ? `<div style="font-size:10px;color:#94a3b8;">${esc(c.client_code)}</div>` : ''}
      </td>
      <td>${esc(c.contact_name)}</td>
      <td>${esc(c.contact_phone)}</td>
      <td style="font-size:11px;">${esc(c.contact_email)}</td>
      <td style="font-size:11px;">${esc(c.delivery_address || c.biz_address)}</td>
      <td>${esc(c.sales_person)}</td>
      <td style="text-align:center;white-space:nowrap;">
        <button class="btn btn-sm" style="padding:3px 8px;font-size:11px;background:#eef3fb;color:#1B3A6B;border:1px solid #c7d7f5;" onclick="openClientModal('${c.id}')">수정</button>
        <button class="btn btn-sm btn-danger" style="padding:3px 8px;font-size:11px;" onclick="deleteClient('${c.id}','${esc(c.company_name)}')">삭제</button>
      </td>
    </tr>
  `).join('');

  renderClientPagination();
}

function renderClientPagination() {
  const el = document.getElementById('client-pagination');
  if (!el) return;
  const total = Math.ceil(_clientsFiltered.length / _clientPageSize);
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = '';
  if (_clientPage > 1) html += `<button class="btn btn-sm btn-secondary" onclick="setClientPage(${_clientPage-1})">◀</button>`;
  html += `<span style="color:#64748b;">${_clientPage} / ${total}</span>`;
  if (_clientPage < total) html += `<button class="btn btn-sm btn-secondary" onclick="setClientPage(${_clientPage+1})">▶</button>`;
  el.innerHTML = html;
}

function setClientPage(p) { _clientPage = p; renderClientList(); }

function esc(v) {
  return (v || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════
   2. 추가 / 수정 모달
══════════════════════════════════════ */
function openClientModal(id = null) {
  _editingClientId = id;
  const titleEl = document.getElementById('client-modal-title');
  if (titleEl) titleEl.textContent = id ? '고객사 수정' : '고객사 추가';

  // 폼 초기화
  ['cm-company','cm-contact','cm-phone','cm-email',
   'cm-biz-addr','cm-delivery-addr','cm-sales','cm-code','cm-memo']
    .forEach(i => { const el = document.getElementById(i); if(el) el.value = ''; });

  if (id) {
    const c = _clients.find(x => x.id === id);
    if (c) {
      const sv = (fid, val) => { const el = document.getElementById(fid); if(el) el.value = val || ''; };
      sv('cm-company', c.company_name);
      sv('cm-contact', c.contact_name);
      sv('cm-phone',   c.contact_phone);
      sv('cm-email',   c.contact_email);
      sv('cm-biz-addr', c.biz_address);
      sv('cm-delivery-addr', c.delivery_address);
      sv('cm-sales',   c.sales_person);
      sv('cm-code',    c.client_code);
      sv('cm-memo',    c.memo);
    }
  }
  openModal('modal-client');
}

async function saveClient() {
  const gv = id => (document.getElementById(id)?.value || '').trim();
  const company = gv('cm-company');
  if (!company) { showToast('회사명은 필수입니다', 'error'); return; }

  const payload = {
    company_name:     company,
    contact_name:     gv('cm-contact'),
    contact_phone:    gv('cm-phone'),
    contact_email:    gv('cm-email'),
    biz_address:      gv('cm-biz-addr'),
    delivery_address: gv('cm-delivery-addr'),
    sales_person:     gv('cm-sales'),
    client_code:      gv('cm-code'),
    memo:             gv('cm-memo'),
    is_active:        true,
  };

  let error;
  if (_editingClientId) {
    ({ error } = await db.from('clients').update(payload).eq('id', _editingClientId));
  } else {
    ({ error } = await db.from('clients').insert(payload));
  }

  if (error) { showToast('저장 실패: ' + error.message, 'error'); return; }
  showToast(_editingClientId ? '수정되었습니다' : '고객사가 추가되었습니다', 'success');
  closeModal('modal-client');
  loadClients();
}

/* ══════════════════════════════════════
   3. 삭제
══════════════════════════════════════ */
async function deleteClient(id, name) {
  if (!confirm(`"${name}" 고객사를 삭제하시겠습니까?`)) return;
  const { error } = await db.from('clients').delete().eq('id', id);
  if (error) { showToast('삭제 실패: ' + error.message, 'error'); return; }
  showToast('삭제되었습니다', 'success');
  loadClients();
}

/* ══════════════════════════════════════
   4. ERP CSV 임포트 (EUC-KR)
   컬럼 순서: 거래처코드, 거래처구분, 거래처명, 사업자주소,
             대표자명, 대표전화, 배송주소, 거래처담당자,
             담당자전화, 담당자이메일, 거래업종, 매입구분,
             거래조건(구매), 거래조건(판매), 업체등급
══════════════════════════════════════ */
function importClientCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = ''; // 같은 파일 재선택 가능

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      // EUC-KR 디코딩
      const bytes = new Uint8Array(e.target.result);
      const decoder = new TextDecoder('euc-kr');
      const text = decoder.decode(bytes);

      // ── RFC 4180 표준 CSV 파서 ──────────────────────────────────
      // 필드 안에 쉼표(,) 또는 줄바꿈이 포함된 경우 큰따옴표로 감싸짐
      // 예: "서울시 강남구, 테헤란로 123" → split(',') 하면 컬럼이 밀림
      // → 이 파서는 따옴표를 올바르게 처리하여 컬럼 밀림 방지
      function parseCSV(str) {
        const result = [];
        let row = [], field = '', inQuote = false;
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          const next = str[i + 1];
          if (inQuote) {
            if (ch === '"' && next === '"') { field += '"'; i++; } // escaped quote
            else if (ch === '"') { inQuote = false; }
            else { field += ch; }
          } else {
            if (ch === '"') { inQuote = true; }
            else if (ch === ',') { row.push(field.trim()); field = ''; }
            else if (ch === '\n' || (ch === '\r' && next === '\n')) {
              if (ch === '\r') i++;
              row.push(field.trim()); field = '';
              if (row.some(f => f)) result.push(row); // 완전 빈 줄 제외
              row = [];
            } else { field += ch; }
          }
        }
        if (field || row.length) { row.push(field.trim()); if (row.some(f => f)) result.push(row); }
        return result;
      }

      const allRows = parseCSV(text);

      // 헤더 구조 파악:
      // 첫 줄이 컬럼명(거래처코드 포함)이면 1줄 헤더, 아니면 2줄 헤더(회사명+컬럼명)
      let headerRowIdx = 0;
      if (allRows.length > 0) {
        const firstRow = allRows[0].join(',').toLowerCase();
        // 첫 줄에 '거래처코드' 또는 '거래처명' 같은 컬럼명이 있으면 1줄 헤더
        if (firstRow.includes('거래처') || firstRow.includes('코드') || firstRow.includes('company')) {
          headerRowIdx = 0;
        } else {
          // 첫 줄은 파일 제목(예: 회사명), 두 번째 줄이 컬럼명
          headerRowIdx = 1;
        }
      }
      const dataAllRows = allRows.slice(headerRowIdx + 1);

      if (!dataAllRows.length) { showToast('데이터가 없습니다', 'error'); return; }

      // 헤더 컬럼명으로 인덱스 자동 매핑
      const headerCols = (allRows[headerRowIdx] || []).map(h => h.toLowerCase().replace(/\s/g,''));
      function colIdx(keywords) {
        for (const kw of keywords) {
          const idx = headerCols.findIndex(h => h.includes(kw));
          if (idx !== -1) return idx;
        }
        return -1;
      }
      // 각 필드별 컬럼 인덱스 (후보 키워드 순서대로 매칭)
      const CI = {
        client_code:          colIdx(['거래처코드','code','코드']),
        client_type:          colIdx(['거래처구분','구분','type']),
        company_name:         colIdx(['거래처명','회사명','company']),
        biz_address:          colIdx(['사업자주소','사업장주소','주소','address']),
        ceo_name:             colIdx(['대표자명','대표자','ceo']),
        ceo_phone:            colIdx(['대표전화','대표번호']),
        delivery_address:     colIdx(['배송주소','배송지','delivery']),
        contact_name:         colIdx(['거래처담당자','담당자명','담당자','contact']),
        contact_phone:        colIdx(['담당자전화','담당전화','연락처','phone','tel']),
        contact_email:        colIdx(['담당자이메일','이메일','email']),
        biz_type:             colIdx(['거래업종','업종','biztype']),
        purchase_yn:          colIdx(['매입구분','매입']),
        trade_condition_buy:  colIdx(['거래조건(구매)','구매조건','tradebuy']),
        trade_condition_sell: colIdx(['거래조건(판매)','판매조건','tradesell']),
        grade:                colIdx(['업체등급','등급','grade']),
      };

      // 헤더 매핑 실패 시 → 컬럼 순서 기본값으로 폴백
      const useFallback = CI.company_name === -1;
      if (useFallback) {
        CI.client_code=0; CI.client_type=1; CI.company_name=2; CI.biz_address=3;
        CI.ceo_name=4; CI.ceo_phone=5; CI.delivery_address=6; CI.contact_name=7;
        CI.contact_phone=8; CI.contact_email=9; CI.biz_type=10; CI.purchase_yn=11;
        CI.trade_condition_buy=12; CI.trade_condition_sell=13; CI.grade=14;
      }

      function col(cols, key) {
        const idx = CI[key];
        return (idx >= 0 && idx < cols.length) ? (cols[idx] || '').trim() : '';
      }

      const rows = dataAllRows.map(cols => ({
        client_code:          col(cols, 'client_code'),
        client_type:          col(cols, 'client_type'),
        company_name:         col(cols, 'company_name'),
        biz_address:          col(cols, 'biz_address'),
        ceo_name:             col(cols, 'ceo_name'),
        ceo_phone:            col(cols, 'ceo_phone'),
        delivery_address:     col(cols, 'delivery_address'),
        contact_name:         col(cols, 'contact_name'),
        contact_phone:        col(cols, 'contact_phone'),
        contact_email:        col(cols, 'contact_email'),
        biz_type:             col(cols, 'biz_type'),
        purchase_yn:          col(cols, 'purchase_yn'),
        trade_condition_buy:  col(cols, 'trade_condition_buy'),
        trade_condition_sell: col(cols, 'trade_condition_sell'),
        grade:                col(cols, 'grade'),
        is_active:            true,
      })).filter(r => r.company_name); // 회사명 없는 줄 제외

      if (!rows.length) { showToast('유효한 데이터가 없습니다', 'error'); return; }

      showToast(`${rows.length}건 임포트 중...`, 'info');

      // 기존 client_code 목록 조회 (중복 체크용)
      const { data: existing } = await db.from('clients').select('id, client_code');
      const existingMap = new Map((existing || [])
        .filter(r => r.client_code)
        .map(r => [r.client_code, r.id])
      );

      // 회사명 기준 중복 체크 (client_code 없는 경우)
      const { data: existingByName } = await db.from('clients').select('id, company_name');
      const existingNameMap = new Map((existingByName || []).map(r => [r.company_name, r.id]));

      let inserted = 0, updated = 0, failed = 0;

      // 신규 / 업데이트 분류
      const toInsert = [];
      const toUpdate = []; // { id, row }

      for (const row of rows) {
        let existingId = null;
        if (row.client_code) existingId = existingMap.get(row.client_code) || null;
        if (!existingId)     existingId = existingNameMap.get(row.company_name) || null;

        if (existingId) toUpdate.push({ id: existingId, row });
        else            toInsert.push(row);
      }

      // 신규: 50건씩 배치 insert
      const batchSize = 50;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await db.from('clients').insert(batch);
        if (error) { failed += batch.length; }
        else       { inserted += batch.length; }
      }

      // 업데이트: 10건씩 병렬 처리
      const updateChunkSize = 10;
      for (let i = 0; i < toUpdate.length; i += updateChunkSize) {
        const chunk = toUpdate.slice(i, i + updateChunkSize);
        const results = await Promise.all(
          chunk.map(({ id, row }) => db.from('clients').update(row).eq('id', id))
        );
        results.forEach(({ error }) => {
          if (error) failed++;
          else       updated++;
        });
      }

      const msg = `✅ 임포트 완료! 신규 ${inserted}건, 업데이트 ${updated}건${failed ? `, 실패 ${failed}건` : ''}`;
      showToast(msg, failed ? 'error' : 'success');
      loadClients();
    } catch(err) {
      showToast('파일 처리 오류: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

/* ══════════════════════════════════════
   5. Excel 다운로드
══════════════════════════════════════ */
async function exportClientsExcel() {
  if (typeof XLSX === 'undefined') { showToast('Excel 라이브러리 로딩 중...', 'info'); return; }

  // 전체 데이터 다시 로드
  const { data, error } = await db.from('clients').select('*').order('company_name');
  if (error) { showToast('데이터 로드 실패', 'error'); return; }
  if (!data?.length) { showToast('내보낼 데이터가 없습니다', 'error'); return; }

  const rows = data.map(c => ({
    '거래처코드':   c.client_code || '',
    '회사명':       c.company_name || '',
    '담당자':       c.contact_name || '',
    '연락처':       c.contact_phone || '',
    '이메일':       c.contact_email || '',
    '사업자주소':   c.biz_address || '',
    '배송지주소':   c.delivery_address || '',
    '담당영업사원': c.sales_person || '',
    '대표자':       c.ceo_name || '',
    '대표전화':     c.ceo_phone || '',
    '거래업종':     c.biz_type || '',
    '등급':         c.grade || '',
    '메모':         c.memo || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  // 컬럼 너비 설정
  ws['!cols'] = [8,20,10,14,24,30,30,12,10,14,12,8,20].map(w=>({wch:w}));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '고객사목록');

  const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
  XLSX.writeFile(wb, `비유니드_고객사목록_${today}.xlsx`);
  showToast('Excel 다운로드 완료', 'success');
}

/* ══════════════════════════════════════
   6. 고객사 선택 팝업 통합
   — 기존 견적이력 + clients DB 합산 표시
══════════════════════════════════════ */
async function pOpenClientPicker() {
  openModal('modal-client-picker');
  const listEl = document.getElementById('cpi-list');
  if (!listEl) return;
  listEl.innerHTML = '<div class="cpi-loading">불러오는 중...</div>';

  // clients DB 조회 (테이블 미존재 시 graceful 처리)
  let clientRows = [];
  if (db) {
    const { data, error } = await db
      .from('clients')
      .select('company_name,contact_name,contact_phone,contact_email,delivery_address,biz_address')
      .order('company_name');
    if (!error) clientRows = data || [];
    // 테이블 없으면 견적이력만으로 진행 (오류 무시)
  }

  // 기존 견적이력에서 추출 (중복 제거용)
  const { data: quoteRows } = db
    ? await db.from('quotes').select('company_name,contact_name,contact_tel,contact_email').order('created_at', { ascending: false })
    : { data: [] };

  // clients DB 우선, 없으면 견적이력에서 보완
  const merged = new Map();
  (clientRows || []).forEach(c => {
    if (c.company_name) merged.set(c.company_name, {
      company_name:  c.company_name,
      contact_name:  c.contact_name || '',
      contact_phone: c.contact_phone || '',
      contact_email: c.contact_email || '',
      delivery:      c.delivery_address || c.biz_address || '',
      from_db: true,
    });
  });
  (quoteRows || []).forEach(q => {
    if (q.company_name && !merged.has(q.company_name)) {
      merged.set(q.company_name, {
        company_name:  q.company_name,
        contact_name:  q.contact_name || '',
        contact_phone: q.contact_tel || '',
        contact_email: q.contact_email || '',
        delivery: '',
        from_db: false,
      });
    }
  });

  const list = [...merged.values()];
  _cpiAll = list;
  _cpiFiltered = [...list];

  renderCpiList('cpi-list', list, (c) => {
    _setFieldVal('f-company', c.company_name);
    _setFieldVal('f-contact', c.contact_name);
    _setFieldVal('f-phone',   c.contact_phone);
    _setFieldVal('f-email',   c.contact_email);
    if (c.delivery) _setFieldVal('f-delivery', c.delivery);
    closeModal('modal-client-picker');
    showToast(`"${c.company_name}" 정보를 불러왔습니다`, 'success');
  });
}

async function rOpenClientPicker() {
  openModal('modal-r-client-picker');
  const listEl = document.getElementById('r-cpi-list');
  if (!listEl) return;
  listEl.innerHTML = '<div class="cpi-loading">불러오는 중...</div>';

  // clients DB 조회 (테이블 미존재 시 graceful 처리)
  let clientRows = [];
  if (db) {
    const { data, error } = await db
      .from('clients')
      .select('company_name,contact_name,contact_phone,contact_email,delivery_address,biz_address')
      .order('company_name');
    if (!error) clientRows = data || [];
  }

  const { data: quoteRows } = db
    ? await db.from('rental_quotes').select('company_name,contact_name,contact_tel,contact_email').order('created_at', { ascending: false })
    : { data: [] };

  const merged = new Map();
  (clientRows || []).forEach(c => {
    if (c.company_name) merged.set(c.company_name, {
      company_name:  c.company_name,
      contact_name:  c.contact_name || '',
      contact_phone: c.contact_phone || '',
      contact_email: c.contact_email || '',
      delivery:      c.delivery_address || c.biz_address || '',
    });
  });
  (quoteRows || []).forEach(q => {
    if (q.company_name && !merged.has(q.company_name)) {
      merged.set(q.company_name, {
        company_name:  q.company_name,
        contact_name:  q.contact_name || '',
        contact_phone: q.contact_tel || '',
        contact_email: q.contact_email || '',
        delivery: '',
      });
    }
  });

  const list = [...merged.values()];
  renderCpiList('r-cpi-list', list, (c) => {
    _setFieldVal('r-company', c.company_name);
    _setFieldVal('r-contact', c.contact_name);
    _setFieldVal('r-phone',   c.contact_phone);
    _setFieldVal('r-email',   c.contact_email);
    if (c.delivery) _setFieldVal('r-delivery', c.delivery);
    closeModal('modal-r-client-picker');
    showToast(`"${c.company_name}" 정보를 불러왔습니다`, 'success');
  });
}

/* 공통 렌더 */
let _cpiAll = [], _cpiFiltered = [], _cpiCallback = null;

function renderCpiList(containerId, list, onSelect) {
  _cpiCallback = onSelect;
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div class="cpi-empty">등록된 고객사가 없습니다</div>';
    return;
  }
  el.innerHTML = list.map((c,i) => `
    <div class="cpi-item" onclick="_cpiCallback(${JSON.stringify(c).replace(/"/g,'&quot;')})">
      <div class="cpi-company">${esc(c.company_name)}</div>
      <div class="cpi-detail">
        ${c.contact_name ? `<span>${esc(c.contact_name)}</span>` : ''}
        ${c.contact_phone ? `<span>${esc(c.contact_phone)}</span>` : ''}
        ${c.contact_email ? `<span>${esc(c.contact_email)}</span>` : ''}
      </div>
    </div>
  `).join('');
}

/* 팝업 검색 */
function cpiSearch(inputId, listId, type) {
  const q = (document.getElementById(inputId)?.value || '').toLowerCase();
  const list = _cpiAll.filter(c =>
    (c.company_name||'').toLowerCase().includes(q) ||
    (c.contact_name||'').toLowerCase().includes(q) ||
    (c.contact_phone||'').includes(q)
  );
  renderCpiList(listId, list, _cpiCallback);
}

/* ══════════════════════════════════════
   7. 견적 저장 시 고객사 자동 upsert
   purchase.js / rental.js에서 저장 후 호출
══════════════════════════════════════ */
async function upsertClientFromQuote(payload) {
  if (!db || !payload.company_name) return;
  try {
    // 동일 회사명 있으면 연락처 정보만 업데이트, 없으면 신규 등록
    const { data: existing } = await db
      .from('clients')
      .select('id')
      .eq('company_name', payload.company_name)
      .maybeSingle();

    if (existing) {
      // 빈 값은 덮어쓰지 않음
      const update = {};
      if (payload.contact_name)  update.contact_name  = payload.contact_name;
      if (payload.contact_phone) update.contact_phone = payload.contact_phone;
      if (payload.contact_email) update.contact_email = payload.contact_email;
      if (Object.keys(update).length)
        await db.from('clients').update(update).eq('id', existing.id);
    } else {
      await db.from('clients').insert({ ...payload, is_active: true });
    }
  } catch(e) { /* silent */ }
}

/* ══════════════════════════════════════
   8. 1회성 품목 직접입력 (구매견적)
══════════════════════════════════════ */
function calcManualItem() {
  const price = parseInt(document.getElementById('mi-price')?.value) || 0;
  const qty   = parseInt(document.getElementById('mi-qty')?.value)   || 0;
  const total = price * qty;
  const el = document.getElementById('mi-total');
  if (el) el.textContent = total.toLocaleString('ko-KR') + ' 원';
}

function openManualItemModal() {
  ['mi-brand','mi-category','mi-name','mi-spec'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  const priceEl = document.getElementById('mi-price');
  const qtyEl   = document.getElementById('mi-qty');
  if (priceEl) priceEl.value = '';
  if (qtyEl)   qtyEl.value  = '1';
  const totalEl = document.getElementById('mi-total');
  if (totalEl) totalEl.textContent = '0 원';
  openModal('modal-manual-item');
}

function addManualItem() {
  const gv = id => (document.getElementById(id)?.value || '').trim();
  const name  = gv('mi-name');
  const price = parseInt(gv('mi-price')) || 0;
  const qty   = parseInt(gv('mi-qty'))   || 1;

  if (!name)  { showToast('모델명을 입력하세요', 'error'); return; }
  if (!price) { showToast('단가를 입력하세요', 'error'); return; }

  // quoteItems에 직접 추가 (purchase.js 전역 변수)
  const item = {
    id:           'manual_' + Date.now(),
    product_id:   null,
    brand:        gv('mi-brand'),
    category:     gv('mi-category'),
    product_name: name,
    spec_summary: gv('mi-spec'),
    unit_price:   price,
    qty:          qty,
    total_price:  price * qty,
    info_url:     '',
    is_manual:    true,  // 직접입력 표시
  };

  if (typeof quoteItems !== 'undefined') {
    quoteItems.push(item);
    if (typeof renderQuoteItems === 'function') renderQuoteItems();
    if (typeof calcPrice === 'function') calcPrice();
  }

  closeModal('modal-manual-item');
  showToast(`"${name}" 견적에 추가되었습니다`, 'success');
}

/* 검색 입력 핸들러 (HTML onkeyup에서 호출) */
function onCpiSearchInput(type) {
  if (type === 'purchase') cpiSearch('cpi-search-input', 'cpi-list', 'purchase');
  else cpiSearch('r-cpi-search-input', 'r-cpi-list', 'rental');
}

/* ══════════════════════════════════════
   9. 고객사 전체선택 / 선택삭제
══════════════════════════════════════ */

// 선택된 ID 목록 반환
function _clientCheckedIds() {
  return [...document.querySelectorAll('.client-row-check:checked')].map(el => el.dataset.id);
}

// 선택삭제 버튼 표시/숨김 업데이트
function _clientUpdateBulkBtn() {
  const btn = document.getElementById('client-bulk-del-btn');
  if (!btn) return;
  const count = _clientCheckedIds().length;
  btn.style.display = count > 0 ? '' : 'none';
  btn.textContent = `🗑️ 선택 삭제 (${count})`;
}

// 전체선택 / 전체해제
function clientToggleAll(checkbox) {
  document.querySelectorAll('.client-row-check').forEach(el => {
    el.checked = checkbox.checked;
  });
  _clientUpdateBulkBtn();
}

// 전체 삭제
async function clientDeleteAll() {
  const total = _clients.length;
  if (!total) { showToast('삭제할 데이터가 없습니다', 'error'); return; }
  if (!confirm(`전체 ${total.toLocaleString()}개 고객사를 모두 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) return;

  showToast(`${total}건 삭제 중...`, 'info');

  // 전체 ID 목록으로 50건씩 배치 삭제
  const ids = _clients.map(c => c.id);
  const chunkSize = 50;
  let failed = 0;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await db.from('clients').delete().in('id', chunk);
    if (error) failed += chunk.length;
  }

  if (failed) {
    showToast(`삭제 완료 (실패 ${failed}건)`, 'error');
  } else {
    showToast(`✅ 전체 ${total}건 삭제 완료`, 'success');
  }
  loadClients();
}

// 선택된 항목 일괄 삭제
async function clientBulkDelete() {
  const ids = _clientCheckedIds();
  if (!ids.length) return;
  if (!confirm(`선택한 ${ids.length}개 고객사를 삭제하시겠습니까?`)) return;

  showToast(`${ids.length}건 삭제 중...`, 'info');

  // 10건씩 병렬 삭제
  const chunkSize = 10;
  let failed = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map(id => db.from('clients').delete().eq('id', id))
    );
    results.forEach(({ error }) => { if (error) failed++; });
  }

  if (failed) {
    showToast(`삭제 완료 (실패 ${failed}건)`, 'error');
  } else {
    showToast(`✅ ${ids.length}건 삭제 완료`, 'success');
  }

  // 전체선택 체크박스 초기화
  const checkAll = document.getElementById('client-check-all');
  if (checkAll) checkAll.checked = false;
  _clientUpdateBulkBtn();

  loadClients();
}
