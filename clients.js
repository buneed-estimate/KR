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

  if (error) { showToast('불러오기 실패: ' + error.message, 'error'); return; }

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

  if (!page.length) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">등록된 고객사가 없습니다</td></tr>';
    renderClientPagination();
    return;
  }

  body.innerHTML = page.map(c => `
    <tr>
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

      const lines = text.split(/\r?\n/).filter(l => l.trim());
      // 첫 줄 = 회사명 헤더, 두 번째 줄 = 컬럼명 → 데이터는 3번째 줄부터
      const dataLines = lines.slice(2);

      if (!dataLines.length) { showToast('데이터가 없습니다', 'error'); return; }

      const rows = dataLines.map(line => {
        const cols = line.split(',');
        return {
          client_code:      (cols[0]||'').trim(),
          client_type:      (cols[1]||'').trim(),
          company_name:     (cols[2]||'').trim(),
          biz_address:      (cols[3]||'').trim(),
          ceo_name:         (cols[4]||'').trim(),
          ceo_phone:        (cols[5]||'').trim(),
          delivery_address: (cols[6]||'').trim(),
          contact_name:     (cols[7]||'').trim(),
          contact_phone:    (cols[8]||'').trim(),
          contact_email:    (cols[9]||'').trim(),
          biz_type:         (cols[10]||'').trim(),
          purchase_yn:      (cols[11]||'').trim(),
          trade_condition_buy:  (cols[12]||'').trim(),
          trade_condition_sell: (cols[13]||'').trim(),
          grade:            (cols[14]||'').trim(),
          is_active:        true,
        };
      }).filter(r => r.company_name); // 회사명 없는 줄 제외

      if (!rows.length) { showToast('유효한 데이터가 없습니다', 'error'); return; }

      showToast(`${rows.length}건 임포트 중...`, 'info');

      // 50건씩 배치 upsert (client_code 기준)
      const batchSize = 50;
      let imported = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await db.from('clients').upsert(batch, { onConflict: 'client_code', ignoreDuplicates: false });
        if (error) { showToast('임포트 오류: ' + error.message, 'error'); return; }
        imported += batch.length;
      }

      showToast(`✅ ${imported}건 임포트 완료!`, 'success');
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

  // clients DB 조회
  const { data: clientRows } = db
    ? await db.from('clients').select('company_name,contact_name,contact_phone,contact_email,delivery_address,biz_address').order('company_name')
    : { data: [] };

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

  const { data: clientRows } = db
    ? await db.from('clients').select('company_name,contact_name,contact_phone,contact_email,delivery_address,biz_address').order('company_name')
    : { data: [] };

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
