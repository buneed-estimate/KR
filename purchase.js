// ===== 구매 견적 함수 =====


// ══════════════════════════════════════════════════════════════════
//  ■ 구매견적 시스템
// ══════════════════════════════════════════════════════════════════
let products = [], specCategories = [], specOptions = [];
let quoteItems = [];
let currentSpecProductId = null;
let selectedSpecOpts = {};   // { catId: optId } - 드롭다운 선택값 저장
let editingQuoteId = null;
let currentQuoteNum = '';
let currentShareToken = null;
let _lastPreviewHtml = '';

// PC 계열 카테고리 (스펙 드롭다운 표시 대상)
const PC_CATEGORIES = ['노트북', '데스크탑', '워크스테이션', '모바일워크스테이션'];

function initQuoteNum() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  currentQuoteNum = 'Q'+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'-'+pad(now.getHours())+pad(now.getMinutes());
}

async function loadAllData() {
  // 카탈로그(제품목록) 우선 로드 → spec 데이터는 백그라운드
  await loadProducts();
  // _specDataPromise를 전역에 설정 → ensureSpecData와 공유 (중복 쿼리 방지)
  if (!_specDataPromise) {
    _specDataPromise = Promise.all([loadSpecCategories(), loadSpecOptions()]);
  }
}
async function loadProducts() {
  // ── [1단계] localStorage 캐시 → 즉시 화면 표시 (stale-while-revalidate) ──
  let hasCacheHit = false;
  try {
    const cached = localStorage.getItem('buneed_products_v2');
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (data && data.length > 0) {
        products = data;
        renderProducts(); // 캐시 즉시 렌더 (빠른 표시)
        hasCacheHit = true;
        // TTL 30분 이내면 DB 쿼리 생략
        if (Date.now() - ts < 30 * 60 * 1000) return;
        // TTL 초과: 백그라운드에서 갱신 (화면은 이미 보임)
      }
    }
  } catch(e) { /* localStorage 에러 무시 */ }

  // ── [2단계] DB 쿼리 (캐시 없거나 TTL 초과 시) ──
  try {
    const { data, error } = await db.from('products')
      .select('id,category,brand,name,spec_summary,feature,base_price,info_url,is_active')
      .eq('is_active', true)
      .order('category');
    if (error || !data || data.length === 0) {
      // DB 실패 → 캐시가 없을 때만 SAMPLE_PRODUCTS fallback
      if (!hasCacheHit) {
        products = (typeof SAMPLE_PRODUCTS !== 'undefined')
          ? SAMPLE_PRODUCTS.map((p,i) => ({...p, id:i+1}))
          : [];
      }
    } else {
      products = data.map(p => ({...p, _fromDB:true}));
      // 캐시 갱신
      try {
        localStorage.setItem('buneed_products_v2', JSON.stringify({ data: products, ts: Date.now() }));
      } catch(e) {}
    }
  } catch(e) {
    if (!hasCacheHit) {
      products = (typeof SAMPLE_PRODUCTS !== 'undefined')
        ? SAMPLE_PRODUCTS.map((p,i) => ({...p, id:i+1}))
        : [];
    }
  }
  renderProducts();
}
async function loadSpecCategories() {
  try {
    const { data } = await db.from('spec_categories').select('*').order('sort_order');
    specCategories = data || [];
  } catch(e) { specCategories = []; }
}
async function loadSpecOptions() {
  try {
    const { data } = await db.from('spec_options').select('*').order('sort_order');
    specOptions = data || [];
  } catch(e) { specOptions = []; }
}

