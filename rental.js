// ===== 렌탈 견적 함수 =====

// PC 카테고리 (스펙 드롭다운 표시 대상) - purchase.js의 PC_CATEGORIES와 동일
const RENTAL_PC_CATEGORIES = ['노트북', '데스크탑', '워크스테이션', '모바일워크스테이션'];

// 렌탈 모달에서 선택된 스펙 옵션 저장
let rSelectedSpecOpts = {}; // { catId: optId }


async function rCopyHistoryLink() {
  if (!rCurrentShareToken) { showToast('먼저 견적을 불러오세요', 'error'); return; }
  const url = `${location.origin}/quote-view.html?token=${rCurrentShareToken}&type=rental`;
  try {
    await navigator.clipboard.writeText(url);
    showToast('렌탈 견적 링크 복사됨!', 'success');
  } catch(e) {
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('렌탈 견적 링크 복사됨!', 'success');
  }
}

async function rMobileShareQuote() {
  if (!rCurrentQuoteId) { showToast('먼저 저장하세요','error'); return; }
  const url = location.origin+'/quote-view.html?token='+rCurrentShareToken+'&type=rental';
  if (navigator.share) {
    try { await navigator.share({ title: '렌탈 견적서', text: '비유니드 렌탈 견적서를 확인하세요.', url }); }
    catch(e) { if (e.name !== 'AbortError') showToast('공유 실패: '+e.message,'error'); }
  } else {
    await navigator.clipboard.writeText(url);
    showToast('렌탈 공유 링크가 복사되었습니다 🔗','success');
  }
}

function rFilterHistory() {
  const q = (document.getElementById('r-history-search')?.value||'').toLowerCase().trim();
  // 테이블 행 필터
  const rows = document.querySelectorAll('#r-history-body tr');
  rows.forEach(row => {
    const text = (row.dataset.search || row.textContent).toLowerCase();
    row.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
  // 카드 필터
  const cards = document.querySelectorAll('#r-history-card-list .hc-card');
  cards.forEach(card => {
    const text = (card.dataset.search || card.textContent).toLowerCase();
    card.style.display = (!q || text.includes(q)) ? '' : 'none';
  });
}

// 관리자 렌탈 제품 검색 필터
function rFilterAdminProducts() {
  const q = (document.getElementById('r-admin-product-search')?.value||'').toLowerCase();
  document.querySelectorAll('#r-admin-product-body tr').forEach(tr=>{
    const text = tr.textContent.toLowerCase();
    tr.style.display = !q || text.includes(q) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════════
//  ■ 렌탈견적 시스템
// ══════════════════════════════════════════════════════════════════
let rProducts = [];
let rQuoteItems = [];
let rCurrentType = '일'; // '일' or '월'
let rCurrentQuoteId = null;
let rCurrentShareToken = null;
let rCurrentProductId = null;
let rAtqType = '일';
let rEditingProductId = null;
let rCurrentFilterCat = '';

function rInitQuoteNum() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const num = 'R'+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'-'+pad(now.getHours())+pad(now.getMinutes());
  const el = document.getElementById('r-quote-num');
  if (el) el.value = num;
  return num;
}

async function rLoadRentalProducts() {
  // ── [1단계] localStorage 캐시 → 즉시 표시 (stale-while-revalidate) ──
  let hasCacheHit = false;
  try {
    const cached = localStorage.getItem('buneed_rental_products_v1');
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (data && data.length > 0) {
        rProducts = data;
        hasCacheHit = true;
        if (Date.now() - ts < 30 * 60 * 1000) return; // TTL 30분 이내: DB 생략
      }
    }
  } catch(e) {}

  // ── [2단계] DB 쿼리 ──
  try {
    const { data, error } = await db.from('rental_products').select('id,category,brand,name,spec_summary,feature,daily_price,monthly_price,rental_type,info_url,is_active').eq('is_active',true).order('category');
    if (error || !data || data.length === 0) {
      if (!hasCacheHit) {
        rProducts = (typeof RENTAL_SAMPLE_PRODUCTS !== 'undefined') ? RENTAL_SAMPLE_PRODUCTS.map((p,i)=>({...p,id:i+1})) : [];
      }
    } else {
      rProducts = data;
      try { localStorage.setItem('buneed_rental_products_v1', JSON.stringify({ data: rProducts, ts: Date.now() })); } catch(e) {}
    }
  } catch(e) {
    if (!hasCacheHit) {
      rProducts = (typeof RENTAL_SAMPLE_PRODUCTS !== 'undefined') ? RENTAL_SAMPLE_PRODUCTS.map((p,i)=>({...p,id:i+1})) : [];
    }
  }
}

let rCurrentFilterBrand = '';
function rFilterCat() {
  rCurrentFilterCat = document.getElementById('r-f-cat').value;
  const brandEl = document.getElementById('r-f-brand');
  rCurrentFilterBrand = brandEl ? brandEl.value : '';
  rRenderProductList();
}


// rRenderProducts → rRenderProductList alias (호환성)
function rRenderProducts() {
  if (typeof rRenderProductList === 'function') rRenderProductList();
}
function rRenderProductList() {
  let list = rProducts;
  if (rCurrentFilterCat) list = list.filter(p=>p.category===rCurrentFilterCat);
  if (typeof rCurrentFilterBrand !== 'undefined' && rCurrentFilterBrand) list = list.filter(p=>(p.brand||'')===(rCurrentFilterBrand));
  const el = document.getElementById('r-product-list');
  if (!list.length) { el.innerHTML='<div class="no-products">제품 없음</div>'; return; }
  el.innerHTML = list.map(p=>`
    <div class="product-card r-card" onclick="rOpenAtqModal('${p.id}')">
      <div class="pc-name">${p.name}</div>
      <div class="pc-brand">${p.category||''} · ${p.brand||''}</div>
      <div class="pc-price">일 ${fmt(p.daily_price||0)} / 월 ${fmt(p.monthly_price||0)}원</div>
    </div>`).join('');
}

function rOpenAtqModal(pid) {
  const p = rProducts.find(x=>String(x.id)===String(pid));
  if (!p) return;
  rCurrentProductId = pid;
  rAtqType = rCurrentType;
  rSelectedSpecOpts = {};

  document.getElementById('r-atq-title').textContent = '제품 상세';
  document.getElementById('r-atq-info').innerHTML = `
    <div class="atq-name" style="color:var(--r-primary);">${p.name}${p.info_url?'<span style="display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;margin-left:5px;vertical-align:super;flex-shrink:0;" title="이미지/링크 있음"></span>':''}</div>
    <div class="atq-meta" style="color:var(--r-blue);">
      ${p.category?`<span>${p.category}</span>`:''}
      ${p.brand?`<span style="color:#94a3b8;">|</span><span>${p.brand}</span>`:''}
      ${p.daily_price?`<span style="color:#94a3b8;">|</span><span style="color:var(--r-primary);font-weight:700;">일 ${fmt(p.daily_price)}원</span>`:''}
      ${p.monthly_price?`<span style="color:#94a3b8;">/</span><span style="color:var(--r-primary);font-weight:700;">월 ${fmt(p.monthly_price)}원</span>`:''}
    </div>
    ${p.spec||p.spec_summary?`<div class="atq-spec" style="background:rgba(255,255,255,0.7);">${p.spec||p.spec_summary}</div>`:''}
    ${p.feature?`<div class="atq-feature">${p.feature}</div>`:''}
  `;

  // 스펙 드롭다운: PC 카테고리만 표시
  const isPC = RENTAL_PC_CATEGORIES.includes(p.category);
  const _specCats = (typeof specCategories !== 'undefined') ? specCategories : [];
  const _specOpts = (typeof specOptions !== 'undefined') ? specOptions : [];
  const cats = isPC
    ? _specCats.filter(c => !c.product_categories?.length || c.product_categories.includes(p.category))
    : [];

  let specDdHtml = '';
  if (isPC && cats.length > 0) {
    specDdHtml = '<div class="spec-dropdown-section r-spec-dd">';
    for (const cat of cats) {
      const opts = _specOpts.filter(o => o.spec_category_id === cat.id);
      if (!opts.length) continue;
      specDdHtml += `
        <div class="spec-dd-row">
          <label class="spec-dd-label">${cat.name}</label>
          <select class="spec-dd-select field-input r-field-input" data-cat-id="${cat.id}" onchange="rOnSpecDropdownChange('${cat.id}',this.value)">
            <option value="">— 선택 안 함 —</option>
            ${opts.map(o=>`<option value="${o.id}" data-price="${o.price_delta||0}">${o.name}${o.price_delta?` (+${fmt(o.price_delta)}원)`:' (포함)'}</option>`).join('')}
          </select>
        </div>`;
    }
    specDdHtml += '</div>';
  }
  const specDdEl = document.getElementById('r-atq-spec-opts');
  if (specDdEl) specDdEl.innerHTML = specDdHtml;

  document.getElementById('r-atq-daily-btn').classList.toggle('active', rAtqType==='일');
  document.getElementById('r-atq-monthly-btn').classList.toggle('active', rAtqType==='월');

  // 기본 단가 저장 (hidden)
  const rBasePriceEl = document.getElementById('r-atq-base-price');
  const baseUnit = rAtqType==='일' ? (p.daily_price||0) : (p.monthly_price||0);
  if (rBasePriceEl) rBasePriceEl.value = baseUnit;
  document.getElementById('r-atq-unit').value = baseUnit;
  document.getElementById('r-atq-qty').value = 1;
  document.getElementById('r-atq-duration').value = 1;
  // 기간 레이블 초기화
  const durLbl2 = document.getElementById('r-atq-duration-label');
  if (durLbl2) durLbl2.innerHTML = rAtqType==='일' ? '기간 <span style="font-size:10px;color:#94a3b8;font-weight:400;">(일)</span>' : '기간 <span style="font-size:10px;color:#94a3b8;font-weight:400;">(개월)</span>';
  rUpdateAtqCalc();
  openModal('r-modal-atq');
}

// 렌탈 스펙 드롭다운 변경
function rOnSpecDropdownChange(catId, optId) {
  if (optId) {
    rSelectedSpecOpts[catId] = optId;
  } else {
    delete rSelectedSpecOpts[catId];
  }
  rRecalcAtqPrice();
}

// 기본 단가 + 선택 스펙 합계로 렌탈 단가 재계산
function rRecalcAtqPrice() {
  const rBasePriceEl = document.getElementById('r-atq-base-price');
  const base = parseInt(rBasePriceEl ? rBasePriceEl.value : document.getElementById('r-atq-unit').value) || 0;
  const _specOpts = (typeof specOptions !== 'undefined') ? specOptions : [];
  let extra = 0;
  for (const optId of Object.values(rSelectedSpecOpts)) {
    const opt = _specOpts.find(o => String(o.id) === String(optId));
    if (opt) extra += (opt.price_delta || 0);
  }
  document.getElementById('r-atq-unit').value = base + extra;
  rUpdateAtqCalc();
}

function rSetAtqType(type) {
  rAtqType = type;
  document.getElementById('r-atq-daily-btn').classList.toggle('active', type==='일');
  document.getElementById('r-atq-monthly-btn').classList.toggle('active', type==='월');
  // 기간 레이블 동적 변경
  const durLbl = document.getElementById('r-atq-duration-label');
  if (durLbl) durLbl.innerHTML = type==='일' ? '기간 <span style="font-size:10px;color:#94a3b8;font-weight:400;">(일)</span>' : '기간 <span style="font-size:10px;color:#94a3b8;font-weight:400;">(개월)</span>';
  const p = rProducts.find(x=>String(x.id)===String(rCurrentProductId));
  if (p) {
    const baseUnit = type==='일'?(p.daily_price||0):(p.monthly_price||0);
    const rBasePriceEl = document.getElementById('r-atq-base-price');
    if (rBasePriceEl) rBasePriceEl.value = baseUnit;
    // 스펙 추가금 재적용
    const _specOpts = (typeof specOptions !== 'undefined') ? specOptions : [];
    let extra = 0;
    for (const optId of Object.values(rSelectedSpecOpts)) {
      const opt = _specOpts.find(o => String(o.id) === String(optId));
      if (opt) extra += (opt.price_delta || 0);
    }
    document.getElementById('r-atq-unit').value = baseUnit + extra;
  }
  rUpdateAtqCalc();
}
function rUpdateAtqCalc() {
  const unit = parseInt(document.getElementById('r-atq-unit').value)||0;
  const qty = parseInt(document.getElementById('r-atq-qty').value)||1;
  const dur = parseInt(document.getElementById('r-atq-duration').value)||1;
  const total = unit * qty * dur;
  const typeLabel = rAtqType === '일' ? '일' : '개월';
  document.getElementById('r-atq-total-val').textContent = fmt(total)+' 원';
  // 계산식 힌트 표시
  const hint = document.getElementById('r-atq-calc-hint');
  if (hint) hint.textContent = `${fmt(unit)}원 × ${qty}개 × ${dur}${typeLabel}`;
}

function rAddToQuote() {
  const p = rProducts.find(x=>String(x.id)===String(rCurrentProductId));
  if (!p) return;
  const unit = parseInt(document.getElementById('r-atq-unit').value)||0;
  const qty = parseInt(document.getElementById('r-atq-qty').value)||1;
  const dur = parseInt(document.getElementById('r-atq-duration').value)||1;

  // 스펙 요약: 선택한 옵션 이름만 / 구분자로 연결, 없으면 기존 spec 그대로
  const _specOpts = (typeof specOptions !== 'undefined') ? specOptions : [];
  const selectedOptNames = Object.values(rSelectedSpecOpts)
    .map(id => _specOpts.find(o => String(o.id) === String(id))?.name)
    .filter(Boolean);
  const productSpec = selectedOptNames.length > 0
    ? selectedOptNames.join(' / ')
    : (p.spec || p.spec_summary || '');

  rQuoteItems.push({
    product_id: p.id, product_name: p.name, product_spec: productSpec, brand: p.brand||'', category: p.category||'',
    rental_type: rAtqType, unit_price: unit, quantity: qty, item_duration: dur,
    total_price: unit * qty * dur,
    info_url: p.info_url || null
  });
  rRenderQuoteItems(); rCalcPrice(); closeModal('r-modal-atq');
  showToast(p.name+' 추가됨','success');
}

function rRenderQuoteItems() {
  const el = document.getElementById('r-quote-items-area');
  if (!rQuoteItems.length) {
    el.innerHTML='<div class="no-products" style="padding:16px 0">좌측 카탈로그에서 제품을 클릭하여 추가하세요</div>';
    return;
  }
  el.innerHTML = `<table class="items-table"><thead><tr><th style="width:70px;">브랜드</th><th>제품명 / 사양</th><th style="text-align:center;width:50px;">단위</th><th style="text-align:right;min-width:90px;">단가</th><th style="text-align:center;min-width:130px;">수량 / 기간</th><th></th></tr></thead><tbody>
    ${rQuoteItems.map((it,i)=>`<tr>
      <td style="text-align:center;vertical-align:middle;padding:6px 4px;">
        <div style="font-size:10.5px;font-weight:700;color:#1B3A6B;white-space:nowrap;">${it.brand||''}</div>
        <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${it.category||''}</div>
      </td>
      <td><strong>${it.product_name}</strong>${it.product_spec?`<div style="font-size:10px;color:#64748b;margin-top:2px;line-height:1.4;">${fmtSpec(it.product_spec)}</div>`:''}​</td>
      <td><span class="badge ${it.rental_type==='일'?'badge-daily':'badge-monthly'}">${it.rental_type}</span></td>
      <td style="text-align:right;font-size:12px;">${fmt(it.unit_price)}원</td>
      <td style="text-align:center;min-width:120px;">
        <div style="display:flex;flex-direction:column;gap:4px;align-items:center;">
          <div style="display:flex;align-items:center;gap:2px;">
            <span style="font-size:10px;color:#94a3b8;">수량</span>
            <div class="qty-stepper" style="margin:0 2px;">
              <button class="qty-btn" onclick="rChangeQty(${i},${it.quantity}-1)">−</button>
              <span class="qty-display">${it.quantity}</span>
              <button class="qty-btn" onclick="rChangeQty(${i},${it.quantity}+1)">+</button>
            </div>
            <span style="font-size:10px;color:#94a3b8;">개</span>
          </div>
          <div style="display:flex;align-items:center;gap:2px;">
            <span style="font-size:10px;color:#94a3b8;">기간</span>
            <div class="qty-stepper" style="margin:0 2px;">
              <button class="qty-btn" onclick="rChangeDuration(${i},(${it.item_duration||1})-1)">−</button>
              <span class="qty-display">${it.item_duration||1}</span>
              <button class="qty-btn" onclick="rChangeDuration(${i},(${it.item_duration||1})+1)">+</button>
            </div>
            <span style="font-size:10px;color:#94a3b8;">${it.rental_type==='일'?'일':'개월'}</span>
          </div>
        </div>
      </td>
      <td><button class="btn-rm" onclick="rRemoveItem(${i})">✕</button></td>
    </tr>`).join('')}
    </tbody></table>`;
}
function rChangeQty(i,v) {
  rQuoteItems[i].quantity = parseInt(v)||1;
  rQuoteItems[i].total_price = rQuoteItems[i].unit_price * rQuoteItems[i].quantity * (rQuoteItems[i].item_duration||1);
  rRenderQuoteItems(); rCalcPrice();
}
function rChangeDuration(i,v) {
  rQuoteItems[i].item_duration = Math.max(1, parseInt(v)||1);
  rQuoteItems[i].total_price = rQuoteItems[i].unit_price * rQuoteItems[i].quantity * rQuoteItems[i].item_duration;
  rRenderQuoteItems(); rCalcPrice();
}
function rRemoveItem(i) { rQuoteItems.splice(i,1); rRenderQuoteItems(); rCalcPrice(); }

function rCalcPriceByRate() {
  const sub = rQuoteItems.reduce((s,i)=>s+i.total_price,0);
  const rate = parseFloat(document.getElementById('r-discount-rate').value)||0;
  const discAmt = Math.round(sub*rate/100);
  document.getElementById('r-discount').value = discAmt;
  rCalcPrice();
}
function rCalcPrice() {
  const sub = rQuoteItems.reduce((s,i)=>s+i.total_price,0);
  const discount = parseInt((document.getElementById('r-discount')||{}).value)||0;
  const installFee = parseInt((document.getElementById('r-install-fee')||{}).value)||0;
  const deposit = parseInt((document.getElementById('r-deposit')||{}).value)||0;
  const supply = sub - discount + installFee;
  const vat = Math.round(supply*0.1);
  document.getElementById('r-ps-subtotal').textContent = fmt(sub)+' 원';
  document.getElementById('r-ps-supply').textContent = fmt(supply)+' 원';
  document.getElementById('r-ps-vat').textContent = fmt(vat)+' 원';
  document.getElementById('r-ps-total').textContent = fmt(supply+vat+deposit)+' 원';
}

async function rSaveQuote() {
  const company = document.getElementById('r-company').value.trim();
  if (!company) { showToast('회사명을 입력하세요','error'); return; }
  if (!rQuoteItems.length) { showToast('제품을 1개 이상 추가하세요','error'); return; }
  if (!db) { showToast('DB 연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.','error'); return; }
  const btn = document.querySelector('[onclick="rSaveQuote()"]');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
  try {
    const sub = rQuoteItems.reduce((s,i)=>s+i.total_price,0);
    const discount = parseInt(document.getElementById('r-discount').value)||0;
    const installFee = parseInt(document.getElementById('r-install-fee').value)||0;
    const deposit = parseInt(document.getElementById('r-deposit').value)||0;
    const supply = sub - discount + installFee;
    const vat = Math.round(supply*0.1);
    const total = supply + vat + deposit;
    if (!rCurrentShareToken) rCurrentShareToken = crypto.randomUUID();
    const qNum = (document.getElementById('r-quote-num')||{}).value || rInitQuoteNum();
    const payload = {
      quote_number: qNum, share_token: rCurrentShareToken,
      company_name: company,
      contact_name: (document.getElementById('r-contact')||{}).value||null,
      contact_tel: (document.getElementById('r-phone')||{}).value||null,
      contact_email: (document.getElementById('r-email')||{}).value||null,
      rental_type: rCurrentType,
      rental_duration: parseInt((document.getElementById('r-duration')||{}).value)||null,
      rental_start_date: (document.getElementById('r-start-date')||{}).value||null,
      rental_end_date: (document.getElementById('r-end-date')||{}).value||null,
      delivery_location: (document.getElementById('r-delivery-loc')||{}).value||null,
      return_method: (document.getElementById('r-return-method')||{}).value||null,
      subtotal:sub, discount_amount:discount, installation_fee:installFee,
      deposit, supply_price:supply, vat, total, status:'draft',
      memo: (document.getElementById('r-memo')||{}).value||null,
      valid_until: (document.getElementById('r-valid')||{}).value||null,
      sales_name: (document.getElementById('r-sales-name')||{}).value||null,
      sales_phone: (document.getElementById('r-sales-phone')||{}).value||null,
      sales_email: (document.getElementById('r-sales-email')||{}).value||null,
    };
    let qId = rCurrentQuoteId;
    if (qId) {
      let {error} = await db.from('rental_quotes').update(payload).eq('id',qId);
      if (error && error.message && error.message.includes('column')) {
        const {sales_name,sales_phone,sales_email,...basePayload} = payload;
        ({error} = await db.from('rental_quotes').update(basePayload).eq('id',qId));
      }
      if (error) throw new Error('렌탈 견적 업데이트 실패: '+error.message);
    } else {
      let {data,error} = await db.from('rental_quotes').insert(payload).select().single();
      if (error && error.message && error.message.includes('column')) {
        const {sales_name,sales_phone,sales_email,...basePayload} = payload;
        ({data,error} = await db.from('rental_quotes').insert(basePayload).select().single());
      }
      if (error) throw new Error('렌탈 견적 생성 실패: '+error.message);
      qId = data.id; rCurrentQuoteId = qId;
    }
    const {error:delErr} = await db.from('rental_quote_items').delete().eq('quote_id',qId);
    if (delErr) throw new Error('기존 품목 삭제 실패: '+delErr.message);
    const {error:itemErr} = await db.from('rental_quote_items').insert(rQuoteItems.map((it,i)=>({
      quote_id:qId, product_id:it.product_id||null, product_name:it.product_name,
      product_spec:it.product_spec, rental_type:it.rental_type,
      unit_price:it.unit_price, quantity:it.quantity, item_duration:(it.item_duration||1), total_price:it.total_price, sort_order:i,
      brand: it.brand||null, category: it.category||null,
      info_url: it.info_url || null
    })));
    if (itemErr) throw new Error('렌탈 품목 저장 실패: '+itemErr.message);
    showToast('렌탈 견적이 저장되었습니다 ✅','success'); rLoadHistory();
  } catch(e) {
    console.error('rSaveQuote 오류:', e);
    showToast('저장 실패: '+e.message, 'error');
    alert('⚠️ 저장 실패\n' + e.message + '\n\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '💾 저장'; }
  }
}

function rPreviewQuote() {
  if (!rQuoteItems.length) { showToast('제품을 추가하세요', 'error'); return; }
  if (!rCurrentQuoteId) { showToast('💾 먼저 저장 버튼을 눌러주세요', 'error'); return; }
  const co = v => (document.getElementById(v)||{}).value||'';
  const company=co('r-company')||'(미입력)', contact=co('r-contact'), phone=co('r-phone'), email=co('r-email');
  const salesName=co('r-sales-name'), salesPhone=co('r-sales-phone'), salesEmail=co('r-sales-email'), salesDept=co('r-sales-dept');
  const qNum=co('r-quote-num'), duration=co('r-duration'), startDate=co('r-start-date')||'-';
  const endDate=co('r-end-date')||'-';
  const deliveryLoc=co('r-delivery-loc')||'-', returnMethod=co('r-return-method')||'-';
  const memo=co('r-memo'), validUntil=co('r-valid');
  const sub = rQuoteItems.reduce((s,i)=>s+i.total_price,0);
  const discount=parseInt(co('r-discount'))||0, installFee=parseInt(co('r-install-fee'))||0;
  const deposit=parseInt(co('r-deposit'))||0;
  const supply=sub-discount+installFee, vat=Math.round(supply*0.1), total=supply+vat+deposit;
  const today=new Date().toLocaleDateString('ko-KR');
  const rIntroHtml = '<a href="https://buneed-estimate.vercel.app/Buneed.pdf" target="_blank" class="q-intro-btn" style="display:inline-block;padding:3px 12px;border:1.5px solid #1B3A6B;border-radius:99px;font-size:11px;color:#1B3A6B;font-weight:600;text-decoration:none;background:#fff;margin-top:4px;">회사소개서</a>';
  const durationLabel = rCurrentType==='일'?`${duration}일`:`${duration}개월`;
  // endDate 자동계산 (종료일 없으면 시작일+기간으로 계산)
  let computedEndDate = endDate;
  if ((!computedEndDate || computedEndDate==='-') && startDate && startDate!=='-' && parseInt(duration)>0) {
    try {
      const sd = new Date(startDate);
      if (rCurrentType==='일') sd.setDate(sd.getDate()+parseInt(duration)-1);
      else sd.setMonth(sd.getMonth()+parseInt(duration));
      if(!isNaN(sd)) computedEndDate = sd.toISOString().split('T')[0];
    } catch(e){}
  }
  const itemsHtml = rQuoteItems.map((item,i)=>{
    const isLast = i === rQuoteItems.length - 1;
    const rowBorder = isLast ? '1px solid #1a56a0' : '1px solid #e8edf5';
    return `
    <tr>
      <td style="text-align:center;font-size:11px;color:#64748b;border-bottom:${rowBorder};">${i+1}</td>
      <td style="text-align:center;padding:6px 8px;border-bottom:${rowBorder};min-width:70px;vertical-align:middle;">
        <div style="font-size:10.5px;font-weight:700;color:#1B3A6B;white-space:nowrap;">${item.brand||''}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px;">${item.category||''}</div>
      </td>
      <td style="padding:8px 10px;border-bottom:${rowBorder};min-width:120px;">
        <div style="font-weight:700;font-size:12.5px;color:#1e293b;">${item.product_name}</div>
        ${item.product_spec?`<div style="font-size:10.5px;color:#475569;margin-top:2px;line-height:1.4;">${fmtSpec(item.product_spec)}</div>`:''}
      </td>
      <td style="text-align:center;border-bottom:${rowBorder};vertical-align:middle;">
        <span style="background:${item.rental_type==='일'?'#fef3c7':'#dbeafe'};color:${item.rental_type==='일'?'#d97706':'#1a56a0'};padding:2px 7px;border-radius:99px;font-size:10px;font-weight:600;">${item.rental_type}</span>
      </td>
      <td style="text-align:right;white-space:nowrap;font-weight:600;font-size:12px;min-width:90px;border-bottom:${rowBorder};">${fmt(item.unit_price)}원</td>
      <td style="text-align:center;font-weight:600;border-bottom:${rowBorder};white-space:nowrap;font-size:11px;">
        ${item.quantity} × ${item.item_duration||1}${item.rental_type==='일'?'일':'개월'}
      </td>
      <td style="text-align:right;font-weight:700;white-space:nowrap;font-size:12px;color:#1B3A6B;border-bottom:${rowBorder};">${fmt(item.total_price)}원</td>
    </tr>`
  }).join('');
  const html = `
  <div class="qdoc">
    <div class="q-header">
      <div style="text-align:left;">
        <h1 style="color:#1B3A6B;font-size:28px;font-weight:800;letter-spacing:0.05em;margin:0 0 8px 0;text-align:left;">렌탈 견적서</h1>
        <div class="q-header-meta" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;">
          <div class="q-date">견적번호: ${qNum}</div>
          <div class="q-date">작성일: ${today}</div>
        </div>
      </div>
      <div class="q-logo-area" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <img src="${LOGO_SRC}" alt="비유니드"><br>
        
        ${rIntroHtml}
      </div>
    </div>
    <div class="q-section">
      <div class="q-party-grid">
        <!-- 수신 박스 -->
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
        <!-- 공급 박스 -->
        <div style="border:1px solid #b8cde8;border-radius:6px;overflow:hidden;">
          <div style="background:#1B3A6B;padding:7px 14px;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:13px;font-weight:700;color:#fff;letter-spacing:0.1em;">공 급</span>
          </div>
          <div style="background:#fff;padding:10px 12px;">
            <table style="font-size:12px;width:100%;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:3px 0;width:32%;font-size:11px;">업체명</td><td style="font-weight:700;color:#1e293b;">(주)비유니드</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">담당자</td><td>${salesName||'-'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">연락처</td><td>${salesPhone||'031.8028.0464'}</td></tr>
              <tr><td style="color:#64748b;padding:3px 0;font-size:11px;">이메일</td><td>${salesEmail||'sales@buneed.co.kr'}</td></tr>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="q-rental-info-box" style="border:1px solid #d0d8ee;border-radius:6px;overflow:hidden;margin-bottom:14px;">
      <div style="background:transparent;">
        <div class="q-rental-info-grid" style="display:grid;grid-template-columns:1fr 1fr;">
          <div style="display:flex;align-items:baseline;gap:6px;padding:8px 14px;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;"><span style="font-size:10px;color:#1e6fd9;font-weight:600;min-width:52px;white-space:nowrap;">렌탈 시작일</span><span style="font-size:12px;font-weight:700;color:#1e293b;">${startDate||'-'}</span></div>
          <div style="display:flex;align-items:baseline;gap:6px;padding:8px 14px;border-bottom:1px solid #e2e8f0;"><span style="font-size:10px;color:#1e6fd9;font-weight:600;min-width:52px;white-space:nowrap;">렌탈 종료일</span><span style="font-size:12px;font-weight:700;color:#1e293b;">${computedEndDate||'-'}</span></div>
          <div style="display:flex;align-items:baseline;gap:6px;padding:8px 14px;${memo?'border-bottom:1px solid #e2e8f0;':''}border-right:1px solid #e2e8f0;"><span style="font-size:10px;color:#1e6fd9;font-weight:600;min-width:52px;white-space:nowrap;">견적 유효기간</span><span style="font-size:12px;font-weight:700;color:#1e293b;">${validUntil||'견적일로부터 30일'}</span></div>
          <div style="display:flex;align-items:baseline;gap:6px;padding:8px 14px;${memo?'border-bottom:1px solid #e2e8f0;':''}"><span style="font-size:10px;color:#1e6fd9;font-weight:600;min-width:52px;white-space:nowrap;">반납/회수</span><span style="font-size:12px;font-weight:700;color:#1e293b;">${returnMethod||'-'}</span></div>
          ${memo?`<div style="grid-column:1/-1;display:flex;align-items:baseline;gap:6px;padding:8px 14px;"><span style="font-size:10px;color:#1e6fd9;font-weight:600;min-width:52px;white-space:nowrap;">특이사항</span><span style="font-size:12px;font-weight:700;color:#374151;line-height:1.5;flex:1;">${memo}</span></div>`:''}
        </div>
      </div>
    </div>
            <div class="q-section">
      <div class="r-q-section-title">▪ 견적 내용</div>
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
      <table class="q-table">
        <thead><tr><th style="width:24px;text-align:center;font-size:10px;">No</th><th style="text-align:center;width:65px;font-size:11px;">브랜드</th><th style="text-align:left;min-width:120px;">제품명 / 사양</th><th style="text-align:center;width:45px;font-size:11px;">단위</th><th style="text-align:right;width:72px;font-size:11px;">단가</th><th style="text-align:center;width:80px;white-space:nowrap;font-size:11px;">수량×기간</th><th style="text-align:right;width:80px;font-size:11px;">금액</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      </div>
    </div>
    <table class="q-summary-table">
      <tr><td>소 계</td><td>${fmt(sub)} 원</td></tr>
      ${discount>0?`<tr><td style="color:#ef4444;">할인</td><td style="color:#ef4444;">- ${fmt(discount)} 원</td></tr>`:''}
      <tr><td style="font-weight:600;">공급가액</td><td style="font-weight:600;">${fmt(supply)} 원</td></tr>
      <tr><td>부가세 (10%)</td><td>${fmt(vat)} 원</td></tr>
      <tr class="r-q-total-row"><td>합 계</td><td>${fmt(total)} 원</td></tr>
    </table>

    <div class="q-spacer"></div>
    <div class="q-footer-bar">(주) 비유니드 | 경기도 하남시 미사강변한강로 135 다동 4층 445호 | 031.8028.0464 | www.buneed.co.kr</div>
  </div>`;
  _lastPreviewHtml = html;
  document.getElementById('r-preview-content').innerHTML = html;
  openModal('r-modal-preview');
}

function rPrintQuote() {
  const modal = document.getElementById('r-modal-preview');
  if (!modal || !modal.classList.contains('open')) {
    rPreviewQuote();
    setTimeout(() => window.print(), 500);
    return;
  }
  window.print();
}

async function rCopyShareLink() {
  if (!rCurrentQuoteId) { showToast('먼저 저장하세요','error'); return; }
  const url = location.origin+'/quote-view.html?token='+rCurrentShareToken+'&type=rental';
  await navigator.clipboard.writeText(url);
  showToast('렌탈 공유 링크가 복사되었습니다 🔗','success');
}

async function rLoadHistory() {
  const body = document.getElementById('r-history-body');
  const cardList = document.getElementById('r-history-card-list');
  if (!body) return;

  body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted)">로딩 중...</td></tr>';
  if (cardList) cardList.innerHTML = '<div class="history-card-loading">로딩 중...</div>';

  try {
    const { data, error } = await db.from('rental_quotes').select('*').order('created_at',{ascending:false});
    if (error) {
      body.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:24px;color:#ef4444">데이터 로드 오류: ${error.message}</td></tr>`;
      if (cardList) cardList.innerHTML = `<div class="history-card-empty">데이터 로드 오류: ${error.message}</div>`;
      return;
    }
    if (!data?.length) {
      body.innerHTML='<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8">저장된 렌탈 견적이 없습니다</td></tr>';
      if (cardList) cardList.innerHTML = '<div class="history-card-empty">📭 저장된 렌탈 견적이 없습니다</div>';
      return;
    }

    const typeLabel = t => t==='일' ? '일 단위' : '월 단위';

    // ── 테이블 렌더링 (데스크탑) ──
    body.innerHTML = data.map(q=>`
      <tr data-search="${(q.company_name||'').toLowerCase()} ${(q.contact_name||'').toLowerCase()} ${(q.quote_number||'').toLowerCase()}">
        <td style="font-weight:700;color:#2563eb;">${q.quote_number}</td>
        <td>${new Date(q.created_at).toLocaleDateString('ko-KR')}</td>
        <td>${q.company_name||''}</td>
        <td>${q.contact_name||''}</td>
        <td><span style="font-size:11px;background:#eff6ff;color:#2563eb;padding:2px 7px;border-radius:10px;font-weight:600;">${typeLabel(q.rental_type)}</span></td>
        <td style="font-weight:700;">${fmt(q.total)}원</td>
        <td style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="btn btn-r-secondary btn-sm" onclick="rLoadQuote('${q.id}')">불러오기</button>
          ${q.share_token?`<button class="btn btn-link-copy btn-sm" onclick="copyRentalQuoteLink('${q.share_token}')">링크복사</button>`:''}
          <button class="btn btn-danger btn-sm" onclick="rDeleteQuote('${q.id}')">삭제</button>
        </td>
      </tr>`).join('');

    // ── 카드 렌더링 (모바일) ──
    if (cardList) {
      cardList.innerHTML = data.map(q=>`
        <div class="hc-card" data-search="${(q.company_name||'').toLowerCase()} ${(q.contact_name||'').toLowerCase()} ${(q.quote_number||'').toLowerCase()}">
          <div class="hc-card-top">
            <span class="hc-card-num rental">${q.quote_number||'-'}</span>
            <span class="hc-card-date">${new Date(q.created_at).toLocaleDateString('ko-KR')}</span>
            <span class="hc-card-badge">${typeLabel(q.rental_type)}</span>
          </div>
          <div class="hc-card-body">
            <div class="hc-card-company">${q.company_name||'(고객사 미입력)'}</div>
            <div class="hc-card-contact">${q.contact_name||''}${q.contact_tel?' · '+q.contact_tel:''}</div>
          </div>
          <div class="hc-card-footer">
            <span class="hc-card-total rental">₩ ${fmt(q.total)}원</span>
            <div class="hc-card-actions">
              ${q.share_token?`<button class="btn btn-link-copy btn-sm" onclick="copyRentalQuoteLink('${q.share_token}')">🔗</button>`:''}
              <button class="btn btn-r-secondary btn-sm" onclick="rLoadQuote('${q.id}')">불러오기</button>
              <button class="btn btn-danger btn-sm" onclick="rDeleteQuote('${q.id}')">🗑</button>
            </div>
          </div>
        </div>`).join('');
    }

  } catch(e) {
    if (body) body.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:24px;color:#ef4444">오류: ${e.message}</td></tr>`;
    if (cardList) cardList.innerHTML = `<div class="history-card-empty">오류: ${e.message}</div>`;
  }
}

async function rLoadQuote(qId) {
  const { data: q } = await db.from('rental_quotes').select('*').eq('id',qId).single();
  const { data: items } = await db.from('rental_quote_items').select('*').eq('quote_id',qId).order('sort_order');
  if (!q) return;
  rCurrentQuoteId = qId; rCurrentShareToken = q.share_token; rCurrentType = q.rental_type||'일';
  const setV = (id,v) => { const el=document.getElementById(id); if(el) el.value=v||''; };
  setV('r-quote-num',q.quote_number);
  setV('r-company',q.company_name); setV('r-contact',q.contact_name);
  setV('r-phone',q.contact_tel); setV('r-email',q.contact_email);
  setV('r-duration',q.rental_duration); setV('r-duration-display',q.rental_duration||'');
  setV('r-start-date',q.rental_start_date); setV('r-end-date',q.rental_end_date||''); setV('r-delivery-loc',q.delivery_location);
  setV('r-return-method',q.return_method);
  setV('r-discount',q.discount_amount||0); setV('r-install-fee',q.installation_fee||0);
  setV('r-deposit',q.deposit||0); setV('r-memo',q.memo);
  setV('r-valid',q.valid_until||'견적일로부터 30일');
  setV('r-sales-name',q.sales_name); setV('r-sales-phone',q.sales_phone);
  setV('r-sales-email',q.sales_email); setV('r-sales-dept',q.sales_dept);
  document.getElementById('r-type-toggle').querySelectorAll('.rtt-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.type===rCurrentType);
  });
  document.getElementById('r-duration-label').textContent = rCurrentType==='일'?'렌탈 기간 (일)':'렌탈 기간 (개월)';
  rQuoteItems = (items||[]).map(i=>Object.assign({},i));
  rRenderQuoteItems(); rCalcPrice();
  switchTopTab('rental', document.getElementById('ttab-rental'));
  document.querySelectorAll('#panel-rental .sub-tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  document.querySelectorAll('#panel-rental .sub-panel').forEach((p,i)=>p.classList.toggle('active',i===0));
  showToast('렌탈 견적을 불러왔습니다','success');
}

async function rDeleteQuote(qId) {
  if (!confirm('견적을 삭제하시겠습니까?')) return;
  await db.from('rental_quote_items').delete().eq('quote_id',qId);
  await db.from('rental_quotes').delete().eq('id',qId);
  showToast('삭제되었습니다','success'); rLoadHistory();
}

function rResetQuote() {
  if (!confirm('렌탈 견적을 초기화하시겠습니까?')) return;
  rQuoteItems=[]; rCurrentQuoteId=null; rCurrentShareToken=null;
  rRenderQuoteItems(); rCalcPrice();
  ['r-company','r-contact','r-phone','r-email','r-duration','r-start-date',
   'r-delivery-loc','r-return-method','r-memo','r-end-date','r-duration-display'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('r-discount').value=0;
  document.getElementById('r-install-fee').value=0;
  document.getElementById('r-deposit').value=0;
  document.getElementById('r-valid').value='견적일로부터 30일';
  rInitQuoteNum();
  showToast('초기화되었습니다','success');
}

// 렌탈 제품 관리
async function rRenderAdminProducts(forceRefresh = false) {
  const body = document.getElementById('r-admin-product-body');
  if (!body) return;
  try {
    let data;
    if (!forceRefresh && rProducts && rProducts.length > 0) {
      // 이미 rLoadRentalProducts()가 가져온 전역 데이터 재사용 → DB 중복 쿼리 없음
      data = [...rProducts].sort((a,b) => (a.category||'').localeCompare(b.category||'', 'ko'));
    } else {
      const res = await db.from('rental_products').select('*').order('category');
      if (res.error) { body.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:#ef4444">⚠️ 목록 로드 실패: '+res.error.message+'</td></tr>'; return; }
      data = res.data;
      if (data) rProducts = data; // 전역 갱신
    }
    if (!data?.length) { body.innerHTML='<tr><td colspan="8" style="text-align:center;padding:20px;color:#94a3b8">제품 없음</td></tr>'; return; }
    body.innerHTML = data.map(p=>`
      <tr>
        <td style="text-align:center;"><input type="checkbox" class="r-row-check" data-id="${p.id}" onchange="rCheckChange()" style="width:15px;height:15px;cursor:pointer;"></td>
        <td>${p.category||''}</td>
        <td>${p.brand||''}</td>
        <td style="font-weight:600;">${p.name}</td>
        <td style="font-size:11px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.spec||''}</td>
        <td style="text-align:right;font-weight:600;">${fmt(p.daily_price||0)}원</td>
        <td style="text-align:right;font-weight:600;">${fmt(p.monthly_price||0)}원</td>
        <td style="display:flex;gap:5px;">
          <button class="btn btn-r-secondary btn-sm" onclick="rOpenProductModal('${p.id}')">수정</button>
          <button class="btn btn-danger btn-sm" onclick="rDeleteProduct('${p.id}')">삭제</button>
        </td>
      </tr>`).join('');
  } catch(e) {
    console.error('rRenderAdminProducts 오류:', e);
    if (body) body.innerHTML='<tr><td colspan="8" style="text-align:center;color:#ef4444">오류 발생: '+e.message+'</td></tr>';
  }
}
function rOpenProductModal(pid) {
  rEditingProductId = pid||null;
  document.getElementById('r-pm-title').textContent = pid?'렌탈 제품 수정':'렌탈 제품 추가';
  if (pid) {
    const p = rProducts.find(x=>String(x.id)===String(pid))||{};
    document.getElementById('r-pm-name').value=p.name||'';
    document.getElementById('r-pm-brand').value=p.brand||'LG';
    document.getElementById('r-pm-category').value=p.category||'노트북';
    document.getElementById('r-pm-daily').value=p.daily_price||'';
    document.getElementById('r-pm-monthly').value=p.monthly_price||'';
    document.getElementById('r-pm-spec').value=p.spec||'';
  } else {
    ['r-pm-name','r-pm-daily','r-pm-monthly','r-pm-spec'].forEach(id=>{document.getElementById(id).value='';});
  }
  openModal('r-modal-product');
}
async function rSaveProduct() {
  const name = document.getElementById('r-pm-name').value.trim();
  if (!name) { showToast('제품명을 입력하세요','error'); return; }
  const payload = {
    name, brand:document.getElementById('r-pm-brand').value,
    category:document.getElementById('r-pm-category').value,
    daily_price:parseInt(document.getElementById('r-pm-daily').value)||0,
    monthly_price:parseInt(document.getElementById('r-pm-monthly').value)||0,
    spec:document.getElementById('r-pm-spec').value, is_active:true
  };
  try {
    let error;
    if (rEditingProductId) {
      ({ error } = await db.from('rental_products').update(payload).eq('id', rEditingProductId));
    } else {
      ({ error } = await db.from('rental_products').insert(payload));
    }
    if (error) throw new Error(error.message);
    closeModal('r-modal-product');
    await rLoadRentalProducts(); rRenderAdminProducts(true); rRenderProductList();
    showToast('저장되었습니다','success');
  } catch(e) {
    console.error('rSaveProduct 오류:', e);
    showToast('⚠️ 저장 실패: ' + (e.message||e), 'error');
    alert('⚠️ 렌탈 제품 저장 실패\n' + (e.message||e) + '\n\n브라우저 콘솔(F12)에서 자세한 오류를 확인하세요.');
  }
}
async function rDeleteProduct(pid) {
  if (!confirm('렌탈 제품을 삭제하시겠습니까?')) return;
  const { error } = await db.from('rental_products').delete().eq('id',pid);
  if (error) { showToast('⚠️ 삭제 실패: ' + error.message, 'error'); return; }
  await rLoadRentalProducts(); rRenderAdminProducts(true); rRenderProductList();
  showToast('삭제되었습니다','success');
}

// ===== 렌탈 제품 체크박스 일괄 삭제 =====
function rToggleAll(cb) {
  document.querySelectorAll('.r-row-check').forEach(c => c.checked = cb.checked);
  rCheckChange();
}
function rCheckChange() {
  const checked = document.querySelectorAll('.r-row-check:checked');
  const btn = document.getElementById('r-bulk-del-btn');
  if (btn) btn.style.display = checked.length > 0 ? '' : 'none';
  const all = document.querySelectorAll('.r-row-check');
  const allCb = document.getElementById('r-check-all');
  if (allCb) allCb.indeterminate = checked.length > 0 && checked.length < all.length;
  if (allCb && checked.length === all.length && all.length > 0) allCb.checked = true;
  if (allCb && checked.length === 0) allCb.checked = false;
}
async function rBulkDelete() {
  const checked = [...document.querySelectorAll('.r-row-check:checked')];
  if (!checked.length) return;
  if (!confirm(`선택한 ${checked.length}개 렌탈 제품을 삭제하시겠습니까?`)) return;
  const ids = checked.map(c => c.dataset.id);
  const { error } = await db.from('rental_products').delete().in('id', ids);
  if (error) { showToast('삭제 오류: ' + error.message, 'error'); return; }
  showToast(`${ids.length}개 렌탈 제품이 삭제되었습니다`, 'success');
  await rLoadRentalProducts(); rRenderAdminProducts(true); rRenderProductList();
  document.getElementById('r-check-all').checked = false;
  const btn = document.getElementById('r-bulk-del-btn');
  if (btn) btn.style.display = 'none';
}