function fmtSpec(spec) {
  if (!spec) return '';
  // KEY: 라벨 제거 (CPU:, RAM:, SSD:, VGA:, ODD:, POWER:, OS:, 크기:, 해상도:, 패널:, 밝기:, 연결단자:, 스탠드:, 기타: 등)
  let s = spec.replace(/\b(CPU|RAM|SSD|HDD|VGA|ODD|POWER|OS|크기|해상도|패널|밝기|연결단자|스탠드|기타|무게|배터리|카메라|인터페이스|포트|네트워크|무선|터치|스피커|마이크|색상|재질|인증|보증|특징|구성|용량|속도|타입|형태|방식|채널|주파수|감도|임피던스|SNR|왜율|종류|규격|모델):\s*/gi, '');
  // 콤마+공백 또는 콤마 뒤에 특정 키워드가 오는 경우만 / 로 변환
  // 단, 값 내부의 콤마(i3,i5,i7 같은)는 그대로 유지
  // 줄바꿈을 / 로 변환
  s = s.replace(/\n/g, ' / ');
  // 앞뒤 공백 정리
  s = s.replace(/\/\s*\//g, ' / ').trim();
  return s;
}

function renderProducts() {
  const cat = document.getElementById('f-cat').value;
  const brand = document.getElementById('f-brand').value;
  let list = products;
  if (cat) list = list.filter(p=>p.category===cat);
  if (brand) list = list.filter(p=>p.brand===brand);
  const el = document.getElementById('product-list');
  if (!list.length) { el.innerHTML='<div class="no-products">제품 없음</div>'; return; }
  el.innerHTML = list.map(p=>`
    <div class="product-card" onclick="openSpecModal('${p.id}')">
      <div class="pc-name">${p.name}</div>
      <div class="pc-brand">${p.category} · ${p.brand}</div>
      <div class="pc-price">${p.base_price > 0 ? fmt(p.base_price)+'원' : '가격 문의'}</div>
    </div>`).join('');
}

// ── 스펙 옵션 데이터 보장 (첫 모달 오픈 시 1회 로드) ──
let _specDataPromise = null;
async function ensureSpecData() {
  if (specCategories.length > 0 && specOptions.length > 0) return; // 이미 로드됨
  if (!_specDataPromise) {
    _specDataPromise = Promise.all([loadSpecCategories(), loadSpecOptions()]);
  }
  await _specDataPromise;
}

async function openSpecModal(productId) {
  const p = products.find(x=>String(x.id)===String(productId));
  if (!p) return;

  // ── 스펙 옵션 보장 (백그라운드 로드 완료 대기, 보통 즉시 반환) ──
  await ensureSpecData();

  currentSpecProductId = productId;
  selectedSpecOpts = {};
  document.getElementById('aq-title').textContent = '제품 상세';
  document.getElementById('aq-product-info').innerHTML = `
    <div class="atq-name">${p.name}${p.info_url?'<span style="display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;margin-left:5px;vertical-align:super;flex-shrink:0;" title="이미지/링크 있음"></span>':''}</div>
    <div class="atq-meta">
      ${p.category?`<span>${p.category}</span>`:''}
      ${p.brand?`<span style="color:#94a3b8;">|</span><span>${p.brand}</span>`:''}
      ${p.base_price?`<span style="color:#94a3b8;">|</span><span style="color:#1B3A6B;font-weight:700;">${fmt(p.base_price)} 원</span>`:''}
    </div>
    ${p.spec_summary?`<div class="atq-spec" id="aq-spec-default-text">${fmtSpec(p.spec_summary)}</div>`:''}
    ${p.feature?`<div class="atq-feature">${p.feature}</div>`:''}
  `;

  // PC 카테고리일 때만 스펙 드롭다운 표시
  const isPC = PC_CATEGORIES.includes(p.category);
  const cats = isPC
    ? specCategories.filter(c => !c.product_categories?.length || c.product_categories.includes(p.category))
    : [];

  let optsHtml = '';
  if (isPC && cats.length > 0) {
    optsHtml = '<div class="spec-dropdown-section">';
    for (const cat of cats) {
      const opts = specOptions.filter(o => o.spec_category_id === cat.id);
      if (!opts.length) continue;
      optsHtml += `
        <div class="spec-dd-row">
          <label class="spec-dd-label">${cat.name}</label>
          <select class="spec-dd-select field-input" data-cat-id="${cat.id}" onchange="onSpecDropdownChange('${cat.id}',this.value)">
            <option value="">— 선택 안 함 —</option>
            ${opts.map(o=>`<option value="${o.id}" data-price="${o.price_delta||0}">${o.name}${o.price_delta?` (+${fmt(o.price_delta)}원)`:' (포함)'}</option>`).join('')}
          </select>
        </div>`;
    }
    optsHtml += '</div>';
  }
  document.getElementById('spec-opts').innerHTML = optsHtml;

  // 기본가 (aq-base-price) 초기화
  const basePriceEl = document.getElementById('aq-base-price');
  if (basePriceEl) { basePriceEl.value = p.base_price || 0; }
  document.getElementById('aq-unit').value = p.base_price || 0;
  document.getElementById('aq-qty').value = 1;
  updateAQCalc();
  openModal('modal-aq');
}

// 드롭다운 선택 시 호출
function onSpecDropdownChange(catId, optId) {
  if (optId) {
    selectedSpecOpts[catId] = optId;
  } else {
    delete selectedSpecOpts[catId];
  }
  recalcAQPrice();
}

// 기본가 + 선택된 스펙 합계로 단가 재계산
function recalcAQPrice() {
  const basePriceEl = document.getElementById('aq-base-price');
  const base = parseInt(basePriceEl ? basePriceEl.value : document.getElementById('aq-unit').value) || 0;
  let extra = 0;
  for (const optId of Object.values(selectedSpecOpts)) {
    const opt = specOptions.find(o => String(o.id) === String(optId));
    if (opt) extra += (opt.price_delta || 0);
  }
  document.getElementById('aq-unit').value = base + extra;
  updateAQCalc();
}
function updateAQCalc() {
  const unit = parseInt(document.getElementById('aq-unit').value)||0;
  const qty = parseInt(document.getElementById('aq-qty').value)||1;
  document.getElementById('aq-total-val').textContent = fmt(unit*qty)+' 원';
}
function resetAQPrice() {
  const p = products.find(x=>String(x.id)===String(currentSpecProductId));
  if (!p) return;
  let total = p.base_price;
  for (const optId of Object.values(selectedSpecOpts)) {
    const opt = specOptions.find(o=>o.id===optId);
    if (opt) total += (opt.price_delta||0);
  }
  document.getElementById('aq-unit').value = total;
  updateAQCalc();
}

function addToQuote() {
  const p = products.find(x=>String(x.id)===String(currentSpecProductId));
  if (!p) return;
  const unit = parseInt(document.getElementById('aq-unit').value)||0;
  const qty = parseInt(document.getElementById('aq-qty').value)||1;

  // 스펙 요약 자동 생성: 선택한 옵션 이름만 / 구분자로 연결
  let specSummary;
  const selectedOptNames = Object.values(selectedSpecOpts)
    .map(id => specOptions.find(o => String(o.id) === String(id))?.name)
    .filter(Boolean);

  if (selectedOptNames.length > 0) {
    // 선택한 스펙이 있으면 → 값만 조합 (라벨 없이)
    specSummary = selectedOptNames.join(' / ');
  } else {
    // 선택 안 하면 → 기존 spec_summary 그대로
    specSummary = p.spec_summary || '';
  }

  quoteItems.push({
    product_id: p.id, product_name: p.name, brand: p.brand, category: p.category,
    spec_summary: specSummary, unit_price: unit, qty, total_price: unit*qty,
    _fromDB: !!p._fromDB, info_url: p.info_url || null
  });
  renderQuoteItems(); calcPrice(); closeModal('modal-aq');
  showToast(p.name+' 추가됨', 'success');
}

function renderQuoteItems() {
  const el = document.getElementById('quote-items-area');
  if (!quoteItems.length) {
    el.innerHTML='<div class="no-products" style="padding:16px 0">좌측 카탈로그에서 제품을 클릭하여 추가하세요</div>';
    return;
  }
  el.innerHTML = `<table class="items-table"><thead><tr><th style="width:70px;">브랜드</th><th>제품명 / 사양</th><th style="text-align:right;min-width:90px;">단가</th><th style="text-align:center;min-width:100px;">수량</th><th></th></tr></thead><tbody>
    ${quoteItems.map((it,i)=>`<tr>
      <td style="text-align:center;vertical-align:middle;padding:6px 4px;">
        <div style="font-size:10.5px;font-weight:700;color:#1B3A6B;white-space:nowrap;">${it.brand||''}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${it.category||''}</div>
      </td>
      <td><strong>${it.product_name}</strong>${it.spec_summary ? `<div style="font-size:10.5px;color:#64748b;margin-top:3px;line-height:1.4;">${fmtSpec(it.spec_summary)}</div>` : ''}</td>
      <td style="text-align:right;font-size:12px;">${fmt(it.unit_price)}원</td>
      <td style="text-align:center;">
        <div class="qty-stepper">
          <button class="qty-btn" onclick="changeQty(${i},${it.qty}-1)">−</button>
          <span class="qty-display">${it.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i},${it.qty}+1)">+</button>
        </div>
      </td>
      <td><button class="btn-rm" onclick="removeItem(${i})">✕</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}

function changeQty(i, v) {
  quoteItems[i].qty = parseInt(v)||1;
  quoteItems[i].total_price = quoteItems[i].unit_price * quoteItems[i].qty;
  renderQuoteItems(); calcPrice();
}
function removeItem(i) { quoteItems.splice(i,1); renderQuoteItems(); calcPrice(); }

function calcPrice() {
  const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
  const rate = parseFloat(document.getElementById('discount-rate').value)||0;
  const discAmt = Math.round(sub*rate/100);
  document.getElementById('discount-amt').value = discAmt;
  const supply = sub - discAmt;
  const vat = Math.round(supply*0.1);
  document.getElementById('sum-subtotal').textContent = fmt(sub)+' 원';
  document.getElementById('sum-supply').textContent = fmt(supply)+' 원';
  document.getElementById('sum-vat').textContent = fmt(vat)+' 원';
  document.getElementById('sum-total').textContent = fmt(supply+vat)+' 원';
}
function calcPriceByAmt() {
  const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
  const discAmt = parseInt((document.getElementById('discount-amt')||{}).value)||0;
  document.getElementById('discount-rate').value = sub>0?(discAmt/sub*100).toFixed(1):0;
  const supply = sub - discAmt;
  const vat = Math.round(supply*0.1);
  document.getElementById('sum-subtotal').textContent = fmt(sub)+' 원';
  document.getElementById('sum-supply').textContent = fmt(supply)+' 원';
  document.getElementById('sum-vat').textContent = fmt(vat)+' 원';
  document.getElementById('sum-total').textContent = fmt(supply+vat)+' 원';
}

async function saveQuote() {
  const company = document.getElementById('f-company').value.trim();
  if (!company) { showToast('회사명을 입력하세요', 'error'); return; }
  if (!quoteItems.length) { showToast('견적 품목을 추가하세요', 'error'); return; }
  if (!db) { showToast('DB 연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.', 'error'); return; }
  const btn = document.getElementById('btn-save-quote');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
  try {
    const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
    const discAmt = parseInt(document.getElementById('discount-amt').value)||0;
    const supply = sub - discAmt;
    const vat = Math.round(supply*0.1);
    if (!currentShareToken) currentShareToken = Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,10);
    const payload = {
      quote_number: currentQuoteNum, share_token: currentShareToken,
      company_name: company,
      contact_name: (document.getElementById('f-contact')||{}).value||null,
      contact_tel: (document.getElementById('f-phone')||{}).value||null,
      contact_email: (document.getElementById('f-email')||{}).value||null,
      delivery_date: (document.getElementById('f-delivery')||{}).value||null,
      valid_until: (document.getElementById('f-validity')||{value:'견적일로부터 30일'}).value||'견적일로부터 30일',
      memo: (document.getElementById('f-memo')||{}).value||null,
      subtotal:sub, discount_amount:discAmt, supply_price:supply, vat, total:supply+vat,
      status:'draft',
      sales_name: (document.getElementById('f-sales-name')||{}).value||null,
      sales_phone: (document.getElementById('f-sales-phone')||{}).value||null,
      sales_email: (document.getElementById('f-sales-email')||{}).value||null,
    };
    let qId;
    if (editingQuoteId) {
      let {error} = await db.from('quotes').update(payload).eq('id',editingQuoteId);
      if (error && error.message && error.message.includes('column')) {
        // sales 컬럼이 DB에 없는 경우 제외하고 재시도
        const {sales_name,sales_phone,sales_email,...basePayload} = payload;
        ({error} = await db.from('quotes').update(basePayload).eq('id',editingQuoteId));
      }
      if (error) throw new Error('견적 업데이트 실패: '+error.message);
      const {error:delErr} = await db.from('quote_items').delete().eq('quote_id',editingQuoteId);
      if (delErr) throw new Error('기존 품목 삭제 실패: '+delErr.message);
      qId = editingQuoteId;
    } else {
      let {data,error} = await db.from('quotes').insert(payload).select().single();
      if (error && error.message && error.message.includes('column')) {
        // sales 컬럼이 DB에 없는 경우 제외하고 재시도
        const {sales_name,sales_phone,sales_email,...basePayload} = payload;
        ({data,error} = await db.from('quotes').insert(basePayload).select().single());
      }
      if (error) throw new Error('견적 생성 실패: '+error.message);
      qId = data.id; editingQuoteId = qId;
    }
    // product_id: DB 제품은 실제 id, 샘플 제품은 null로 처리 (FK 오류 방지)
    const itemsPayload = quoteItems.map((it,i)=>({
      quote_id: qId,
      product_id: (it._fromDB && it.product_id) ? it.product_id : null,
      product_name: it.product_name,
      brand: it.brand,
      category: it.category,
      spec_summary: it.spec_summary||'',
      unit_price: it.unit_price,
      qty: it.qty,
      total_price: it.total_price,
      sort_order: i,
      info_url: it.info_url || null
    }));
    const {error:itemErr} = await db.from('quote_items').insert(itemsPayload);
    if (itemErr) throw new Error('품목 저장 실패: '+itemErr.message);
    showToast('견적이 저장되었습니다! ('+currentQuoteNum+')', 'success'); loadHistory();
  } catch(e) {
    console.error('saveQuote 오류:', e);
    showToast('저장 실패: '+e.message, 'error');
    alert('⚠️ 저장 실패\n' + e.message + '\n\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 저장'; }
  }
}

function previewQuote() {
  if (!quoteItems.length) { showToast('견적 품목을 추가하세요', 'error'); return; }
  if (!editingQuoteId) { showToast('💾 먼저 저장 버튼을 눌러주세요', 'error'); return; }
  const co = v=>(document.getElementById(v)||{}).value||'';
  const company = co('f-company')||'(미입력)';
  const contact = co('f-contact'), phone = co('f-phone'), email = co('f-email');
  const salesName = co('f-sales-name'), salesPhone = co('f-sales-phone');
  const salesEmail = co('f-sales-email'), salesDept = co('f-sales-dept');
  const delivery = co('f-delivery'), validity = co('f-validity');
  const memo = co('f-memo');
  const sub = quoteItems.reduce((s,it)=>s+it.total_price,0);
  const discAmt = parseInt(co('discount-amt'))||0;
  const supply = sub - discAmt;
  const vat = Math.round(supply*0.1);
  const total = supply + vat;
  const today = new Date().toLocaleDateString('ko-KR');
  const introHtml = '<a href="https://buneed-estimate.vercel.app/Buneed.pdf" target="_blank" class="q-intro-btn" style="display:inline-block;padding:3px 12px;border:1.5px solid #1B3A6B;border-radius:99px;font-size:11px;color:#1B3A6B;font-weight:600;text-decoration:none;background:#fff;margin-top:4px;">회사소개서</a>';
    const itemsHtml = quoteItems.map((it,i)=>{
    const isLast = i === quoteItems.length - 1;
    const rowBorder = isLast ? '1px solid #1B3A6B' : '1px solid #e8edf5';
    const specText = it.spec_summary ? fmtSpec(it.spec_summary) : '';
    return `
    <tr>
      <td style="text-align:center;width:28px;font-size:11px;color:#64748b;border-bottom:${rowBorder};">${i+1}</td>
      <td style="text-align:center;padding:6px 8px;border-bottom:${rowBorder};min-width:70px;vertical-align:middle;">
        <div style="font-size:10.5px;font-weight:700;color:#1B3A6B;white-space:nowrap;">${it.brand||''}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">${it.category||''}</div>
      </td>
      <td style="min-width:120px;padding:8px 10px;border-bottom:${rowBorder};">
        ${it.info_url ? `<a href="${it.info_url}" target="_blank" style="font-weight:700;font-size:12px;color:#1B3A6B;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;display:inline-flex;align-items:center;gap:0;" class="product-link">${it.product_name}<svg class="product-link-icon" width="10" height="10" viewBox="0 0 12 12" fill="none" style="display:inline;vertical-align:middle;margin-left:3px;flex-shrink:0;"><path d="M5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7" stroke="#1B3A6B" stroke-width="1.5"/><path d="M8 2h2v2M10 2 6 6" stroke="#1B3A6B" stroke-width="1.5" stroke-linecap="round"/></svg></a>` : `<div style="font-weight:700;font-size:12px;color:#1e293b;">${it.product_name}</div>`}
        ${specText ? `<div style="font-size:10.5px;color:#475569;line-height:1.5;margin-top:3px;">${specText}</div>` : ''}
      </td>
      <td style="text-align:right;white-space:nowrap;font-weight:600;font-size:12px;min-width:90px;border-bottom:${rowBorder};">${fmt(it.unit_price)}원</td>
      <td style="text-align:center;font-weight:600;border-bottom:${rowBorder};">${it.qty}</td>
      <td style="text-align:right;font-weight:700;white-space:nowrap;font-size:12px;border-bottom:${rowBorder};">${fmt(it.total_price)}원</td>
    </tr>`;
  }).join('');
  const html = `
  <div class="qdoc">
    <div class="q-header">
      <div style="text-align:left;">
        <h1 style="color:#1B3A6B;font-size:28px;font-weight:800;letter-spacing:0.05em;margin:0 0 8px 0;text-align:left;">구매 견적서</h1>
        <div class="q-header-meta" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;">
          <div class="q-date">견적번호: ${currentQuoteNum}</div>
          <div class="q-date">작성일: ${today}</div>
        </div>
      </div>
      <div class="q-logo-area" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <img src="${LOGO_SRC}" alt="비유니드"><br>
        
        ${introHtml}
      </div>
    </div>
    <div class="q-section">
      
      <div class="q-party-grid">
        <!-- 수신 박스: 연한 파란 배경 + 네이비 헤더바 -->
        <div style="border:1px solid #b8cde8;border-radius:6px;overflow:hidden;">
          <div style="background:#0E76BB;padding:7px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.1em;">수 신</span>
          </div>
          <div style="background:#ffffff;padding:10px 12px;">
            <table style="font-size:12px;width:100%;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:3px 0;width:32%;font-size:11px;">업체명</td><td style="font-weight:700;color:#1e293b;">${company}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">담당자</td><td>${contact||'-'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">연락처</td><td>${phone||'-'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">이메일</td><td>${email||'-'}</td></tr>
            </table>
          </div>
        </div>
        <!-- 공급 박스: 흰 배경 + 네이비 헤더바 -->
        <div style="border:1px solid #b8cde8;border-radius:6px;overflow:hidden;">
          <div style="background:#1B3A6B;padding:7px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.1em;">공 급</span>
          </div>
          <div style="background:#fff;padding:10px 12px;">
            <table style="font-size:12px;width:100%;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:3px 0;width:32%;font-size:11px;">업체명</td><td style="font-weight:700;color:#1e293b;">(주) 비유니드</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">담당자</td><td>${salesName||'-'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">연락처</td><td>${salesPhone||'031.8028.0464'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">이메일</td><td>${salesEmail||'sales@buneed.co.kr'}</td></tr>
            </table>
          </div>
        </div>
      </div>
      <div class="q-info-grid" style="margin-top:12px;">
        <div style="border:1px solid #bcd0ee;border-radius:6px;overflow:hidden;">
          <div style="background:#f1f5f9;padding:5px 10px;">
            <span style="font-size:13px;font-weight:700;color:#1B3A6B;">납품 / 유효 기간</span>
          </div>
          <div style="padding:8px 12px;background:#ffffff;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
              <span style="font-size:12px;color:#64748b;min-width:64px;">납품희망일</span>
              <span style="font-size:12px;font-weight:600;color:#1e293b;">${delivery||'미정'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12px;color:#64748b;min-width:64px;">견적유효기간</span>
              <span style="font-size:12px;font-weight:600;color:#1e293b;">${validity||'견적일로부터 30일'}</span>
            </div>
          </div>
        </div>
        <div style="border:1px solid #bcd0ee;border-radius:6px;overflow:hidden;">
          <div style="background:#f1f5f9;padding:5px 10px;">
            <span style="font-size:13px;font-weight:700;color:#1B3A6B;">특이사항</span>
          </div>
          <div style="padding:8px 12px;background:#ffffff;min-height:60px;">
            <div style="font-size:12px;color:#374151;line-height:1.6;">${memo||''}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="q-section">
      <div class="q-section-title">▪ 견적 내용</div>
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table class="q-table">
        <thead><tr>
          <th style="width:24px;text-align:center;font-size:12px;">No</th>
          <th style="text-align:center;width:65px;font-size:12px;">브랜드</th>
          <th style="text-align:left;min-width:120px;">제품명 / 사양</th>
          <th style="text-align:right;white-space:nowrap;width:75px;font-size:12px;">단가</th>
          <th style="text-align:center;width:52px;white-space:nowrap;">수량</th>
          <th style="text-align:right;white-space:nowrap;min-width:80px;">금액</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      </div>
    </div>
    ${''/* 납품일/유효기간은 위에 표시됨 */}
    <table class="q-summary-table">
      <tr><td>소 계</td><td>${fmt(sub)} 원</td></tr>
      ${discAmt>0?`<tr><td style="color:#ef4444;">할인</td><td style="color:#ef4444;">- ${fmt(discAmt)} 원</td></tr>`:''}
      <tr><td style="font-weight:600;">공급가액</td><td style="font-weight:600;">${fmt(supply)} 원</td></tr>
      <tr><td>부가세 (10%)</td><td>${fmt(vat)} 원</td></tr>
      <tr class="q-total-row"><td>합 계</td><td>${fmt(total)} 원</td></tr>
    </table>

    <div class="q-spacer"></div>
    <div class="q-footer-bar">(주) 비유니드 | 경기도 하남시 미사강변한강로 135 다동 4층 445호 | 031.8028.0464 | www.buneed.co.kr</div>
  </div>`;
  _lastPreviewHtml = html;
  document.getElementById('preview-content').innerHTML = html;
  openModal('modal-preview');
}

function printQuote() {
  const modal = document.getElementById('modal-preview');
  if (!modal || !modal.classList.contains('open')) {
    previewQuote();
    setTimeout(() => window.print(), 500);
    return;
  }
  window.print();
}

/* copyQuoteLink v1 removed – using async v2 */


async function copyQuoteLink(shareToken, quoteNum) {
  if (!shareToken) { showToast('공유 링크가 없습니다', 'error'); return; }
  const url = `${location.origin}/quote-view.html?token=${shareToken}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast(`[${quoteNum}] 링크 복사됨!`, 'success');
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`[${quoteNum}] 링크 복사됨!`, 'success');
  }
}

async function copyHistoryLink() {
  if (!currentShareToken) { showToast('먼저 견적을 불러오세요', 'error'); return; }
  const url = `${location.origin}/quote-view.html?token=${currentShareToken}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('구매 견적 링크 복사됨!', 'success');
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('구매 견적 링크 복사됨!', 'success');
  }
}
async function copyShareLink() {
  if (!editingQuoteId) { showToast('먼저 저장하세요','error'); return; }
  const url = location.origin+'/quote-view.html?token='+currentShareToken;
  await navigator.clipboard.writeText(url);
  showToast('공유 링크가 복사되었습니다 🔗','success');
}
async function mobileShareQuote() {
  if (!editingQuoteId) { showToast('먼저 저장하세요','error'); return; }
  const url = location.origin+'/quote-view.html?token='+currentShareToken;
  if (navigator.share) {
    try { await navigator.share({ title: '구매 견적서', text: '비유니드 구매 견적서를 확인하세요.', url }); }
    catch(e) { if (e.name !== 'AbortError') showToast('공유 실패: '+e.message,'error'); }
  } else {
    await navigator.clipboard.writeText(url);
    showToast('공유 링크가 복사되었습니다 🔗','success');
  }
}


async function loadHistory() {
  const body = document.getElementById('history-body');
  const cardList = document.getElementById('history-card-list');
  if (!body) return;

  const loadingRow = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--muted)">로딩 중...</td></tr>';
  body.innerHTML = loadingRow;
  if (cardList) cardList.innerHTML = '<div class="history-card-loading">로딩 중...</div>';

  try {
    const { data, error } = await db.from('quotes').select('*').order('created_at',{ascending:false});
    if (error) {
      body.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:24px;color:#ef4444">데이터 로드 오류: ${error.message}</td></tr>`;
      if (cardList) cardList.innerHTML = `<div class="history-card-empty">데이터 로드 오류: ${error.message}</div>`;
      return;
    }
    if (!data?.length) {
      body.innerHTML='<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8">저장된 견적이 없습니다</td></tr>';
      if (cardList) cardList.innerHTML = '<div class="history-card-empty">📭 저장된 견적이 없습니다</div>';
      return;
    }

    // ── 테이블 렌더링 (데스크탑) ──
    body.innerHTML = data.map(q=>`
      <tr data-search="${(q.company_name||'').toLowerCase()} ${(q.contact_name||'').toLowerCase()} ${(q.quote_number||'').toLowerCase()}">
        <td style="font-weight:700;color:#1B3A6B;">${q.quote_number}</td>
        <td>${new Date(q.created_at).toLocaleDateString('ko-KR')}</td>
        <td>${q.company_name||''}</td>
        <td>${q.contact_name||''}</td>
        <td style="font-weight:700;">${fmt(q.total)}원</td>
        <td style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="loadQuote('${q.id}')">불러오기</button>
          ${q.share_token?`<button class="btn btn-link-copy btn-sm" onclick="copyQuoteLink('${q.share_token}','${q.quote_number}')">링크복사</button>`:''}
          <button class="btn btn-danger btn-sm" onclick="deleteQuote('${q.id}')">삭제</button>
        </td>
      </tr>`).join('');

    // ── 카드 렌더링 (모바일) ──
    if (cardList) {
      cardList.innerHTML = data.map(q=>`
        <div class="hc-card" data-search="${(q.company_name||'').toLowerCase()} ${(q.contact_name||'').toLowerCase()} ${(q.quote_number||'').toLowerCase()}">
          <div class="hc-card-top">
            <span class="hc-card-num">${q.quote_number||'-'}</span>
            <span class="hc-card-date">${new Date(q.created_at).toLocaleDateString('ko-KR')}</span>
          </div>
          <div class="hc-card-body">
            <div class="hc-card-company">${q.company_name||'(고객사 미입력)'}</div>
            <div class="hc-card-contact">${q.contact_name||''}${q.contact_tel?' · '+q.contact_tel:''}</div>
          </div>
          <div class="hc-card-footer">
            <span class="hc-card-total">₩ ${fmt(q.total)}원</span>
            <div class="hc-card-actions">
              ${q.share_token?`<button class="btn btn-link-copy btn-sm" onclick="copyQuoteLink('${q.share_token}','${q.quote_number}')">🔗</button>`:''}
              <button class="btn btn-secondary btn-sm" onclick="loadQuote('${q.id}')">불러오기</button>
              <button class="btn btn-danger btn-sm" onclick="deleteQuote('${q.id}')">🗑</button>
            </div>
          </div>
        </div>`).join('');
    }

  } catch(e) {
    if (body) body.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:24px;color:#ef4444">오류: ${e.message}</td></tr>`;
    if (cardList) cardList.innerHTML = `<div class="history-card-empty">오류: ${e.message}</div>`;
  }
}

async function loadQuote(qId) {
  const { data: q } = await db.from('quotes').select('*').eq('id',qId).single();
  const { data: items } = await db.from('quote_items').select('*').eq('quote_id',qId).order('sort_order');
  if (!q) return;
  editingQuoteId = qId; currentShareToken = q.share_token; currentQuoteNum = q.quote_number;
  const setV = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
  setV('f-company',q.company_name); setV('f-contact',q.contact_name);
  setV('f-phone',q.contact_tel); setV('f-email',q.contact_email);
  setV('f-delivery',q.delivery_date); setV('f-validity',q.valid_until||'견적일로부터 30일');
  setV('f-memo',q.memo);
  setV('f-sales-name',q.sales_name); setV('f-sales-phone',q.sales_phone);
  setV('f-sales-email',q.sales_email); setV('f-sales-dept',q.sales_dept);
  quoteItems = (items||[]).map(i=>Object.assign({},i));
  renderQuoteItems(); calcPrice();
  // 구매견적 탭으로 이동
  switchTopTab('purchase', document.getElementById('ttab-purchase'));
  document.querySelectorAll('#panel-purchase .sub-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  document.querySelectorAll('#panel-purchase .sub-panel').forEach((p,i)=>p.classList.toggle('active',i===0));
  showToast('견적을 불러왔습니다', 'success');
}

async function deleteQuote(qId) {
  if (!confirm('견적을 삭제하시겠습니까?')) return;
  await db.from('quote_items').delete().eq('quote_id',qId);
  await db.from('quotes').delete().eq('id',qId);
  showToast('삭제되었습니다','success'); loadHistory();
}

function resetQuote() {
  if (!confirm('견적을 초기화하시겠습니까?')) return;
  quoteItems=[]; editingQuoteId=null; currentShareToken=null;
  renderQuoteItems(); calcPrice();
  ['f-company','f-contact','f-phone','f-email','f-delivery','f-memo'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('f-validity').value='견적일로부터 30일';
  document.getElementById('discount-rate').value=0;
  document.getElementById('discount-amt').value=0;
  initQuoteNum();
  showToast('초기화되었습니다','success');
}

// 구매 제품 관리

async function bulkInsertSampleProducts() {
  if (!confirm('엑셀 기반 샘플 제품 ' + SAMPLE_PRODUCTS.length + '개를 DB에 등록하시겠습니까?\n기존 데이터와 중복될 수 있습니다.')) return;
  showToast('제품 등록 중...', 'info');
  let ok = 0, fail = 0;
  for (const p of SAMPLE_PRODUCTS) {
    const { error } = await db.from('products').insert({
      name: p.name, brand: p.brand, category: p.category,
      spec_summary: p.spec_summary, base_price: 0,
      daily_price: 0, monthly_price: 0, is_active: true
    });
    if (error) fail++; else ok++;
  }
  showToast('등록 완료: 성공 ' + ok + '개 / 실패 ' + fail + '개', ok > 0 ? 'success' : 'error');
  renderAdminProducts(true);
  loadProducts();
  if (typeof rLoadProducts === 'function') rLoadProducts(); else if (typeof rRenderProducts === 'function') { rProducts = SAMPLE_PRODUCTS.map((p,i)=>({...p,id:i+1})); rRenderProducts(); }
}

async function renderAdminProducts(forceRefresh = false) {
  const body = document.getElementById('admin-product-body');
  if (!body) return;
  // 로딩 표시
  body.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#94a3b8">로딩 중...</td></tr>';
  try {
    let data;
    if (!forceRefresh && products && products.length > 0) {
      // 이미 loadProducts()가 가져온 전역 데이터 재사용 → DB 중복 쿼리 없음
      data = [...products].sort((a,b) => (a.category||'').localeCompare(b.category||'', 'ko'));
    } else {
      const res = await db.from('products').select('*').order('category');
      if (res.error) { body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:20px;color:#ef4444">⚠️ 목록 로드 실패: '+res.error.message+'</td></tr>'; return; }
      data = res.data;
      if (data) products = data; // 전역 갱신
    }
    if (!data?.length) { body.innerHTML='<tr><td colspan="9" style="text-align:center;padding:20px;color:#94a3b8">등록된 제품이 없습니다</td></tr>'; return; }
    body.innerHTML = data.map(p=>`
      <tr>
        <td style="text-align:center;"><input type="checkbox" class="p-row-check" data-id="${p.id}" onchange="pCheckChange()" style="width:15px;height:15px;cursor:pointer;"></td>
        <td>${p.category}</td>
        <td>${p.brand}</td>
        <td style="font-weight:600;">${p.name}</td>
        <td style="font-size:11px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.spec_summary||''}</td>
        <td style="text-align:center;font-size:13px;">${p.info_url ? '✅' : ''}</td>
        <td style="text-align:right;font-weight:600;">${fmt(p.base_price)}원</td>
        <td style="display:flex;gap:5px;">
          <button class="btn btn-secondary btn-sm" onclick="openProductModal('${p.id}')">수정</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')">삭제</button>
        </td>
      </tr>`).join('');
  } catch(e) {
    console.error('renderAdminProducts 오류:', e);
    if (body) body.innerHTML='<tr><td colspan="8" style="text-align:center;color:#ef4444">오류 발생: '+e.message+'</td></tr>';
  }
}

// 관리자 구매 제품 검색 필터

// ===== 견적 이력 검색 =====
function filterHistory() {
  const q = (document.getElementById('p-history-search')?.value||'').toLowerCase().trim();
  // 테이블 행 필터
  const rows = document.querySelectorAll('#history-body tr');
  rows.forEach(row => {
    const text = (row.dataset.search || row.textContent).toLowerCase();
    row.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
  // 카드 필터
  const cards = document.querySelectorAll('#history-card-list .hc-card');
  cards.forEach(card => {
    const text = (card.dataset.search || card.textContent).toLowerCase();
    card.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
}

function filterAdminProducts() {
  const q = (document.getElementById('admin-product-search')?.value||'').toLowerCase();
  document.querySelectorAll('#admin-product-body tr').forEach(tr=>{
    const text = tr.textContent.toLowerCase();
    tr.style.display = !q || text.includes(q) ? '' : 'none';
  });
}
let editingProductId = null;
function openProductModal(pid) {
  editingProductId = pid || null;
  document.getElementById('pm-title').textContent = pid ? '구매 제품 수정' : '구매 제품 추가';
  if (pid) {
    const p = products.find(x=>String(x.id)===String(pid)) || {};
    document.getElementById('pm-name').value = p.name||'';
    document.getElementById('pm-brand').value = p.brand||'HP';
    document.getElementById('pm-category').value = p.category||'노트북';
    document.getElementById('pm-price').value = p.base_price||'';
    document.getElementById('pm-spec').value = p.spec_summary||'';
    const pmFeature = document.getElementById('pm-feature'); if(pmFeature) pmFeature.value = p.feature||'';
    const pmInfoUrl = document.getElementById('pm-info-url'); if(pmInfoUrl) pmInfoUrl.value = p.info_url||'';
  } else {
    ['pm-name','pm-price','pm-spec'].forEach(id=>{document.getElementById(id).value='';});
    const pmInfoUrl = document.getElementById('pm-info-url'); if(pmInfoUrl) pmInfoUrl.value='';
  }
  openModal('modal-product');
}
// ── localStorage 제품 캐시 무효화 ──
function invalidateProductCache() {
  try {
    localStorage.removeItem('buneed_products_v1'); // 구 버전 정리
    localStorage.removeItem('buneed_products_v2');
  } catch(e) {}
}
async function saveProduct() {
  const name = document.getElementById('pm-name').value.trim();
  if (!name) { showToast('제품명을 입력하세요','error'); return; }
  const payload = {
    name, brand: document.getElementById('pm-brand').value,
    category: document.getElementById('pm-category').value,
    base_price: parseInt(document.getElementById('pm-price').value)||0,
    spec_summary: document.getElementById('pm-spec').value,
    feature: document.getElementById('pm-feature')?.value || '',
    info_url: document.getElementById('pm-info-url')?.value.trim() || null,
    is_active: true
  };
  try {
    let error;
    if (editingProductId) {
      ({ error } = await db.from('products').update(payload).eq('id', editingProductId));
    } else {
      ({ error } = await db.from('products').insert(payload));
    }
    if (error) throw new Error(error.message);
    closeModal('modal-product');
    invalidateProductCache(); await loadProducts(); renderAdminProducts(true); renderProducts();
    showToast('저장되었습니다','success');
  } catch(e) {
    console.error('saveProduct 오류:', e);
    showToast('⚠️ 저장 실패: ' + (e.message||e), 'error');
    alert('⚠️ 제품 저장 실패\n' + (e.message||e) + '\n\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.');
  }
}
async function deleteProduct(pid) {
  if (!confirm('제품을 삭제하시겠습니까?')) return;
  const { error } = await db.from('products').delete().eq('id',pid);
  if (error) { showToast('⚠️ 삭제 실패: ' + error.message, 'error'); return; }
  invalidateProductCache(); await loadProducts(); renderAdminProducts(true); renderProducts();
  showToast('삭제되었습니다','success');
}

// ===== 구매 제품 체크박스 일괄 삭제 =====
function pToggleAll(cb) {
  document.querySelectorAll('.p-row-check').forEach(c => c.checked = cb.checked);
  pCheckChange();
}
function pCheckChange() {
  const checked = document.querySelectorAll('.p-row-check:checked');
  const btn = document.getElementById('p-bulk-del-btn');
  if (btn) btn.style.display = checked.length > 0 ? '' : 'none';
  const all = document.querySelectorAll('.p-row-check');
  const allCb = document.getElementById('p-check-all');
  if (allCb) allCb.indeterminate = checked.length > 0 && checked.length < all.length;
  if (allCb && checked.length === all.length && all.length > 0) allCb.checked = true;
  if (allCb && checked.length === 0) allCb.checked = false;
}
async function pBulkDelete() {
  const checked = [...document.querySelectorAll('.p-row-check:checked')];
  if (!checked.length) return;
  if (!confirm(`선택한 ${checked.length}개 구매 제품을 삭제하시겠습니까?`)) return;
  const ids = checked.map(c => c.dataset.id);
  const { error } = await db.from('products').delete().in('id', ids);
  if (error) { showToast('삭제 오류: ' + error.message, 'error'); return; }
  showToast(`${ids.length}개 제품이 삭제되었습니다`, 'success');
  invalidateProductCache(); await loadProducts(); renderAdminProducts(true); renderProducts();
  document.getElementById('p-check-all').checked = false;
  const btn = document.getElementById('p-bulk-del-btn');
  if (btn) btn.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════
//  ■ 스펙 관리 (C. 관리자 스펙 관리 탭)
// ══════════════════════════════════════════════════════════════════
let editingSpecCatId = null;
let editingSpecOptId = null;
let adminSpecCatFilter = null; // 현재 선택된 스펙 카테고리 ID

async function renderSpecAdmin() {
  await loadSpecCategories();
  await loadSpecOptions();
  renderSpecCategoryList();
  renderSpecOptionList(null);
}

function renderSpecCategoryList() {
  const el = document.getElementById('spec-cat-list');
  if (!el) return;
  if (!specCategories.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">등록된 스펙 항목이 없습니다</div>';
    return;
  }
  el.innerHTML = specCategories.map(c => `
    <div class="spec-cat-item ${adminSpecCatFilter===c.id?'active':''}" onclick="selectSpecCat('${c.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-weight:600;font-size:13px;">${c.name}</span>
          <span style="font-size:10px;color:#94a3b8;margin-left:6px;">순서:${c.sort_order||0}</span>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn btn-sm btn-secondary" style="padding:2px 8px;font-size:11px;" onclick="event.stopPropagation();openSpecCatModal('${c.id}')">수정</button>
          <button class="btn btn-sm btn-danger" style="padding:2px 8px;font-size:11px;" onclick="event.stopPropagation();deleteSpecCat('${c.id}')">삭제</button>
        </div>
      </div>
      <div style="font-size:10px;color:#64748b;margin-top:3px;">
        적용: ${c.product_categories?.length ? c.product_categories.join(', ') : '전체'}
      </div>
    </div>`).join('');
}

function selectSpecCat(catId) {
  adminSpecCatFilter = catId;
  renderSpecCategoryList();
  renderSpecOptionList(catId);
}

function renderSpecOptionList(catId) {
  const el = document.getElementById('spec-opt-list');
  const headerEl = document.getElementById('spec-opt-header');
  if (!el) return;
  const cat = specCategories.find(c => String(c.id) === String(catId));
  if (headerEl) headerEl.textContent = cat ? `옵션 목록 — ${cat.name}` : '스펙 옵션 목록';
  const opts = catId ? specOptions.filter(o => String(o.spec_category_id) === String(catId)) : specOptions;
  if (!opts.length) {
    el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:12px;">'+(catId?'해당 항목에 옵션이 없습니다':'좌측에서 스펙 항목을 선택하세요')+'</div>';
    return;
  }
  el.innerHTML = `<table class="data-table" style="font-size:12px;"><thead><tr><th>옵션명</th><th style="text-align:right;">추가 금액</th><th style="text-align:center;">순서</th><th>관리</th></tr></thead><tbody>
    ${opts.map(o=>`<tr>
      <td style="font-weight:600;">${o.name}</td>
      <td style="text-align:right;">${o.price_delta?'+'+fmt(o.price_delta)+' 원':'포함'}</td>
      <td style="text-align:center;">${o.sort_order||0}</td>
      <td style="display:flex;gap:4px;">
        <button class="btn btn-sm btn-secondary" style="font-size:11px;" onclick="openSpecOptModal('${o.id}')">수정</button>
        <button class="btn btn-sm btn-danger" style="font-size:11px;" onclick="deleteSpecOpt('${o.id}')">삭제</button>
      </td>
    </tr>`).join('')}
  </tbody></table>`;
}

// ── 스펙 카테고리 모달 ──
function openSpecCatModal(id) {
  editingSpecCatId = id || null;
  const cat = id ? specCategories.find(c => String(c.id) === String(id)) : null;
  document.getElementById('sc-modal-title').textContent = id ? '스펙 항목 수정' : '스펙 항목 추가';
  document.getElementById('sc-name').value = cat?.name || '';
  document.getElementById('sc-sort').value = cat?.sort_order ?? (specCategories.length);
  // 적용 카테고리 체크박스 초기화
  const applied = cat?.product_categories || [];
  document.querySelectorAll('.sc-cat-check').forEach(cb => {
    cb.checked = applied.includes(cb.value);
  });
  openModal('modal-spec-cat');
}

async function saveSpecCat() {
  const name = document.getElementById('sc-name').value.trim();
  if (!name) { showToast('항목 이름을 입력하세요', 'error'); return; }
  const product_categories = [...document.querySelectorAll('.sc-cat-check:checked')].map(cb => cb.value);
  const sort_order = parseInt(document.getElementById('sc-sort').value) || 0;
  const payload = { name, sort_order, product_categories };
  try {
    let error;
    if (editingSpecCatId) {
      ({ error } = await db.from('spec_categories').update(payload).eq('id', editingSpecCatId));
    } else {
      ({ error } = await db.from('spec_categories').insert(payload));
    }
    if (error) throw new Error(error.message);
    closeModal('modal-spec-cat');
    await loadSpecCategories(); await loadSpecOptions();
    renderSpecCategoryList();
    renderSpecOptionList(adminSpecCatFilter);
    showToast('저장되었습니다', 'success');
  } catch(e) { showToast('저장 실패: ' + e.message, 'error'); }
}

async function deleteSpecCat(id) {
  if (!confirm('스펙 항목과 해당 옵션이 모두 삭제됩니다. 계속하시겠습니까?')) return;
  await db.from('spec_options').delete().eq('spec_category_id', id);
  const { error } = await db.from('spec_categories').delete().eq('id', id);
  if (error) { showToast('삭제 실패: ' + error.message, 'error'); return; }
  if (adminSpecCatFilter === id) adminSpecCatFilter = null;
  await loadSpecCategories(); await loadSpecOptions();
  renderSpecCategoryList();
  renderSpecOptionList(adminSpecCatFilter);
  showToast('삭제되었습니다', 'success');
}

// ── 스펙 옵션 모달 ──
function openSpecOptModal(id) {
  editingSpecOptId = id || null;
  const opt = id ? specOptions.find(o => String(o.id) === String(id)) : null;
  document.getElementById('so-modal-title').textContent = id ? '스펙 옵션 수정' : '스펙 옵션 추가';
  document.getElementById('so-name').value = opt?.name || '';
  document.getElementById('so-price').value = opt?.price_delta ?? 0;
  document.getElementById('so-sort').value = opt?.sort_order ?? 0;
  // 카테고리 셀렉트 채우기
  const sel = document.getElementById('so-cat-select');
  if (sel) {
    sel.innerHTML = specCategories.map(c => `<option value="${c.id}" ${(opt?.spec_category_id===c.id||(!opt&&adminSpecCatFilter===c.id))?'selected':''}>${c.name}</option>`).join('');
  }
  openModal('modal-spec-opt');
}

async function saveSpecOpt() {
  const name = document.getElementById('so-name').value.trim();
  if (!name) { showToast('옵션 이름을 입력하세요', 'error'); return; }
  const spec_category_id = document.getElementById('so-cat-select').value;
  if (!spec_category_id) { showToast('스펙 항목을 선택하세요', 'error'); return; }
  const price_delta = parseInt(document.getElementById('so-price').value) || 0;
  const sort_order = parseInt(document.getElementById('so-sort').value) || 0;
  const payload = { name, spec_category_id, price_delta, sort_order };
  try {
    let error;
    if (editingSpecOptId) {
      ({ error } = await db.from('spec_options').update(payload).eq('id', editingSpecOptId));
    } else {
      ({ error } = await db.from('spec_options').insert(payload));
    }
    if (error) throw new Error(error.message);
    closeModal('modal-spec-opt');
    await loadSpecCategories(); await loadSpecOptions();
    renderSpecCategoryList();
    renderSpecOptionList(adminSpecCatFilter);
    showToast('저장되었습니다', 'success');
  } catch(e) { showToast('저장 실패: ' + e.message, 'error'); }
}

async function deleteSpecOpt(id) {
  if (!confirm('옵션을 삭제하시겠습니까?')) return;
  const { error } = await db.from('spec_options').delete().eq('id', id);
  if (error) { showToast('삭제 실패: ' + error.message, 'error'); return; }
  await loadSpecCategories(); await loadSpecOptions();
  renderSpecOptionList(adminSpecCatFilter);
  showToast('삭제되었습니다', 'success');
}
